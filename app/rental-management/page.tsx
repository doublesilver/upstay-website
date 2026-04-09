import type { Metadata } from "next";
import { Container } from "@/components/container";

export const metadata: Metadata = {
  title: "임대관리",
  description: "임대 운영 전반 관리",
};

const items = [
  "공실관리",
  "입퇴실 시 입주자 및 시설물 관리",
  "월세·관리비·공과금 정산 및 수납 독촉",
  "민원 접수 및 처리",
  "악성 연체자 소송 집행 · 재판 · 강제 퇴실",
];

export default function RentalManagementPage() {
  return (
    <Container className="pt-8 pb-12 md:pt-16 md:pb-16">
      <header>
        <h1 className="text-[22px] md:text-[28px] font-bold tracking-tight text-[#111111]">
          임대관리
        </h1>
        <p className="mt-2 text-[12px] text-[#6B7280]">임대 운영 전반 관리</p>
        <div className="mt-6 border-t border-[#E5E7EB]" />
      </header>

      <ul className="mt-6">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-3 border-b border-[#E5E7EB] py-[14px] text-[16px] text-[#111111]"
          >
            <span className="text-[#6B7280] shrink-0">—</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Container>
  );
}
