"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
    label: "팝업창설정",
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
    label: "메인창 수정",
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
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setToken(sessionStorage.getItem("admin_token"));
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "아이디 또는 비밀번호가 올바르지 않습니다");
        setSubmitting(false);
        return;
      }
      sessionStorage.setItem("admin_token", data.token);
      setToken(data.token);
      router.push("/admin/remodeling");
    } catch {
      setError("서버에 연결할 수 없습니다");
    }
    setSubmitting(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_token");
    setToken(null);
    router.push("/admin");
  };

  if (!mounted) return null;

  if (!token) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex">
        {/* 좌측 비주얼 */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#111] items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#111] via-[#222] to-[#111]" />
          <div className="relative z-10 text-center px-16">
            <Image
              src="/logo.png"
              alt="UPSTAY"
              width={240}
              height={96}
              className="mx-auto h-20 w-auto brightness-0 invert"
              priority
            />
            <p className="mt-6 text-[16px] text-[#666] leading-relaxed">
              공간의 가치를
              <br />
              업스테이가 높여드립니다
            </p>
          </div>
        </div>

        {/* 우측 로그인 폼 */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-[380px]">
            <div className="lg:hidden mb-10 text-center">
              <Image
                src="/logo.png"
                alt="UPSTAY"
                width={160}
                height={64}
                className="mx-auto h-14 w-auto"
                priority
              />
            </div>

            <h1 className="text-[28px] font-bold text-[#111] tracking-tight">
              관리자 로그인
            </h1>
            <p className="mt-2 text-[14px] text-[#888]">
              업스테이 관리 시스템에 접속합니다
            </p>

            <form onSubmit={handleLogin} className="mt-8">
              <div className="space-y-5">
                <div>
                  <label className="block text-[13px] font-medium text-[#333] mb-2">
                    아이디
                  </label>
                  <input
                    type="text"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    autoComplete="username"
                    className="w-full border border-[#DDD] rounded-xl px-4 py-3.5 text-[15px] outline-none transition-all focus:border-[#111] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]"
                    placeholder="아이디를 입력하세요"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#333] mb-2">
                    비밀번호
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full border border-[#DDD] rounded-xl px-4 py-3.5 text-[15px] outline-none transition-all focus:border-[#111] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]"
                    placeholder="비밀번호를 입력하세요"
                  />
                </div>
              </div>

              {error && (
                <div className="mt-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-[13px] text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !id || !password}
                className="mt-8 w-full bg-[#111] text-white rounded-xl py-3.5 text-[15px] font-semibold hover:bg-[#333] active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    로그인 중
                  </span>
                ) : (
                  "로그인"
                )}
              </button>
            </form>

            <p className="mt-10 text-center text-[12px] text-[#BBB]">
              업스테이 관리자 전용 시스템
            </p>
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
        <div className="px-6 h-16 flex items-center border-b border-[#EBEBEB]">
          <Link href="/admin">
            <Image
              src="/logo.png"
              alt="UPSTAY"
              width={120}
              height={48}
              className="h-8 w-auto"
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
