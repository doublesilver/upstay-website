import Link from "next/link";
import { Container } from "@/components/container";
import { navItems } from "@/lib/site";

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB]">
      <Container className="h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-[18px] font-bold tracking-tight text-[#111111]"
        >
          UPSTAY
        </Link>
        <nav
          aria-label="주요 메뉴"
          className="flex items-center gap-5 md:gap-8"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[13px] md:text-[14px] text-[#111111] hover:text-[#6B7280] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </Container>
    </header>
  );
}
