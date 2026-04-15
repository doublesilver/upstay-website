import { readFile, writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";

const FILE_PATH = path.join(process.cwd(), "visual-editor-changes.json");

export async function GET() {
  try {
    const data = await readFile(FILE_PATH, "utf-8");
    return NextResponse.json(JSON.parse(data));
  } catch {
    return NextResponse.json({ changes: [] });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  await writeFile(FILE_PATH, JSON.stringify(body, null, 2));
  return NextResponse.json({ ok: true });
}
