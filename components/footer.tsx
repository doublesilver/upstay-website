import { Container } from "@/components/container";
import { companyInfo } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-[#E5E7EB]">
      <Container className="py-8 md:py-10">
        <div className="flex justify-between text-[12px] md:text-[13px] leading-7 text-[#6B7280]">
          <div>
            <p className="text-[#111111] font-medium">
              {companyInfo.name} ({companyInfo.englishName})
            </p>
            <p>대표자명 : {companyInfo.ceo}</p>
          </div>
          <div className="text-right">
            <p>사업자번호 : {companyInfo.businessNumber}</p>
            <p>전화번호 : {companyInfo.phone}</p>
          </div>
        </div>
        <p className="mt-3 text-[12px] md:text-[13px] text-[#6B7280]">
          {companyInfo.address}
        </p>
      </Container>
    </footer>
  );
}
