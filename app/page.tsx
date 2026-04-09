import { Container } from "@/components/container";
import { MenuCard } from "@/components/menu-card";

export default function HomePage() {
  return (
    <Container className="pt-8 pb-12 md:pt-16 md:pb-16">
      <section>
        <p className="text-[12px] text-[#6B7280]">부동산 토털 관리 서비스</p>
        <h1 className="mt-3 text-[22px] md:text-[28px] font-bold tracking-tight leading-[1.3] text-[#111111]">
          공간의 가치를
          <br />
          업스테이가 높입니다
        </h1>
        <div className="mt-6 border-t border-[#E5E7EB]" />
      </section>

      <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
        <MenuCard
          title="리모델링"
          subtitle="Before & After"
          href="/remodeling"
        />
        <MenuCard
          title="건물관리"
          subtitle="수선 · 유지 · 하자보수"
          href="/building-management"
        />
        <MenuCard
          title="임대관리"
          subtitle="공실 · 입퇴실 · 민원"
          href="/rental-management"
        />
      </section>
    </Container>
  );
}
