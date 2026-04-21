import { getDb } from "@/lib/db";
import { PUBLIC_KEYS } from "@/lib/config-schema";

export const revalidate = 60;

export async function GET() {
  const db = getDb();
  const rows = db.prepare("SELECT key, value FROM site_config").all() as {
    key: string;
    value: string;
  }[];
  const config: Record<string, string> = {};
  for (const row of rows) {
    if (PUBLIC_KEYS.has(row.key)) config[row.key] = row.value;
  }
  return Response.json(config);
}
