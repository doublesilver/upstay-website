import { Container } from "@/components/container";
import { companyInfo } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-[#E5E7EB]">
      <Container className="py-6">
        <ul className="space-y-1 text-[12px] leading-6 text-[#6B7280]">
          <li>
            상호명 : {companyInfo.name} ({companyInfo.englishName})
          </li>
          <li>대표자명 : {companyInfo.ceo}</li>
          <li>주소 : {companyInfo.address}</li>
          <li>사업자번호 : {companyInfo.businessNumber}</li>
          <li>전화번호 : {companyInfo.phone}</li>
        </ul>
      </Container>
    </footer>
  );
}
