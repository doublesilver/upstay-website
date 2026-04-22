import Link from "next/link";
import { Container } from "@/components/container";
import { DetailGallery } from "./detail-gallery";
import { getDb } from "@/lib/db";
import { notFound } from "next/navigation";

export const revalidate = 60;

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
    .prepare("SELECT id, title FROM remodeling_cases WHERE id = ?")
    .get(numId) as { id: number; title: string } | undefined;
  if (!caseRow) notFound();

  const images = db
    .prepare(
      `SELECT type, slot_position, image_url, image_url_wm
       FROM case_images
       WHERE case_id = ? AND slot_position > 0 AND image_url <> ''
       ORDER BY type ASC, slot_position ASC, id ASC`,
    )
    .all(caseRow.id) as {
    type: "before" | "after";
    slot_position: number;
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

  return (
    <Container className="pt-4 pb-4 md:pt-6 md:pb-6 h-[calc(100dvh-56px)] md:h-[calc(100dvh-80px)] flex flex-col overflow-hidden">
      <div className="mb-3 shrink-0">
        <Link
          href="/remodeling"
          className="text-[13px] text-[#666] hover:text-[#111] transition-colors"
        >
          ← 목록으로
        </Link>
      </div>
      <DetailGallery
        title={caseRow.title}
        beforeImages={beforeImages}
        afterImages={afterImages}
      />
    </Container>
  );
}
