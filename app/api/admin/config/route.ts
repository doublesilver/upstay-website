import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken, unauthorized } from "@/lib/auth";
import { invalidatePublicCache } from "@/lib/cache";
import { ALLOWED_KEYS } from "@/lib/config-schema";
import { configUpdateSchema } from "@/lib/admin-schemas";

export async function GET(req: NextRequest) {
  if (!(await verifyToken(req))) return unauthorized();

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
  if (!(await verifyToken(req))) return unauthorized();

  const body = await req.json();
  const parsed = configUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }
  const db = getDb();
  const stmt = db.prepare(
    "INSERT OR REPLACE INTO site_config (key, value) VALUES (?, ?)",
  );

  for (const [key, value] of Object.entries(body)) {
    if (ALLOWED_KEYS.has(key)) {
      stmt.run(key, String(value ?? ""));
    }
  }

  invalidatePublicCache();
  return Response.json({ ok: true });
}
