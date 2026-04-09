import type { Metadata } from "next";
import { Container } from "@/components/container";

export const metadata: Metadata = {
  title: "리모델링",
  description: "업스테이 리모델링 전후 비교",
};

const items = [
  {
    before: "https://placehold.co/600x400/eeeeee/111111?text=Before",
    after: "https://placehold.co/600x400/eeeeee/111111?text=After",
  },
  {
    before: "https://placehold.co/600x400/eeeeee/111111?text=Before",
    after: "https://placehold.co/600x400/eeeeee/111111?text=After",
  },
];

export default function RemodelingPage() {
  return (
    <Container className="pt-8 pb-12 md:pt-16 md:pb-16">
      <header>
        <h1 className="text-[22px] md:text-[28px] font-bold tracking-tight text-[#111111]">
          리모델링
        </h1>
        <p className="mt-2 text-[12px] text-[#6B7280]">Before → After</p>
        <div className="mt-6 border-t border-[#E5E7EB]" />
      </header>

      <section className="mt-8 space-y-10">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-6"
          >
            <figure>
              <div className="border border-[#E5E7EB]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.before}
                  alt="Before"
                  className="block w-full h-auto"
                />
              </div>
              <figcaption className="mt-2 text-[12px] uppercase tracking-wider text-[#6B7280]">
                BEFORE
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
              <div className="border border-[#E5E7EB]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.after}
                  alt="After"
                  className="block w-full h-auto"
                />
              </div>
              <figcaption className="mt-2 text-[12px] uppercase tracking-wider text-[#6B7280]">
                AFTER
              </figcaption>
            </figure>
          </div>
        ))}
      </section>
    </Container>
  );
}
