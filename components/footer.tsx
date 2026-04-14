import { Container } from "@/components/container";
import { companyInfo } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-[#E5E7EB]">
      <Container className="py-6 md:py-8 text-[12px] md:text-[13px] text-[#6B7280] leading-7">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-x-5">
          {/* 좌측 */}
          <div className="space-y-0.5">
            <div className="flex">
              <span className="w-[80px] md:w-[90px] shrink-0">상호명</span>
              <span>
                : {companyInfo.name} ({companyInfo.englishName})
              </span>
            </div>
            <div className="flex">
              <span className="w-[80px] md:w-[90px] shrink-0">대표자명</span>
              <span>: {companyInfo.ceo}</span>
            </div>
            <div className="flex">
              <span className="w-[80px] md:w-[90px] shrink-0">주소</span>
              <span>: {companyInfo.address}</span>
            </div>
          </div>

          <span className="hidden md:block text-[#E5E7EB]">|</span>

          {/* 우측 */}
          <div className="space-y-0.5 mt-1 md:mt-0">
            <div className="flex">
              <span className="w-[100px] md:w-[110px] shrink-0">
                사업자등록번호
              </span>
              <span>: {companyInfo.businessNumber}</span>
            </div>
            <div className="flex">
              <span className="w-[100px] md:w-[110px] shrink-0">전화번호</span>
              <span>: {companyInfo.phone}</span>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
