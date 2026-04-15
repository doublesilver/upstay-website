import { Container } from "@/components/container";
import { companyInfo } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-[#E5E7EB]">
      <Container className="py-6 md:py-8 text-[11px] md:text-[12px] text-[#6B7280] leading-7">
        <div className="grid grid-cols-[auto_auto_1fr_auto_auto_auto_1fr] gap-x-2 items-baseline">
          <span>· 상호명</span>
          <span>:</span>
          <span>
            {companyInfo.name} ({companyInfo.englishName})
          </span>
          <span className="text-[#E5E7EB]">|</span>
          <span>· 사업자등록번호</span>
          <span>:</span>
          <span className="whitespace-nowrap">
            {companyInfo.businessNumber}
          </span>
          <span>· 대표자명</span>
          <span>:</span>
          <span>{companyInfo.ceo}</span>
          <span className="text-[#E5E7EB]">|</span>
          <span>· 전화번호</span>
          <span>:</span>
          <span className="whitespace-nowrap">{companyInfo.phone}</span>
          <span>· 주소</span>
          <span>:</span>
          <span className="col-span-5">{companyInfo.address}</span>
        </div>
      </Container>
    </footer>
  );
}
