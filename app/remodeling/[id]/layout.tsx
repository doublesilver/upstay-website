import type { Metadata } from "next";
import { getDb } from "@/lib/db";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const db = getDb();
  const row = db
    .prepare("SELECT title FROM remodeling_cases WHERE id = ?")
    .get(Number(id)) as { title?: string } | undefined;
  if (!row) return { title: "사례를 찾을 수 없습니다" };
  const title = row.title || `리모델링 사례 ${id}`;
  // 루트 layout의 title.template(`%s | 업스테이`)가 사이트명을 붙이므로
  // 여기서는 title만 반환 — 중복 suffix(`... | 업스테이 | 업스테이`) 제거.
  return {
    title,
    description: `${title} Before & After 리모델링 사례`,
    alternates: {
      canonical: `/remodeling/${id}`,
    },
    openGraph: {
      title: `${title} | 업스테이`,
      description: `${title} Before & After`,
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
