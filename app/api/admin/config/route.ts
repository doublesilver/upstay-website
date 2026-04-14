import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!verifyToken(req)) return unauthorized();
  const db = getDb();
  const rows = db.prepare("SELECT key, value FROM site_config").all() as {
    key: string;
    value: string;
  }[];
  const config: Record<string, string> = {};
  for (const row of rows) config[row.key] = row.value;
  return Response.json(config);
}

export async function PUT(req: NextRequest) {
  if (!verifyToken(req)) return unauthorized();
  const body = await req.json();
  const db = getDb();
  const stmt = db.prepare(
    "INSERT OR REPLACE INTO site_config (key, value) VALUES (?, ?)",
  );
  for (const [key, value] of Object.entries(body)) {
    stmt.run(key, value as string);
  }
  return Response.json({ ok: true });
}
