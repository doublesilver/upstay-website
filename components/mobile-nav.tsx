"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { navItems } from "@/lib/site";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] border border-stone-300 bg-white text-stone-900 hover:border-stone-400 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2"
        aria-expanded={open}
        aria-controls="mobile-navigation"
        aria-label="메뉴 열기"
      >
        <span className="flex flex-col gap-1.5">
          <span className="block h-px w-4 bg-current" />
          <span className="block h-px w-4 bg-current" />
          <span className="block h-px w-4 bg-current" />
        </span>
      </button>
      <div
        id="mobile-navigation"
        className={cn(
          "absolute inset-x-4 top-full mt-3 rounded-[18px] border border-stone-300 bg-white p-3 shadow-[0_12px_32px_rgba(17,24,39,0.08)]",
          open ? "block" : "hidden",
        )}
      >
        <nav aria-label="모바일 메뉴" className="grid gap-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-[12px] px-3 py-3 text-[14px] font-medium text-stone-700 hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
