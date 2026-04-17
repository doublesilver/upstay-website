import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { verifyToken, unauthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

const MAGIC_NUMBERS: Record<string, number[][]> = {
  jpg: [[0xff, 0xd8, 0xff]],
  png: [[0x89, 0x50, 0x4e, 0x47]],
  gif: [[0x47, 0x49, 0x46, 0x38]],
  webp: [[0x52, 0x49, 0x46, 0x46]],
};

function checkMagic(buffer: Buffer, ext: string): boolean {
  const normalized = ext.replace(".", "").replace("jpeg", "jpg");
  const magics = MAGIC_NUMBERS[normalized];
  if (!magics) return false;
  return magics.some((magic) => magic.every((b, i) => buffer[i] === b));
}

export async function POST(req: NextRequest) {
  if (!verifyToken(req)) return unauthorized();

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
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    await writeFile(path.join(UPLOAD_DIR, filename), buffer);
    saved.push(filename);
  }

  return Response.json({
    files: saved,
    urls: saved.map((f) => `/api/uploads/${f}`),
  });
}
