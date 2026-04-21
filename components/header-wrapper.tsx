"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/header";

export function HeaderWrapper({
  initialConfig,
}: {
  initialConfig: Record<string, string>;
}) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return <Header config={initialConfig} />;
}
