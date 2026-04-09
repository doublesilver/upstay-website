import Link from "next/link";
import { Container } from "@/components/container";
import { KakaoButton } from "@/components/kakao-button";
import { MobileNav } from "@/components/mobile-nav";
import { navItems } from "@/lib/site";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-stone-300/95 bg-[rgba(245,245,244,0.92)] backdrop-blur-sm">
      <Container className="relative flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center text-[15px] font-semibold tracking-[-0.03em] text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2"
        >
          업스테이
        </Link>

        <nav aria-label="주요 메뉴" className="hidden items-center gap-5 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-[14px] font-medium text-stone-600 hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex">
          <KakaoButton compact />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <KakaoButton compact className="px-3" />
          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
