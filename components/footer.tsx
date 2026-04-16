import { Container } from "@/components/container";
import { companyInfo } from "@/lib/site";

export function Footer() {
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
                상호명
              </td>
              <td className="px-1">:</td>
              <td>
                {companyInfo.name} ({companyInfo.englishName})
              </td>
              <td className="px-2 text-[#E5E7EB]">|</td>
              <td className="pr-1">·</td>
              <td
                className="w-[7.5em]"
                style={{ textAlign: "justify", textAlignLast: "justify" }}
              >
                사업자등록번호
              </td>
              <td className="px-1">:</td>
              <td className="whitespace-nowrap">
                {companyInfo.businessNumber}
              </td>
            </tr>
            <tr>
              <td className="pr-1">·</td>
              <td
                className="w-[4.5em]"
                style={{ textAlign: "justify", textAlignLast: "justify" }}
              >
                대표자명
              </td>
              <td className="px-1">:</td>
              <td>{companyInfo.ceo}</td>
              <td className="px-2 text-[#E5E7EB]">|</td>
              <td className="pr-1">·</td>
              <td
                className="w-[7.5em]"
                style={{ textAlign: "justify", textAlignLast: "justify" }}
              >
                전화번호
              </td>
              <td className="px-1">:</td>
              <td className="whitespace-nowrap">{companyInfo.phone}</td>
            </tr>
            <tr>
              <td className="pr-1">·</td>
              <td
                className="w-[4.5em]"
                style={{ textAlign: "justify", textAlignLast: "justify" }}
              >
                주소
              </td>
              <td className="px-1">:</td>
              <td colSpan={6}>{companyInfo.address}</td>
            </tr>
          </tbody>
        </table>
      </Container>
    </footer>
  );
}
