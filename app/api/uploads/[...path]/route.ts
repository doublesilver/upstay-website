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
import { UPLOAD_DIR, DATA_DIR, UPLOAD_DIR_RESOLVED } from "@/lib/paths";

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
// Cloudflare PoP miss 폭주 시 N+1번째부터는 짧게 대기 후 진입.
// precomputed 사본 streaming은 가벼우나 fallback sharp 변환·tiered cache miss 시 무거움.
// MAX는 OCPU 여유 가늠치(0.125코어 × 약 50ms/sharp 1장).
const MAX_CONCURRENT = 6;
const SLOT_TIMEOUT_MS = 10_000;
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
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
        console.warn(
          "[uploads GET] precomputed stat 실패:",
          precomputedPath,
          (e as Error).message,
        );
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
