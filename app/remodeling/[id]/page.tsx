import { Container } from "@/components/container";
import { DetailGallery } from "./detail-gallery";
import { getDb } from "@/lib/db";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

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
      `SELECT type, match_order, image_url, image_url_wm
       FROM case_images
       WHERE case_id = ? AND image_url <> ''
       ORDER BY type ASC, match_order ASC, id ASC`,
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
