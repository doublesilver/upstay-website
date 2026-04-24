import Link from "next/link";
import { Container } from "@/components/container";
import { DetailGallery } from "./detail-gallery";
import { getDb } from "@/lib/db";
import { notFound } from "next/navigation";

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const db = getDb();
    const cases = db.prepare("SELECT id FROM remodeling_cases").all() as {
      id: number;
    }[];
    return cases.map((c) => ({ id: String(c.id) }));
  } catch {
    return [];
  }
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
    <Container className="pt-4 pb-4 md:pt-6 md:pb-6">
      <div className="mb-3 shrink-0">
        <Link
          href="/remodeling"
          className="inline-block bg-white border border-[#ccc] rounded px-3 py-1 text-[13px] text-[#111] hover:border-[#999] transition-colors"
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
