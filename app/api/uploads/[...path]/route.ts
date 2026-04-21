import { NextRequest } from "next/server";
import { stat } from "fs/promises";
import { createReadStream, existsSync } from "fs";
import { Readable } from "stream";
import path from "path";
import { UPLOAD_DIR } from "@/lib/paths";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function GET(
  _req: NextRequest,
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
  const contentType = MIME[ext] || "application/octet-stream";

  const nodeStream = createReadStream(filePath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;

  return new Response(webStream, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(fileStat.size),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
