"use client";

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
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setToken(sessionStorage.getItem("admin_token"));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, password }),
    });
    if (!res.ok) {
      setError("아이디 또는 비밀번호가 틀렸습니다");
      return;
    }
    const { token: t } = await res.json();
    sessionStorage.setItem("admin_token", t);
    setToken(t);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_token");
    setToken(null);
    router.push("/admin");
  };

  if (!token) {
    return (
      <html lang="ko">
        <body className="bg-[#F9FAFB] min-h-screen flex items-center justify-center">
          <form
            onSubmit={handleLogin}
            className="bg-white p-8 rounded-lg shadow-sm border border-[#E5E7EB] w-full max-w-sm"
          >
            <h1 className="text-[20px] font-bold text-center mb-6">
              UPSTAY 관리자
            </h1>
            <input
              type="text"
              placeholder="아이디"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full border border-[#E5E7EB] rounded px-3 py-2.5 text-[14px] mb-3 outline-none focus:border-[#111]"
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-[#E5E7EB] rounded px-3 py-2.5 text-[14px] mb-4 outline-none focus:border-[#111]"
            />
            {error && <p className="text-red-500 text-[13px] mb-3">{error}</p>}
            <button
              type="submit"
              className="w-full bg-[#111] text-white rounded py-2.5 text-[14px] font-medium hover:bg-[#333] transition-colors"
            >
              로그인
            </button>
          </form>
        </body>
      </html>
    );
  }

  return (
    <html lang="ko">
      <body className="bg-[#F9FAFB] min-h-screen">
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
                사이트 보기 →
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
      </body>
    </html>
  );
}
