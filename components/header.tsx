import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/container";
import { navItems, KAKAO_URL, PHONE_URL, SLOGAN } from "@/lib/site";

export function Header({ config }: { config?: Record<string, string> }) {
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
            className="flex items-center justify-center gap-0.5 md:gap-2.5"
          >
            {navItems.map((item, i) => (
              <span
                key={item.href}
                className="flex items-center gap-0.5 md:gap-2.5"
              >
                {i > 0 && <span className="text-[#E5E7EB]">|</span>}
                <Link
                  href={item.href}
                  className="text-[15px] md:text-[18px] font-bold text-[#111111] hover:text-[#6B7280] transition-colors whitespace-nowrap"
                >
                  {item.label}
                </Link>
              </span>
            ))}
          </nav>
          <p className="mt-0 text-[11.5px] md:text-[13px] text-[#9CA3AF] tracking-tight truncate">
            {config?.slogan_text || SLOGAN}
          </p>
        </div>

        {/* 전화 + 카카오 아이콘 — 모바일: 네모, 데스크탑: 원형 */}
        <div className="flex items-center gap-1.5 md:gap-2.5 shrink-0">
          <a
            href={PHONE_URL}
            aria-label="전화 문의"
            className="block h-10 w-10 md:h-11 md:w-11 rounded-xl overflow-hidden hover:opacity-90 transition"
          >
            <Image
              src="/icon-phone.png"
              alt="전화 문의"
              width={44}
              height={44}
              className="w-full h-full object-cover"
            />
          </a>
          <a
            href={KAKAO_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="카카오톡 문의"
            className="block h-10 w-10 md:h-11 md:w-11 rounded-xl overflow-hidden hover:opacity-90 transition"
          >
            <Image
              src="/icon-kakao.png"
              alt="카카오톡 문의"
              width={44}
              height={44}
              className="w-full h-full object-cover"
            />
          </a>
        </div>
      </Container>
    </header>
  );
}
