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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
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
      return new Response("Not found", { status: 404 });
    }
    throw e;
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
          limitInputPixels: 24_000_000,
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
