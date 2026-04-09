import type { Metadata } from "next";
import { Container } from "@/components/container";
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

      <section className="mt-8 space-y-10">
        {remodelingCases.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-6"
          >
            <figure>
              <div className="aspect-[4/3] border border-[#E5E7EB] overflow-hidden bg-[#F9FAFB]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.before}
                  alt={`Before ${item.id}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <figcaption className="mt-2 text-[12px] uppercase tracking-wider text-[#6B7280]">
                BEFORE {item.id}
              </figcaption>
            </figure>

            <div
              aria-hidden="true"
              className="flex items-center justify-center text-[16px] text-[#111111]"
            >
              <span className="md:hidden">↓</span>
              <span className="hidden md:inline">→</span>
            </div>

            <figure>
              <div className="aspect-[4/3] border border-[#E5E7EB] overflow-hidden bg-[#F9FAFB]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.after}
                  alt={`After ${item.id}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <figcaption className="mt-2 text-[12px] uppercase tracking-wider text-[#6B7280]">
                AFTER {item.id}
              </figcaption>
            </figure>
          </div>
        ))}
      </section>
    </Container>
  );
}
