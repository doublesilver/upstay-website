import { Container } from "@/components/container";
import { companyInfo } from "@/lib/site";

export function Footer() {
  return (
    <footer id="footer" className="border-t border-stone-300 bg-white/80">
      <Container className="py-6">
        <div className="grid gap-2 text-[12px] leading-5 text-stone-600 sm:grid-cols-2">
          <p className="font-semibold text-stone-800">
            {companyInfo.name} ({companyInfo.englishName})
          </p>
          <p>대표자명: {companyInfo.ceo}</p>
          <p>주소: {companyInfo.address}</p>
          <p>사업자번호: {companyInfo.businessNumber}</p>
          <p>전화번호: {companyInfo.phone}</p>
        </div>
      </Container>
    </footer>
  );
}
