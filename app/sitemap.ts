import type { MetadataRoute } from "next";
import { getDb } from "@/lib/db";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://upstay.co.kr";
  const db = getDb();
  const cases = db.prepare("SELECT id FROM remodeling_cases").all() as {
    id: number;
  }[];
  return [
    { url: base, lastModified: new Date(), priority: 1 },
    { url: `${base}/remodeling`, lastModified: new Date(), priority: 0.8 },
    {
      url: `${base}/building-management`,
      lastModified: new Date(),
      priority: 0.7,
    },
    {
      url: `${base}/rental-management`,
      lastModified: new Date(),
      priority: 0.7,
    },
    ...cases.map((c) => ({
      url: `${base}/remodeling/${c.id}`,
      lastModified: new Date(),
      priority: 0.6,
    })),
  ];
}
