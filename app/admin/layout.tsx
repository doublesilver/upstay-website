"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const adminNav = [
  { label: "메인 문구", href: "/admin/config" },
  { label: "리모델링", href: "/admin/remodeling" },
  { label: "공지사항", href: "/admin/announcements" },
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
        setError(data.error || "아이디 또는 비밀번호가 틀렸습니다");
        setSubmitting(false);
        return;
      }
      sessionStorage.setItem("admin_token", data.token);
      setToken(data.token);
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

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-[#9CA3AF] text-[14px]">로딩 중...</div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F9FAFB] to-[#E5E7EB] flex items-center justify-center px-4">
        <div className="w-full max-w-[400px]">
          <div className="bg-white rounded-2xl shadow-lg border border-[#E5E7EB] overflow-hidden">
            <div className="bg-[#111] px-8 py-8 flex flex-col items-center">
              <Image
                src="/logo.png"
                alt="UPSTAY"
                width={160}
                height={64}
                className="h-12 w-auto brightness-0 invert"
              />
              <p className="mt-2 text-[13px] text-[#9CA3AF]">관리자 로그인</p>
            </div>
            <form onSubmit={handleLogin} className="px-8 py-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-medium text-[#6B7280] mb-1.5">
                    아이디
                  </label>
                  <input
                    type="text"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    autoComplete="username"
                    className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[14px] outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#6B7280] mb-1.5">
                    비밀번호
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[14px] outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-all"
                  />
                </div>
              </div>
              {error && (
                <p className="mt-3 text-[13px] text-red-500 bg-red-50 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting || !id || !password}
                className="mt-6 w-full bg-[#111] text-white rounded-lg py-3 text-[14px] font-medium hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {submitting ? "로그인 중..." : "로그인"}
              </button>
            </form>
          </div>
          <p className="mt-4 text-center text-[11px] text-[#9CA3AF]">
            업스테이 관리자 전용
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F9FAFB] min-h-screen">
      <header className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="text-[16px] font-bold text-[#111]">
              UPSTAY 관리자
            </Link>
            <nav className="flex items-center gap-5">
              {adminNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-[13px] ${
                    pathname === item.href
                      ? "text-[#111] font-medium"
                      : "text-[#6B7280] hover:text-[#111]"
                  } transition-colors`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-[12px] text-[#6B7280] hover:text-[#111]"
            >
              사이트 보기
            </Link>
            <button
              onClick={handleLogout}
              className="text-[12px] text-[#6B7280] hover:text-[#111] transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
