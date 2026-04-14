"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function getToken() {
  return sessionStorage.getItem("admin_token") || "";
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ cases: 0, announcements: 0 });

  useEffect(() => {
    const headers = { Authorization: `Bearer ${getToken()}` };
    Promise.all([
      fetch("/api/admin/remodeling", { headers }).then((r) => r.json()),
      fetch("/api/admin/announcements", { headers }).then((r) => r.json()),
    ])
      .then(([cases, announcements]) => {
        setStats({
          cases: Array.isArray(cases) ? cases.length : 0,
          announcements: Array.isArray(announcements)
            ? announcements.length
            : 0,
        });
      })
      .catch(() => {});
  }, []);

  const cards = [
    {
      title: "리모델링 사례",
      description: "Before/After 사례를 관리합니다",
      href: "/admin/remodeling",
      stat: `${stats.cases}건 등록`,
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      ),
    },
    {
      title: "공지사항",
      description: "메인 페이지 팝업 공지를 관리합니다",
      href: "/admin/announcements",
      stat: `${stats.announcements}건 등록`,
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14,2 14,8 20,8" />
        </svg>
      ),
    },
    {
      title: "메인 문구",
      description: "히어로 타이틀과 서브타이틀을 수정합니다",
      href: "/admin/config",
      stat: "설정",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[26px] font-bold text-[#111] tracking-tight">
          대시보드
        </h1>
        <p className="mt-1 text-[14px] text-[#888]">업스테이 관리 시스템</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group bg-white border border-[#EBEBEB] rounded-2xl p-6 hover:shadow-lg hover:border-[#DDD] transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 bg-[#F7F7F7] rounded-xl flex items-center justify-center text-[#666] group-hover:bg-[#111] group-hover:text-white transition-all duration-200">
                {card.icon}
              </div>
              <span className="text-[12px] text-[#BBB] bg-[#F7F7F7] rounded-full px-3 py-1">
                {card.stat}
              </span>
            </div>
            <h2 className="mt-5 text-[17px] font-semibold text-[#111]">
              {card.title}
            </h2>
            <p className="mt-1 text-[13px] text-[#888] leading-relaxed">
              {card.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
