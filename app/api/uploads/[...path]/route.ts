import { NextRequest } from "next/server";
import { stat, mkdir, readFile, writeFile } from "fs/promises";
import { createReadStream, existsSync } from "fs";
import { Readable } from "stream";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import { UPLOAD_DIR, DATA_DIR } from "@/lib/paths";

const CACHE_DIR = path.join(DATA_DIR, "cache");

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
  const filename = segments.join("/");
  const filePath = path.resolve(UPLOAD_DIR, filename);

  if (!filePath.startsWith(path.resolve(UPLOAD_DIR)) || !existsSync(filePath)) {
    return new Response("Not found", { status: 404 });
  }

  const fileStat = await stat(filePath);
  if (!fileStat.isFile()) {
    return new Response("Not found", { status: 404 });
  }

  const ext = path.extname(filename).toLowerCase();
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
        .update(`${filePath}:${fileStat.mtimeMs}:${targetFormat}`)
        .digest("hex");
      const cachePath = path.join(CACHE_DIR, `${cacheKey}.${targetFormat}`);

      let buffer: Buffer;
      if (existsSync(cachePath)) {
        buffer = await readFile(cachePath);
      } else {
        buffer =
          targetFormat === "avif"
            ? await sharp(filePath).avif({ quality: 80 }).toBuffer()
            : await sharp(filePath).webp({ quality: 80 }).toBuffer();
        await writeFile(cachePath, buffer);
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
  const nodeStream = createReadStream(filePath);
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
