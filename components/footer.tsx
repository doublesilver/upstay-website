import { Container } from "@/components/container";
import { companyInfo } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-[#E5E7EB]">
      <Container className="py-6 md:py-8 text-[11px] md:text-[13px] text-[#6B7280] leading-relaxed">
        <div className="flex flex-col md:flex-row md:gap-8">
          <div className="space-y-0.5">
            <p>
              상호명 : {companyInfo.name} ({companyInfo.englishName})
            </p>
            <p>대표자명 : {companyInfo.ceo}</p>
            <p>주소 : {companyInfo.address}</p>
          </div>
          <div className="space-y-0.5 mt-1 md:mt-0">
            <p>사업자등록번호 : {companyInfo.businessNumber}</p>
            <p>전화번호 : {companyInfo.phone}</p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
