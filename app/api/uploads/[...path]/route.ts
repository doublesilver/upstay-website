import { NextRequest } from "next/server";
import { stat, realpath } from "fs/promises";
import { createReadStream } from "fs";
import { Readable } from "stream";
import path from "path";
import { jwtVerify } from "jose";
import { UPLOAD_DIR, UPLOAD_DIR_RESOLVED } from "@/lib/paths";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

// OCI 1/8 OCPU origin 보호 — 동시 image 요청을 N개로 제한.
// 사용자 페이지는 R2(img.upstay.co.kr) 직접 서빙이라 이 라우트는 거의 admin 트래픽만 처리.
// admin은 인증된 신뢰 트래픽 + 사례 카드 N장 동시 fetch 패턴이라 semaphore 건너뜀.
// 익명 트래픽(R2 fallback, 외부 봇)만 24개 동시 제한.
const MAX_CONCURRENT = 24;
const SLOT_TIMEOUT_MS = 15_000;
let activeRequests = 0;
async function acquireSlot(signal: AbortSignal): Promise<boolean> {
  const deadline = Date.now() + SLOT_TIMEOUT_MS;
  while (activeRequests >= MAX_CONCURRENT) {
    if (signal.aborted) return false;
    if (Date.now() > deadline) return false;
    await new Promise((r) => setTimeout(r, 30));
  }
  if (signal.aborted) return false;
  activeRequests++;
  return true;
}
function releaseSlot() {
  activeRequests--;
}

// admin 인증 쿠키 보유 트래픽은 신뢰. semaphore 건너뜀.
// 쿠키 이름은 lib/auth.ts의 AUTH_COOKIE와 동일 — 순환 import 회피 위해 string literal.
//
// 단순히 쿠키 존재 여부만 확인하면 외부 공격자가 `upstay_admin_token=anything`을
// 보내 semaphore를 우회해 1/8 OCPU 보호선을 뚫을 수 있다. JWT 서명을 실제로
// 검증해야 안전. 동일 요청에서 검증을 두 번 안 하도록 결과는 1회만 계산.
const AUTH_COOKIE_NAME = "upstay_admin_token";

let secretBytesCache: Uint8Array | null = null;
let secretBytesWarned = false;
function getSecretBytes(): Uint8Array | null {
  if (secretBytesCache) return secretBytesCache;
  const v = process.env.JWT_SECRET;
  if (!v || v.length < 32) {
    if (!secretBytesWarned) {
      console.error(
        "[uploads] JWT_SECRET missing or shorter than 32 bytes — admin traffic semaphore skip disabled",
      );
      secretBytesWarned = true;
    }
    return null;
  }
  secretBytesCache = new TextEncoder().encode(v);
  return secretBytesCache;
}

async function isAuthenticatedTraffic(req: NextRequest): Promise<boolean> {
  const token = req.cookies?.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return false;
  const secret = getSecretBytes();
  if (!secret) return false;
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  if (await isAuthenticatedTraffic(req)) {
    // admin 트래픽 — semaphore 건너뜀
    return handleGet(req, params);
  }
  const acquired = await acquireSlot(req.signal);
  if (!acquired) {
    return new Response("Too Many Requests", { status: 429 });
  }
  try {
    return await handleGet(req, params);
  } finally {
    releaseSlot();
  }
}

async function handleGet(
  req: NextRequest,
  paramsPromise: Promise<{ path: string[] }>,
) {
  const { path: segments } = await paramsPromise;
  if (segments.length === 0) {
    return new Response("Not found", { status: 404 });
  }
  const filename = segments.join("/");
  if (filename.includes("\0")) {
    return new Response("Not found", { status: 404 });
  }
  const ext = path.extname(filename).toLowerCase();
  const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
  if (!ALLOWED_EXT.includes(ext)) {
    return new Response("Not found", { status: 404 });
  }
  const filePath = path.resolve(UPLOAD_DIR, filename);

  if (!filePath.startsWith(UPLOAD_DIR_RESOLVED + path.sep)) {
    return new Response("Not found", { status: 404 });
  }

  let resolvedPath: string;
  try {
    resolvedPath = await realpath(filePath);
  } catch (e: unknown) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") {
      // Fallback: .thumb.webp / .medium.webp 가 아직 안 만들어졌으면 원본으로
      const m = filename.match(/^(.+)\.(thumb|medium)\.webp$/);
      if (m) {
        const origPath = path.resolve(UPLOAD_DIR, m[1]);
        if (origPath.startsWith(UPLOAD_DIR_RESOLVED + path.sep)) {
          try {
            resolvedPath = await realpath(origPath);
          } catch {
            return new Response("Not found", { status: 404 });
          }
        } else {
          return new Response("Not found", { status: 404 });
        }
      } else {
        return new Response("Not found", { status: 404 });
      }
    } else {
      throw e;
    }
  }

  if (!resolvedPath.startsWith(UPLOAD_DIR_RESOLVED + path.sep)) {
    return new Response("Not found", { status: 404 });
  }

  const fileStat = await stat(resolvedPath);
  if (!fileStat.isFile()) {
    return new Response("Not found", { status: 404 });
  }

  // Accept 협상(avif/webp) 제거 — CDN(Cloudflare)이 Vary:Accept를 무시하고 avif를
  // URL당 단일 캐시로 굳혀, avif 미지원(Safari14–15·일부 인앱) 브라우저에서 상세
  // 갤러리 이미지가 깨졌다(검수 H-1). .thumb.webp/.medium.webp는 이미 포맷 확정 URL이라
  // 협상 이득이 없다. 요청된 확장자 그대로 결정적 단일 표현으로 서빙하고, Vary 헤더도
  // 보내지 않아 CDN이 URL당 캐시 1개만 갖게 한다(arm-big Caddy의 header_up -Accept /
  // header_down -Vary 와 origin을 일원화).
  const contentType = MIME[ext] ?? "application/octet-stream";
  const nodeStream = createReadStream(resolvedPath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;

  return new Response(webStream, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(fileStat.size),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
