"use client";

import { Container } from "@/components/container";
import { companyInfo } from "@/lib/site";

function JLabel({
  children,
  width,
  spacing,
}: {
  children: string;
  width: string;
  spacing?: string;
}) {
  const useSpacing = spacing && spacing !== "0em" && spacing !== "0px";
  return (
    <td
      style={{
        width,
        ...(useSpacing
          ? { letterSpacing: spacing }
          : { textAlign: "justify", textAlignLast: "justify" }),
      }}
    >
      {children}
    </td>
  );
}

export function Footer({ config = {} }: { config?: Record<string, string> }) {
  const c = (key: string, fallback: string) => config?.[key] || fallback;
  const colonLeft = config?.footer_colon_left_offset || "0px";
  const colonRight = config?.footer_colon_right_offset || "0px";

  return (
    <footer className="bg-[#F1F8E9] border-t border-[#E5E7EB]">
      <Container className="py-6 md:py-8 text-[11px] md:text-[12px] text-[#4B5563] leading-7">
        <table className="border-collapse">
          <tbody>
            <tr>
              <td className="pr-1">·</td>
              <JLabel width="4.5em" spacing={config?.footer_label_name_spacing}>
                {c("footer_label_name", "상호명")}
              </JLabel>
              <td className="px-1">
                <span style={{ position: "relative", left: colonLeft }}>:</span>
              </td>
              <td>
                {c("footer_name", companyInfo.name)} (
                {c("footer_english_name", companyInfo.englishName)})
              </td>
              <td className="px-2 text-[#E5E7EB]">|</td>
              <td className="pr-1">·</td>
              <JLabel
                width="7.5em"
                spacing={config?.footer_label_business_number_spacing}
              >
                {c("footer_label_business_number", "사업자등록번호")}
              </JLabel>
              <td className="px-1">
                <span style={{ position: "relative", left: colonRight }}>
                  :
                </span>
              </td>
              <td className="whitespace-nowrap">
                {c("footer_business_number", companyInfo.businessNumber)}
              </td>
            </tr>
            <tr>
              <td className="pr-1">·</td>
              <JLabel width="4.5em" spacing={config?.footer_label_ceo_spacing}>
                {c("footer_label_ceo", "대표자명")}
              </JLabel>
              <td className="px-1">
                <span style={{ position: "relative", left: colonLeft }}>:</span>
              </td>
              <td>{c("footer_ceo", companyInfo.ceo)}</td>
              <td className="px-2 text-[#E5E7EB]">|</td>
              <td className="pr-1">·</td>
              <JLabel
                width="7.5em"
                spacing={config?.footer_label_phone_spacing}
              >
                {c("footer_label_phone", "전화번호")}
              </JLabel>
              <td className="px-1">
                <span style={{ position: "relative", left: colonRight }}>
                  :
                </span>
              </td>
              <td className="whitespace-nowrap">
                {c("footer_phone", companyInfo.phone)}
              </td>
            </tr>
            <tr>
              <td className="pr-1">·</td>
              <JLabel
                width="4.5em"
                spacing={config?.footer_label_address_spacing}
              >
                {c("footer_label_address", "주소")}
              </JLabel>
              <td className="px-1">
                <span style={{ position: "relative", left: colonLeft }}>:</span>
              </td>
              <td colSpan={6}>{c("footer_address", companyInfo.address)}</td>
            </tr>
          </tbody>
        </table>
      </Container>
    </footer>
  );
}
