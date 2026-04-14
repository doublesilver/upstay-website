import { Container } from "@/components/container";
import { companyInfo } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-[#E5E7EB]">
      <Container className="py-6 md:py-8 text-[12px] md:text-[13px] text-[#6B7280] leading-7">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-x-3 md:gap-x-5">
          <p>
            상호명 : {companyInfo.name} ({companyInfo.englishName})
          </p>
          <span className="text-[#E5E7EB]">|</span>
          <p>사업자등록번호 : {companyInfo.businessNumber}</p>

          <p>대표자명 : {companyInfo.ceo}</p>
          <span className="text-[#E5E7EB]">|</span>
          <p>전화번호 : {companyInfo.phone}</p>
        </div>
        <p className="mt-1">주소 : {companyInfo.address}</p>
      </Container>
    </footer>
  );
}
