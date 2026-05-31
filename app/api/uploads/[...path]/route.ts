import { NextRequest } from "next/server";
import {
  stat,
  mkdir,
  readFile,
  writeFile,
  realpath,
  readdir,
  unlink,
} from "fs/promises";
import { createReadStream, existsSync } from "fs";
import { Readable } from "stream";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import { jwtVerify } from "jose";
import { UPLOAD_DIR, DATA_DIR, UPLOAD_DIR_RESOLVED } from "@/lib/paths";
import { logError, logWarn } from "@/lib/log";

const CACHE_DIR = path.join(DATA_DIR, "cache");
const CACHE_MAX_BYTES = 500 * 1024 * 1024;
const CACHE_MAX_FILES = 5000;

async function cleanupCache(dir: string, maxBytes: number, maxFiles: number) {
  let entries: { file: string; mtime: number; size: number }[];
  try {
    const names = await readdir(dir);
    entries = await Promise.all(
      names.map(async (name) => {
        const file = path.join(dir, name);
        const s = await stat(file);
        return { file, mtime: s.mtimeMs, size: s.size };
      }),
    );
  } catch {
    return;
  }

  entries.sort((a, b) => a.mtime - b.mtime);

  let totalBytes = entries.reduce((sum, e) => sum + e.size, 0);
  let totalFiles = entries.length;

  for (const entry of entries) {
    if (totalBytes <= maxBytes && totalFiles <= maxFiles) break;
    try {
      await unlink(entry.file);
      totalBytes -= entry.size;
      totalFiles -= 1;
    } catch {}
  }
}

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
  const accept = req.headers.get("accept") ?? "";

  let targetFormat: "avif" | "webp" | null = null;
  if (ext !== ".gif") {
    if (accept.includes("image/avif")) {
      targetFormat = "avif";
    } else if (accept.includes("image/webp") && ext !== ".webp") {
      targetFormat = "webp";
    }
  }

  if (targetFormat) {
    // 1순위: 업로드 시점에 미리 만들어둔 .webp / .avif 사본 (Upload route의 precomputeVariants).
    // 첫 요청부터 sharp 변환 없이 정적 streaming — Railway CPU 0, 응답 <50ms.
    const precomputedPath = `${resolvedPath}.${targetFormat}`;
    try {
      const precomputedStat = await stat(precomputedPath);
      if (precomputedStat.isFile()) {
        const stream = createReadStream(precomputedPath);
        const webStream = Readable.toWeb(stream) as ReadableStream;
        return new Response(webStream, {
          headers: {
            "Content-Type": `image/${targetFormat}`,
            "Content-Length": String(precomputedStat.size),
            "Cache-Control": "public, max-age=31536000, immutable",
            Vary: "Accept",
          },
        });
      }
    } catch (e) {
      // ENOENT는 정상(기존 업로드는 사본 없음) — 아래 변환 fallback으로 진행.
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") {
        logWarn("uploads", "precomputed stat 실패", {
          precomputedPath,
          err: (e as Error).message,
        });
      }
    }

    // 2순위: 기존 업로드용 fallback — sha1 해시 키로 변환 캐시 (변환 후 디스크 저장).
    try {
      await mkdir(CACHE_DIR, { recursive: true });

      const cacheKey = crypto
        .createHash("sha1")
        .update(`${resolvedPath}:${fileStat.mtimeMs}:${targetFormat}`)
        .digest("hex");
      const cachePath = path.join(CACHE_DIR, `${cacheKey}.${targetFormat}`);

      let buffer: Buffer;
      if (existsSync(cachePath)) {
        buffer = await readFile(cachePath);
      } else {
        const sharpOpts = {
          // 업로드 게이트(100MP)와 동일 한도. 업로드된 파일은 이미 2048px로 다운스케일돼
          // 4MP 이내가 정상이지만 gif 등 원본 저장 경로를 위한 약간의 여유.
          limitInputPixels: 100_000_000,
          failOn: "truncated" as const,
        };
        buffer =
          targetFormat === "avif"
            ? await sharp(resolvedPath, sharpOpts)
                .avif({ quality: 80 })
                .toBuffer()
            : await sharp(resolvedPath, sharpOpts)
                .webp({ quality: 80 })
                .toBuffer();
        await writeFile(cachePath, buffer);
        if (Math.random() < 0.01)
          cleanupCache(CACHE_DIR, CACHE_MAX_BYTES, CACHE_MAX_FILES).catch(
            () => {},
          );
      }

      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type": `image/${targetFormat}`,
          "Content-Length": String(buffer.length),
          "Cache-Control": "public, max-age=31536000, immutable",
          Vary: "Accept",
        },
      });
    } catch {
      // 변환 실패 시 원본 서빙으로 폴백
    }
  }

  const contentType = MIME[ext] ?? "application/octet-stream";
  const nodeStream = createReadStream(resolvedPath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;

  return new Response(webStream, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(fileStat.size),
      "Cache-Control": "public, max-age=31536000, immutable",
      Vary: "Accept",
    },
  });
}
