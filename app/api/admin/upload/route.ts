import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { verifyToken, unauthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

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

    const ext = path.extname(file.name) || ".jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(UPLOAD_DIR, filename), buffer);
    saved.push(filename);
  }

  return Response.json({
    files: saved,
    urls: saved.map((f) => `/api/uploads/${f}`),
  });
}
