import Link from "next/link";
import { Container } from "@/components/container";
import {
  buildingManagementItems,
  remodelingCases,
  rentalManagementItems,
} from "@/lib/content";

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

      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[18px] md:text-[22px] font-bold tracking-tight text-[#111111]">
            리모델링
          </h2>
          <p className="text-[11px] md:text-[12px] uppercase tracking-wider text-[#6B7280]">
            Before → After
          </p>
        </div>

        <div className="mt-6 space-y-6 md:space-y-8">
          {remodelingCases.map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-5"
            >
              <figure>
                <div className="aspect-[4/3] border border-[#E5E7EB] overflow-hidden bg-[#F9FAFB]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.before}
                    alt={`Before ${c.id}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <figcaption className="mt-2 text-[10px] md:text-[12px] uppercase tracking-wider text-[#6B7280]">
                  BEFORE {c.id}
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
                    src={c.after}
                    alt={`After ${c.id}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <figcaption className="mt-2 text-[10px] md:text-[12px] uppercase tracking-wider text-[#6B7280]">
                  AFTER {c.id}
                </figcaption>
              </figure>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <Link
            href="/remodeling"
            className="inline-flex h-12 w-full items-center justify-center rounded-[6px] border border-[#111111] bg-white px-5 text-[14px] font-medium text-[#111111] hover:bg-[#111111] hover:text-white transition-colors md:w-auto"
          >
            리모델링 사례 더보기 →
          </Link>
        </div>
      </section>

      <section className="mt-16">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[18px] md:text-[22px] font-bold tracking-tight text-[#111111]">
            건물관리
          </h2>
          <p className="text-[11px] md:text-[12px] text-[#6B7280]">
            수선 · 유지 · 하자보수
          </p>
        </div>
        <ul className="mt-4 border-t border-[#E5E7EB]">
          {buildingManagementItems.map((item) => (
            <li
              key={item.title}
              className="border-b border-[#E5E7EB] py-4 md:py-5"
            >
              <div className="flex items-start gap-3">
                <span className="mt-1 text-[#6B7280]">—</span>
                <div>
                  <h3 className="text-[15px] md:text-[16px] font-medium text-[#111111]">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-[13px] text-[#6B7280] leading-[1.6]">
                    {item.description}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[18px] md:text-[22px] font-bold tracking-tight text-[#111111]">
            임대관리
          </h2>
          <p className="text-[11px] md:text-[12px] text-[#6B7280]">
            공실 · 입퇴실 · 민원
          </p>
        </div>
        <ul className="mt-4 border-t border-[#E5E7EB]">
          {rentalManagementItems.map((item) => (
            <li
              key={item.title}
              className="border-b border-[#E5E7EB] py-4 md:py-5"
            >
              <div className="flex items-start gap-3">
                <span className="mt-1 text-[#6B7280] shrink-0">—</span>
                <div>
                  <h3 className="text-[15px] md:text-[16px] font-medium text-[#111111]">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-[13px] text-[#6B7280] leading-[1.6]">
                    {item.description}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </Container>
  );
}
