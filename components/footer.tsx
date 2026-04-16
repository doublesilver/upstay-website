import { Container } from "@/components/container";
import { companyInfo } from "@/lib/site";

interface FooterProps {
  config?: Record<string, string>;
}

export function Footer({ config }: FooterProps) {
  const info = {
    name: config?.footer_name || companyInfo.name,
    englishName: config?.footer_english_name || companyInfo.englishName,
    ceo: config?.footer_ceo || companyInfo.ceo,
    address: config?.footer_address || companyInfo.address,
    businessNumber:
      config?.footer_business_number || companyInfo.businessNumber,
    phone: config?.footer_phone || companyInfo.phone,
  };
  const label = {
    name: config?.footer_label_name || "상호명",
    ceo: config?.footer_label_ceo || "대표자명",
    address: config?.footer_label_address || "주소",
    businessNumber: config?.footer_label_business_number || "사업자등록번호",
    phone: config?.footer_label_phone || "전화번호",
  };
  return (
    <footer className="border-t border-[#E5E7EB]">
      <Container className="py-6 md:py-8 text-[11px] md:text-[12px] text-[#6B7280] leading-7">
        <table className="border-collapse">
          <tbody>
            <tr>
              <td className="pr-1">·</td>
              <td
                className="w-[4.5em]"
                style={{ textAlign: "justify", textAlignLast: "justify" }}
              >
                {label.name}
              </td>
              <td className="px-1">:</td>
              <td>
                {info.name} ({info.englishName})
              </td>
              <td className="px-2 text-[#E5E7EB]">|</td>
              <td className="pr-1">·</td>
              <td
                className="w-[7.5em]"
                style={{ textAlign: "justify", textAlignLast: "justify" }}
              >
                {label.businessNumber}
              </td>
              <td className="px-1">:</td>
              <td className="whitespace-nowrap">{info.businessNumber}</td>
            </tr>
            <tr>
              <td className="pr-1">·</td>
              <td
                className="w-[4.5em]"
                style={{ textAlign: "justify", textAlignLast: "justify" }}
              >
                {label.ceo}
              </td>
              <td className="px-1">:</td>
              <td>{info.ceo}</td>
              <td className="px-2 text-[#E5E7EB]">|</td>
              <td className="pr-1">·</td>
              <td
                className="w-[7.5em]"
                style={{ textAlign: "justify", textAlignLast: "justify" }}
              >
                {label.phone}
              </td>
              <td className="px-1">:</td>
              <td className="whitespace-nowrap">{info.phone}</td>
            </tr>
            <tr>
              <td className="pr-1">·</td>
              <td
                className="w-[4.5em]"
                style={{ textAlign: "justify", textAlignLast: "justify" }}
              >
                {label.address}
              </td>
              <td className="px-1">:</td>
              <td colSpan={6}>{info.address}</td>
            </tr>
          </tbody>
        </table>
      </Container>
    </footer>
  );
}
