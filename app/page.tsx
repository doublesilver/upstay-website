import Link from "next/link";
import { BeforeAfterCard } from "@/components/before-after-card";
import { CTAButtons } from "@/components/cta-buttons";
import { Container } from "@/components/container";
import { SectionHeading } from "@/components/section-heading";
import { ServiceGrid } from "@/components/service-grid";
import { buildingManagementItems, leasingManagementItems, remodelingPreviewItems } from "@/lib/content";

export default function HomePage() {
  return (
    <>
      <section className="pt-7 pb-8 sm:pt-10 sm:pb-10">
        <Container className="space-y-6">
          <div className="rounded-[22px] border border-stone-300 bg-white px-5 py-6 shadow-[0_10px_30px_rgba(17,24,39,0.05)] sm:px-7 sm:py-8">
            <div className="space-y-4 border-b border-stone-200 pb-5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                upstay
              </p>
              <div className="max-w-xl space-y-3">
                <h1 className="text-balance text-[2rem] leading-[1.14] font-semibold tracking-[-0.03em] text-stone-900 sm:text-[2.35rem]">
                  리모델링부터 건물관리,
                  <br />
                  임대관리까지 정돈된 방식으로.
                </h1>
                <p className="max-w-md text-[15px] leading-6 text-stone-600 sm:text-base">
                  업스테이는 운영에 필요한 실무를 짧고 명확한 구조로 정리해 지원합니다.
                </p>
              </div>
              <CTAButtons />
            </div>
            <div className="grid grid-cols-3 gap-3 pt-5">
              {["리모델링", "건물관리", "임대관리"].map((item) => (
                <div
                  key={item}
                  className="flex min-h-20 items-end rounded-[16px] border border-stone-200 bg-[var(--surface-muted)] px-3 py-3"
                >
                  <span className="text-[13px] font-medium tracking-[-0.01em] text-stone-700 sm:text-sm">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <section className="section-divider pt-6" aria-labelledby="remodeling-preview-heading">
            <SectionHeading
              id="remodeling-preview-heading"
              label="Main Service"
              title="리모델링"
              description="공간의 상태를 비교해 보고, 필요한 공정을 간결하게 검토할 수 있도록 구성했습니다."
            />
            <div className="mt-4 grid gap-4">
              {remodelingPreviewItems.map((item) => (
                <BeforeAfterCard key={item.title} item={item} />
              ))}
            </div>
            <div className="mt-4">
              <Link
                href="/remodeling"
                className="inline-flex h-11 items-center justify-center rounded-[12px] border border-stone-800 bg-stone-900 px-5 text-sm font-medium text-white hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2"
              >
                자세히 보기
              </Link>
            </div>
          </section>

          <section
            id="building-management"
            className="section-divider pt-6"
            aria-labelledby="building-management-heading"
          >
            <SectionHeading
              id="building-management-heading"
              label="Building Care"
              title="건물관리"
              description="건물 운영에 필요한 유지보수 업무를 체계적으로 지원합니다."
            />
            <div className="mt-4">
              <ServiceGrid items={buildingManagementItems} variant="grid" />
            </div>
          </section>

          <section
            id="leasing-management"
            className="section-divider pt-6"
            aria-labelledby="leasing-management-heading"
          >
            <SectionHeading
              id="leasing-management-heading"
              label="Lease Support"
              title="임대관리"
              description="입퇴실 관리부터 수납, 민원 대응까지 운영 흐름에 맞춰 정리합니다."
            />
            <div className="mt-4">
              <ServiceGrid items={leasingManagementItems} variant="list" />
            </div>
          </section>
        </Container>
      </section>
    </>
  );
}
