import type { Metadata } from "next";
import { Container } from "@/components/container";
import { ServiceSections } from "@/components/service-sections";
import { remodelingCases } from "@/lib/content";

export const metadata: Metadata = {
  title: "리모델링",
  description: "업스테이 리모델링 전후 비교",
};

export default function RemodelingPage() {
  return (
    <Container className="pt-8 pb-12 md:pt-16 md:pb-16">
      <header>
        <h1 className="text-[22px] md:text-[28px] font-bold tracking-tight text-[#111111]">
          리모델링
        </h1>
        <p className="mt-2 text-[12px] uppercase tracking-wider text-[#6B7280]">
          Before → After
        </p>
        <div className="mt-6 border-t border-[#E5E7EB]" />
      </header>

      <section className="mt-8 space-y-8 md:space-y-12">
        {remodelingCases.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-6"
          >
            <figure>
              <div className="aspect-[4/3] border border-[#E5E7EB] overflow-hidden bg-[#F9FAFB]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.before}
                  alt="Before"
                  className="w-full h-full object-cover"
                />
              </div>
              <figcaption className="mt-2 text-[10px] md:text-[12px] uppercase tracking-wider text-[#6B7280]">
                BEFORE
              </figcaption>
            </figure>

            <span
              aria-hidden="true"
              className="text-[14px] md:text-[18px] text-[#111111] pb-5"
            >
              →
            </span>

            <figure>
              <div className="aspect-[4/3] border border-[#E5E7EB] overflow-hidden bg-[#F9FAFB]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.after}
                  alt="After"
                  className="w-full h-full object-cover"
                />
              </div>
              <figcaption className="mt-2 text-[10px] md:text-[12px] uppercase tracking-wider text-[#6B7280]">
                AFTER
              </figcaption>
            </figure>
          </div>
        ))}
      </section>

      <div className="mt-16">
        <ServiceSections />
      </div>
    </Container>
  );
}
