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
  return {
    title: `${title} | 업스테이`,
    description: `${title} Before & After 리모델링 사례`,
    openGraph: {
      title: `${title} | 업스테이`,
      description: `${title} Before & After`,
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
