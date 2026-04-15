import { Container } from "@/components/container";
import { companyInfo } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-[#E5E7EB]">
      <Container className="py-6 md:py-8 text-[12px] md:text-[13px] text-[#6B7280] leading-7">
        <div className="grid grid-cols-2 gap-x-6">
          <div className="grid grid-cols-[auto_auto_1fr] gap-x-2">
            <span>상호명</span>
            <span>:</span>
            <span>
              {companyInfo.name} ({companyInfo.englishName})
            </span>
            <span>대표자명</span>
            <span>:</span>
            <span>{companyInfo.ceo}</span>
          </div>
          <div className="grid grid-cols-[auto_auto_1fr] gap-x-2">
            <span>사업자등록번호</span>
            <span>:</span>
            <span>{companyInfo.businessNumber}</span>
            <span>전화번호</span>
            <span>:</span>
            <span className="whitespace-nowrap">{companyInfo.phone}</span>
          </div>
        </div>
        <div className="grid grid-cols-[auto_auto_1fr] gap-x-2 mt-0.5">
          <span>주소</span>
          <span>:</span>
          <span>{companyInfo.address}</span>
        </div>
      </Container>
    </footer>
  );
}
