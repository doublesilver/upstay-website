"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  {
    label: "사진등록",
    href: "/admin/remodeling",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
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
    label: "팝업창",
    href: "/admin/announcements",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    label: "메인창",
    href: "/admin/config",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isLoginPage = pathname === "/admin";

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const formData = new FormData(form);
    const submittedId = ((formData.get("id") as string) || id).trim();
    const submittedPassword = (formData.get("password") as string) || password;
    if (!submittedId || !submittedPassword) {
      setError("아이디와 비밀번호를 입력해주세요");
      return;
    }
    setSubmitting(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: submittedId, password: submittedPassword }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "아이디 또는 비밀번호를 다시 확인해주세요");
        setSubmitting(false);
        return;
      }
      window.location.href = "/admin/remodeling";
    } catch (err) {
      clearTimeout(timer);
      if ((err as Error).name === "AbortError") {
        setError("서버 응답이 늦습니다. 잠시 후 다시 시도해주세요");
      } else {
        setError("서버에 연결할 수 없습니다");
      }
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      await fetch("/api/auth", {
        method: "DELETE",
        signal: controller.signal,
      });
    } catch {}
    clearTimeout(timer);
    window.location.href = "/admin";
  };

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-white flex">
        <div className="hidden lg:flex lg:w-1/2 bg-[#F1F8E9] items-center justify-center relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-center">
            <div style={{ width: "240px" }}>
              <Image
                src="/logo.svg"
                alt="UPSTAY"
                width={320}
                height={160}
                className="w-full h-auto"
                priority
              />
            </div>
            <div
              className="h-px bg-[#D1D5DB] my-2"
              style={{ width: "219.68px" }}
            />
            <p className="text-[14px] text-[#666] whitespace-nowrap">
              공간의 가치를 업스테이가 높여드립니다.
            </p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-[380px]">
            <div className="lg:hidden mb-8 text-center">
              <Image
                src="/logo.svg"
                alt="UPSTAY"
                width={160}
                height={64}
                className="mx-auto h-12 w-auto"
                priority
              />
            </div>

            <h1 className="text-[20px] font-bold text-[#111]">관리자 로그인</h1>

            <form onSubmit={handleLogin} className="mt-6">
              <div className="border border-[#111] rounded-xl p-4 space-y-3">
                <input
                  type="text"
                  name="id"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  autoComplete="off"
                  placeholder="아이디"
                  className="w-full border border-[#DDD] rounded-lg px-3 py-2.5 text-[14px] outline-none focus:border-[#111] transition-colors"
                />
                <input
                  type="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="off"
                  placeholder="비밀번호"
                  className="w-full border border-[#DDD] rounded-lg px-3 py-2.5 text-[14px] outline-none focus:border-[#111] transition-colors"
                />
                <div className="h-px bg-[#E5E5E5]" />
                {error && (
                  <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-[12px] text-red-600">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#111] text-white rounded-lg py-2.5 text-[14px] font-semibold hover:bg-[#333] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  {submitting ? "로그인 중..." : "로그인"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex">
      {/* 사이드바 */}
      <aside className="w-[240px] bg-white border-r border-[#EBEBEB] flex flex-col shrink-0 sticky top-0 h-screen">
        <div className="px-2 py-3 border-b border-[#EBEBEB]">
          <Link href="/admin" className="block mx-auto w-[70%]">
            <Image
              src="/logo.svg"
              alt="UPSTAY"
              width={200}
              height={100}
              className="w-full h-auto"
              priority
            />
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] transition-all ${
                isActive(item.href)
                  ? "bg-[#F7F7F7] text-[#111] font-semibold"
                  : "text-[#666] hover:bg-[#FAFAFA] hover:text-[#111]"
              }`}
            >
              <span
                className={isActive(item.href) ? "text-[#111]" : "text-[#999]"}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-[#EBEBEB] space-y-0.5">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-[#888] hover:bg-[#FAFAFA] hover:text-[#111] transition-all"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15,3 21,3 21,9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            사이트 보기
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-[#888] hover:bg-[#FAFAFA] hover:text-red-500 transition-all w-full"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16,17 21,12 16,7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            로그아웃
          </button>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 min-w-0">
        <div className="max-w-5xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
