import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { randomBytes } from "crypto";
import path from "path";
import sharp from "sharp";
import { verifyToken, unauthorized } from "@/lib/auth";
import { UPLOAD_DIR } from "@/lib/paths";

export const dynamic = "force-dynamic";

const MAGIC_NUMBERS: Record<string, number[][]> = {
  jpg: [[0xff, 0xd8, 0xff]],
  png: [[0x89, 0x50, 0x4e, 0x47]],
  gif: [[0x47, 0x49, 0x46, 0x38]],
  webp: [[0x52, 0x49, 0x46, 0x46]],
};

const MAX_DIMENSION = 2048;
const QUALITY = 85;

function checkMagic(buffer: Buffer, ext: string): boolean {
  const normalized = ext.replace(".", "").replace("jpeg", "jpg");
  const magics = MAGIC_NUMBERS[normalized];
  if (!magics) return false;
  return magics.some((magic) => magic.every((b, i) => buffer[i] === b));
}

async function optimize(buffer: Buffer, ext: string): Promise<Buffer> {
  const normalizedExt = ext
    .replace(".", "")
    .toLowerCase()
    .replace("jpeg", "jpg");
  if (normalizedExt === "gif") {
    return buffer;
  }
  let pipeline = sharp(buffer, {
    animated: false,
    limitInputPixels: 24_000_000,
    failOn: "truncated",
  })
    .rotate()
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    });
  if (normalizedExt === "png") {
    pipeline = pipeline.png({ compressionLevel: 9, adaptiveFiltering: true });
  } else if (normalizedExt === "webp") {
    pipeline = pipeline.webp({ quality: QUALITY });
  } else {
    pipeline = pipeline.jpeg({
      quality: QUALITY,
      progressive: true,
      mozjpeg: true,
    });
  }
  return await pipeline.toBuffer();
}

export async function POST(req: NextRequest) {
  if (!(await verifyToken(req))) return unauthorized();

  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }

  const formData = await req.formData();
  const files = formData.getAll("files") as File[];

  if (files.length === 0) {
    return Response.json({ error: "No files" }, { status: 400 });
  }

  const saved: string[] = [];

  for (const file of files) {
    if (file.size > 20 * 1024 * 1024) {
      return Response.json(
        { error: `${file.name} exceeds 20MB` },
        { status: 400 },
      );
    }

    const ext = path.extname(file.name).toLowerCase() || ".jpg";
    const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    if (!ALLOWED_EXT.includes(ext)) {
      return Response.json(
        { error: `${file.name}: 허용되지 않는 파일 형식` },
        { status: 400 },
      );
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!checkMagic(buffer, ext)) {
      return Response.json(
        { error: `${file.name}: 파일 내용이 확장자와 일치하지 않습니다` },
        { status: 400 },
      );
    }
    let optimizedBuffer: Buffer;
    try {
      optimizedBuffer = await optimize(buffer, ext);
    } catch (e) {
      console.warn(
        "[upload] sharp 최적화 실패, 원본 저장:",
        (e as Error).message,
      );
      optimizedBuffer = buffer;
    }
    const filename = `${Date.now()}-${randomBytes(8).toString("hex")}${ext}`;
    await writeFile(path.join(UPLOAD_DIR, filename), optimizedBuffer);
    saved.push(filename);
  }

  return Response.json({
    files: saved,
    urls: saved.map((f) => `/api/uploads/${f}`),
  });
}
