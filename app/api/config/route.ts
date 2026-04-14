import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const rows = db.prepare("SELECT key, value FROM site_config").all() as {
    key: string;
    value: string;
  }[];
  const config: Record<string, string> = {};
  for (const row of rows) config[row.key] = row.value;
  return Response.json(config);
}
