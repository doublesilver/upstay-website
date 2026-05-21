import type { MetadataRoute } from "next";
import { getDb } from "@/lib/db";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://upstay.co.kr";
  const db = getDb();
  // is_draft=1(작업 중)은 sitemap에서 제외 — generateStaticParams / detail 쿼리와 일관.
  // 빠뜨리면 검색엔진이 새박스 URL을 따라가다 404로 soft-404 노이즈를 만든다.
  const cases = db
    .prepare("SELECT id FROM remodeling_cases WHERE is_draft = 0")
    .all() as { id: number }[];
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
