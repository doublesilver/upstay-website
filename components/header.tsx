import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/container";
import { navItems, KAKAO_URL, PHONE_URL, SLOGAN } from "@/lib/site";

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB]">
      <Container className="h-14 md:h-20 flex items-center justify-between gap-3 md:gap-4">
        {/* 로고 — 이미지 준비 후 교체 예정 */}
        <Link
          href="/"
          className="shrink-0 text-[16px] md:text-[20px] font-bold text-[#111111] tracking-tight"
        >
          UPSTAY
        </Link>

        {/* 네비게이션 + 슬로건 (가운데) */}
        <div className="flex-1 min-w-0 text-center">
          <nav
            aria-label="주요 메뉴"
            className="flex items-center justify-center gap-3 md:gap-7"
          >
            {navItems.map((item, i) => (
              <span
                key={item.href}
                className="flex items-center gap-3 md:gap-7"
              >
                {i > 0 && <span className="text-[#E5E7EB]">|</span>}
                <Link
                  href={item.href}
                  className="text-[12px] md:text-[15px] font-bold text-[#111111] hover:text-[#6B7280] transition-colors whitespace-nowrap"
                >
                  {item.label}
                </Link>
              </span>
            ))}
          </nav>
          <p className="mt-0.5 text-[11.5px] md:text-[13px] text-[#9CA3AF] tracking-tight truncate">
            {SLOGAN}
          </p>
        </div>

        {/* 전화 + 카카오 아이콘 — 모바일: 네모, 데스크탑: 원형 */}
        <div className="flex items-center gap-1.5 md:gap-2.5 shrink-0">
          <a
            href={PHONE_URL}
            aria-label="전화 문의"
            className="flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-md md:rounded-full border border-[#E5E7EB] md:border-0 hover:bg-[#F3F4F6] transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#22c55e"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="md:w-6 md:h-6"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </a>
          <a
            href={KAKAO_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="카카오톡 문의"
            className="flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-md md:rounded-full bg-[#FEE500] hover:brightness-95 transition"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="md:w-[18px] md:h-[18px]"
            >
              <path
                d="M12 3.5C6.75 3.5 2.5 6.86 2.5 11c0 2.66 1.77 4.99 4.43 6.32l-.93 3.4c-.08.3.26.54.52.37l4.05-2.68c.47.05.95.09 1.43.09 5.25 0 9.5-3.36 9.5-7.5S17.25 3.5 12 3.5Z"
                fill="#111111"
              />
            </svg>
          </a>
        </div>
      </Container>
    </header>
  );
}
