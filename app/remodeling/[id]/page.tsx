import { Container } from "@/components/container";
import { DetailGallery } from "./detail-gallery";
import { getDb } from "@/lib/db";
import { notFound } from "next/navigation";

// ISR 전환. force-dynamic을 제거해 CF 캐시 + Link prefetch를 복원(클릭 즉시 전환).
// generateStaticParams가 빈 배열을 반환 → 빌드 시 정적 prerender 0개.
// 따라서 로컬 빌드의 데모 시드 DB(case 1-3)가 production 실 DB와 어긋나
// 빈 페이지로 굳는 회귀(2026-05-25)가 원천 차단된다. dynamicParams 기본값(true)이라
// 모든 사례 경로는 런타임 첫 요청 시 OCI DB를 읽어 ISR로 생성·캐시된다.
export const revalidate = 60;

export async function generateStaticParams() {
  return [];
}

export default async function RemodelingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) notFound();

  const db = getDb();
  const caseRow = db
    .prepare(
      "SELECT id, title FROM remodeling_cases WHERE id = ? AND is_draft = 0",
    )
    .get(numId) as { id: number; title: string } | undefined;
  if (!caseRow) notFound();

  const images = db
    .prepare(
      // 별표(slot_position 1-4) 사진을 항상 상단에. README/홈 정렬과 일관성 유지.
      `SELECT type, match_order, image_url, image_url_wm
       FROM case_images
       WHERE case_id = ? AND image_url <> ''
       ORDER BY type ASC,
                CASE WHEN slot_position > 0 THEN 0 ELSE 1 END ASC,
                slot_position ASC,
                match_order ASC,
                id ASC`,
    )
    .all(caseRow.id) as {
    type: "before" | "after";
    match_order: number;
    image_url: string;
    image_url_wm: string;
  }[];

  const beforeImages = images
    .filter((i) => i.type === "before")
    .map((i) => i.image_url_wm || i.image_url)
    .filter(Boolean);
  const afterImages = images
    .filter((i) => i.type === "after")
    .map((i) => i.image_url_wm || i.image_url)
    .filter(Boolean);

  if (beforeImages.length === 0 && afterImages.length === 0) notFound();

  return (
    <Container className="h-[calc(100vh-3.5rem)] supports-[height:100svh]:h-[calc(100svh-3.5rem)] md:h-[calc(100vh-5rem)] md:supports-[height:100svh]:h-[calc(100svh-5rem)] lg:max-w-[1600px] lg:px-6 overflow-hidden py-2 md:py-3 flex flex-col">
      <DetailGallery
        title={caseRow.title}
        beforeImages={beforeImages}
        afterImages={afterImages}
      />
    </Container>
  );
}
