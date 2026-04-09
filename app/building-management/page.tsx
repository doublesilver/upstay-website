import type { Metadata } from "next";
import { Container } from "@/components/container";

export const metadata: Metadata = {
  title: "건물관리",
  description: "수선유지 및 하자보수",
};

const items = ["설비", "전기", "목공", "소방", "청소"];

export default function BuildingManagementPage() {
  return (
    <Container className="pt-8 pb-12 md:pt-16 md:pb-16">
      <header>
        <h1 className="text-[22px] md:text-[28px] font-bold tracking-tight text-[#111111]">
          건물관리
        </h1>
        <p className="mt-2 text-[12px] text-[#6B7280]">수선유지 및 하자보수</p>
        <div className="mt-6 border-t border-[#E5E7EB]" />
      </header>

      <ul className="mt-6">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-center gap-3 border-b border-[#E5E7EB] py-[14px] text-[16px] text-[#111111]"
          >
            <span className="text-[#6B7280]">—</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Container>
  );
}
