"use client";

import { useRef } from "react";
import { resolveImg } from "@/lib/image-url";

// 사례 카드 hover/touch 시 detail 페이지의 medium.webp 한국 PoP 캐시에 미리 채움.
// 1/8 OCPU origin 동시 fetch 큐잉 우회 — 사용자가 클릭할 때면 캐시 HIT 가능성 큼.
// useRef로 한 번만 트리거해 같은 카드 여러번 hover 시 중복 요청 방지.
export function CasePrefetchTrigger({
  befores,
  afters,
  className,
  children,
}: {
  befores: string[];
  afters: string[];
  className?: string;
  children: React.ReactNode;
}) {
  const done = useRef(false);
  const trigger = () => {
    if (done.current) return;
    done.current = true;
    [befores[0], afters[0]].forEach((url) => {
      if (!url) return;
      const img = new window.Image();
      img.src = resolveImg(`${url}.medium.webp`);
    });
  };
  return (
    <div className={className} onMouseEnter={trigger} onTouchStart={trigger}>
      {children}
    </div>
  );
}
