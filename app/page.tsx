import Link from "next/link";
import { Container } from "@/components/container";
import { remodelingCases } from "@/lib/content";

const cards = remodelingCases.flatMap((c) => [
  { kind: "BEFORE", label: `BEFORE ${c.id}`, src: c.before },
  { kind: "AFTER", label: `AFTER ${c.id}`, src: c.after },
]);

export default function HomePage() {
  return (
    <Container className="pt-8 pb-12 md:pt-16 md:pb-16">
      <section>
        <h1 className="text-[22px] md:text-[28px] font-bold tracking-tight leading-[1.3] text-[#111111]">
          공간의 가치를
          <br />
          업스테이가 높입니다
        </h1>
        <div className="mt-6 border-t border-[#E5E7EB]" />
      </section>

      <section className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[18px] md:text-[22px] font-bold tracking-tight text-[#111111]">
            리모델링
          </h2>
          <p className="text-[12px] uppercase tracking-wider text-[#6B7280]">
            Before → After
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:gap-6">
          {cards.map((card, idx) => (
            <figure key={idx}>
              <div className="aspect-[4/3] border border-[#E5E7EB] overflow-hidden bg-[#F9FAFB]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.src}
                  alt={card.label}
                  className="w-full h-full object-cover"
                />
              </div>
              <figcaption className="mt-2 text-[11px] md:text-[12px] uppercase tracking-wider text-[#6B7280]">
                {card.label}
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-8">
          <Link
            href="/remodeling"
            className="inline-flex h-12 items-center justify-center border border-[#111111] bg-white px-5 text-[14px] font-medium text-[#111111] hover:bg-[#111111] hover:text-white transition-colors rounded-[6px]"
          >
            리모델링 사례 더보기 →
          </Link>
        </div>
      </section>
    </Container>
  );
}
