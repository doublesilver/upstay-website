import type { Metadata } from "next";
import { BeforeAfterCard } from "@/components/before-after-card";
import { CTAButtons } from "@/components/cta-buttons";
import { Container } from "@/components/container";
import { SectionHeading } from "@/components/section-heading";
import { remodelingDetailItems, remodelingFeatures } from "@/lib/content";

export const metadata: Metadata = {
  title: "리모델링",
  description: "업스테이의 리모델링 서비스를 전후 비교와 진행 방식 중심으로 소개합니다.",
};

export default function RemodelingPage() {
  return (
    <section className="pt-7 pb-8 sm:pt-10 sm:pb-10">
      <Container className="space-y-6">
        <section className="rounded-[22px] border border-stone-300 bg-white px-5 py-6 shadow-[0_10px_30px_rgba(17,24,39,0.05)] sm:px-7 sm:py-8">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-stone-500">
            Remodeling
          </p>
          <div className="mt-3 max-w-xl space-y-3">
            <h1 className="text-balance text-[2rem] leading-[1.16] font-semibold tracking-[-0.03em] text-stone-900 sm:text-[2.3rem]">
              상태를 정확히 보고,
              <br />
              필요한 리모델링만 정리합니다.
            </h1>
            <p className="max-w-lg text-[15px] leading-6 text-stone-600 sm:text-base">
              현장 상태, 공정 범위, 마감 방향을 짧은 흐름으로 정리해 빠르게 검토할 수 있게 돕습니다.
            </p>
          </div>
          <div className="mt-5">
            <CTAButtons compact />
          </div>
        </section>

        <section className="section-divider pt-6" aria-labelledby="remodeling-cases-heading">
          <SectionHeading
            id="remodeling-cases-heading"
            label="Before / After"
            title="전후 비교"
            description="이미지 교체가 쉬운 고정 비율 프레임으로 구성해 이후 실제 사례를 바로 반영할 수 있습니다."
          />
          <div className="mt-4 grid gap-4">
            {remodelingDetailItems.map((item) => (
              <BeforeAfterCard key={item.title} item={item} />
            ))}
          </div>
        </section>

        <section className="section-divider pt-6" aria-labelledby="remodeling-flow-heading">
          <SectionHeading
            id="remodeling-flow-heading"
            label="Process"
            title="진행 방식"
            description="과한 설명 대신, 의사결정에 필요한 핵심 흐름만 정리했습니다."
          />
          <div className="mt-4 grid gap-3">
            {remodelingFeatures.map((feature, index) => (
              <article
                key={feature.title}
                className="rounded-[16px] border border-stone-200 bg-white px-4 py-4"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-stone-300 text-[12px] font-semibold text-stone-700">
                    0{index + 1}
                  </span>
                  <div className="space-y-1">
                    <h2 className="text-[15px] font-semibold tracking-[-0.02em] text-stone-900">
                      {feature.title}
                    </h2>
                    <p className="text-[14px] leading-6 text-stone-600">{feature.description}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section-divider pt-6">
          <div className="rounded-[20px] border border-stone-300 bg-[var(--surface-muted)] px-5 py-5">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-stone-500">
              Contact
            </p>
            <h2 className="mt-2 text-[1.45rem] leading-[1.25] font-semibold tracking-[-0.03em] text-stone-900">
              현장 검토와 문의는
              <br />
              카카오톡으로 바로 연결됩니다.
            </h2>
            <p className="mt-2 text-[14px] leading-6 text-stone-600">
              상담 링크만 교체하면 실 운영용으로 바로 전환할 수 있습니다.
            </p>
            <div className="mt-4">
              <CTAButtons compact />
            </div>
          </div>
        </section>
      </Container>
    </section>
  );
}
