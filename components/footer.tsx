"use client";

import { Container } from "@/components/container";
import { companyInfo } from "@/lib/site";

export function Footer({ config = {} }: { config?: Record<string, string> }) {
  const c = (key: string, fallback: string) => config?.[key] || fallback;

  type Cell = { label: string; value: string; span?: number };
  const rows: Cell[][] = [
    [
      {
        label: c("footer_label_name", "상호명"),
        value: `${c("footer_name", companyInfo.name)} ( ${c("footer_english_name", companyInfo.englishName)} )`,
      },
      {
        label: c("footer_label_business_number", "사업자등록번호"),
        value: c("footer_business_number", companyInfo.businessNumber),
      },
    ],
    [
      {
        label: c("footer_label_ceo", "대표자명"),
        value: c("footer_ceo", companyInfo.ceo),
      },
      {
        label: c("footer_label_phone", "전화번호"),
        value: c("footer_phone", companyInfo.phone),
      },
    ],
    [
      {
        label: c("footer_label_address", "주소"),
        value: c("footer_address", companyInfo.address),
        span: 2,
      },
    ],
  ];

  return (
    <footer className="bg-[#F1F8E9] border-t border-[#E5E7EB]">
      <Container className="py-6 md:py-8 text-[11px] md:text-[12px] text-[#4B5563] leading-7">
        <dl className="grid grid-cols-[auto_1fr] md:grid-cols-[auto_1fr_auto_1fr] gap-x-4 gap-y-1">
          {rows.flatMap((row, ri) =>
            row.flatMap((cell, ci) => [
              <dt
                key={`dt-${ri}-${ci}`}
                className="text-[#4B5563] font-medium whitespace-nowrap before:content-['·_'] before:text-[#999]"
              >
                {cell.label}
              </dt>,
              <dd
                key={`dd-${ri}-${ci}`}
                className={`text-[#111] ${cell.span === 2 ? "md:col-span-3" : ""}`}
                style={cell.span === 2 ? { whiteSpace: "pre-wrap" } : undefined}
              >
                <span className="text-[#999] mr-1">:</span>
                {cell.value}
              </dd>,
            ]),
          )}
        </dl>
      </Container>
    </footer>
  );
}
