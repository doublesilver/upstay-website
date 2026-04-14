"use client";

import Link from "next/link";

const cards = [
  {
    title: "메인 문구 관리",
    description: "히어로 타이틀, 서브타이틀 수정",
    href: "/admin/config",
  },
  {
    title: "리모델링 사례",
    description: "Before/After 사례 추가·수정·삭제",
    href: "/admin/remodeling",
  },
  {
    title: "공지사항",
    description: "메인 페이지 공지사항 관리",
    href: "/admin/announcements",
  },
];

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-[22px] font-bold text-[#111] mb-6">대시보드</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="bg-white border border-[#E5E7EB] rounded-lg p-6 hover:border-[#111] transition-colors"
          >
            <h2 className="text-[16px] font-medium text-[#111]">
              {card.title}
            </h2>
            <p className="mt-1 text-[13px] text-[#6B7280]">
              {card.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
