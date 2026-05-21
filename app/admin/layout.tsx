"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { Menu, X } from "lucide-react";

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

// 모바일 헤더 바에 표시할 현재 페이지 타이틀. navItems의 href 매칭 기반.
function getPageTitle(pathname: string): string {
  const match = navItems.find((item) => pathname.startsWith(item.href));
  return match ? match.label : "관리자";
}

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
  const [loggingOut, setLoggingOut] = useState(false);
  // 모바일 사이드바 슬라이드 오버레이 토글. lg 미만에서만 의미를 가짐.
  const [mobileOpen, setMobileOpen] = useState(false);
  const hamburgerBtnRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const isLoginPage = pathname === "/admin";

  // 라우트가 바뀌면 모바일 메뉴는 자동으로 닫기. 메뉴 클릭 후 자연스러운 동작.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // 모바일 메뉴 열린 동안 ESC로 닫기 + body 스크롤 잠금.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // 오버레이 진입 시 닫기 버튼으로 포커스 이동(접근성).
    closeBtnRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileOpen]);

  // 오버레이가 닫히는 순간 햄버거 버튼으로 포커스 복귀. 초기 마운트 시점에도 호출되지만
  // 햄버거 버튼은 lg:hidden이라 데스크탑에선 포커스 이동이 시각적 노이즈가 되지 않음.
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (wasOpenRef.current && !mobileOpen) {
      hamburgerBtnRef.current?.focus({ preventScroll: true });
    }
    wasOpenRef.current = mobileOpen;
  }, [mobileOpen]);

  // Tab/Shift+Tab을 오버레이 내부로 가두는 focus trap. H-15 패턴 동일.
  const handleTabTrap = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab") return;
    const container = e.currentTarget;
    const focusable = Array.from(
      container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.hasAttribute("disabled"));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

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
    setLoggingOut(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      await fetch("/api/auth", {
        method: "DELETE",
        signal: controller.signal,
      });
      clearTimeout(timer);
      window.location.href = "/admin";
    } catch {
      clearTimeout(timer);
      setError("로그아웃 실패: 다시 시도해주세요");
    } finally {
      setLoggingOut(false);
    }
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
                  aria-label="아이디"
                  className="w-full border border-[#DDD] rounded-lg px-3 py-2.5 text-[14px] outline-none focus:border-[#111] transition-colors"
                />
                <input
                  type="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="off"
                  placeholder="비밀번호"
                  aria-label="비밀번호"
                  className="w-full border border-[#DDD] rounded-lg px-3 py-2.5 text-[14px] outline-none focus:border-[#111] transition-colors"
                />
                <div className="h-px bg-[#E5E5E5]" />
                {error && (
                  <div role="alert" aria-live="polite" className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-[12px] text-red-600">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#111] text-white rounded-lg py-2.5 text-[14px] font-semibold hover:bg-[#333] disabled:opacity-50 transition-all"
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

  // 데스크탑·모바일 양쪽에서 동일하게 렌더되는 사이드바 내부.
  // 메뉴 아이템 클릭 시 모바일 오버레이를 닫기 위해 onNavigate prop으로 분기.
  const renderSidebarInner = (onNavigate?: () => void) => (
    <>
      <div className="px-2 py-3 border-b border-[#111]">
        <Link
          href="/admin"
          className="block mx-auto w-[70%]"
          onClick={onNavigate}
        >
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

      <nav aria-label="관리자 메뉴" className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] transition-all ${
                active
                  ? "bg-[#F7F7F7] text-[#111] font-semibold"
                  : "text-[#666] hover:bg-[#FAFAFA] hover:text-[#111]"
              }`}
            >
              <span
                aria-hidden="true"
                className={active ? "text-[#111]" : "text-[#999]"}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-[#111] space-y-0.5">
        <Link
          href="/"
          target="_blank"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-[#555] hover:bg-[#FAFAFA] hover:text-[#111] transition-all"
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
          disabled={loggingOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-[#555] hover:bg-[#FAFAFA] hover:text-red-500 transition-all w-full disabled:opacity-50"
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
    </>
  );

  const pageTitle = getPageTitle(pathname);

  return (
    <div className="min-h-screen bg-[#F7F7F7] lg:flex">
      {/* 데스크탑 사이드바 (lg 이상) */}
      <aside className="hidden lg:flex w-[240px] bg-white border-r border-[#111] flex-col shrink-0 sticky top-0 h-screen">
        {renderSidebarInner()}
      </aside>

      {/* 모바일 헤더 바 (lg 미만) — 햄버거 + 현재 페이지 타이틀 + 로그아웃 */}
      <header className="lg:hidden sticky top-0 z-30 h-14 bg-white border-b border-[#111] flex items-center justify-between px-3">
        <button
          ref={hamburgerBtnRef}
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="메뉴 열기"
          aria-expanded={mobileOpen}
          aria-controls="admin-mobile-sidebar"
          className="w-10 h-10 flex items-center justify-center rounded-lg text-[#111] hover:bg-[#FAFAFA] transition-colors"
        >
          <Menu size={22} strokeWidth={1.8} />
        </button>
        <h1 className="text-[15px] font-semibold text-[#111] truncate px-2">
          {pageTitle}
        </h1>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="text-[13px] text-[#666] hover:text-red-500 px-2 py-1 disabled:opacity-50 transition-colors"
        >
          로그아웃
        </button>
      </header>

      {/* 모바일 슬라이드 오버레이 (lg 미만) */}
      <div
        className={`lg:hidden fixed inset-0 z-40 ${mobileOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!mobileOpen}
      >
        {/* backdrop — 배경 클릭으로 닫기 */}
        <div
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* 슬라이드 사이드바 본체 */}
        <aside
          id="admin-mobile-sidebar"
          role="dialog"
          aria-modal="true"
          aria-label="관리자 메뉴"
          onKeyDown={handleTabTrap}
          className={`absolute left-0 top-0 h-full w-[80%] max-w-[320px] bg-white border-r border-[#111] flex flex-col shadow-xl transform transition-transform duration-200 ease-out ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* 오버레이 헤더: 닫기 버튼 */}
          <div className="flex items-center justify-end px-2 pt-2">
            <button
              ref={closeBtnRef}
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="메뉴 닫기"
              className="w-10 h-10 flex items-center justify-center rounded-lg text-[#111] hover:bg-[#FAFAFA] transition-colors"
            >
              <X size={22} strokeWidth={1.8} />
            </button>
          </div>
          {renderSidebarInner(() => setMobileOpen(false))}
        </aside>
      </div>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 min-w-0">
        <div className="max-w-5xl mx-auto px-4 lg:px-8 py-4 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
