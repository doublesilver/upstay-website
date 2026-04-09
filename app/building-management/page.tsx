import type { Metadata } from "next";
import { Container } from "@/components/container";
import { buildingManagementItems } from "@/lib/content";

export const metadata: Metadata = {
  title: "건물관리",
  description: "수선유지 및 하자보수",
};

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
        {buildingManagementItems.map((item) => (
          <li key={item.title} className="border-b border-[#E5E7EB] py-5">
            <div className="flex items-start gap-3">
              <span className="mt-1 text-[#6B7280]">—</span>
              <div>
                <h2 className="text-[16px] font-medium text-[#111111]">
                  {item.title}
                </h2>
                <p className="mt-1 text-[14px] text-[#6B7280] leading-[1.6]">
                  {item.description}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Container>
  );
}
