"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";

export function HeaderWrapper() {
  const pathname = usePathname();
  const [config, setConfig] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data === "object") setConfig(data);
      })
      .catch(() => {});
  }, []);

  if (pathname.startsWith("/admin")) return null;
  return <Header config={config} />;
}
