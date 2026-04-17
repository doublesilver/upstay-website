"use client";

import Image from "next/image";
import Link from "next/link";
import { blurDataURL } from "@/lib/shimmer";
import { use, useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Container } from "@/components/container";

interface Pair {
  match_order: number;
  before_image: string;
  after_image: string;
}

interface CaseDetail {
  id: number;
  title: string;
  pairs: Pair[];
}

export default function RemodelingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [beforeIdx, setBeforeIdx] = useState(0);
  const [afterIdx, setAfterIdx] = useState(0);
  const beforeRef = useRef<HTMLDivElement>(null);
  const afterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/remodeling/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const befores = useMemo(
    () => data?.pairs.map((p) => p.before_image).filter(Boolean) || [],
    [data],
  );
  const afters = useMemo(
    () => data?.pairs.map((p) => p.after_image).filter(Boolean) || [],
    [data],
  );

  const navBefore = useCallback(
    (dir: number) => {
      if (befores.length === 0) return;
      setBeforeIdx((i) => (i + dir + befores.length) % befores.length);
    },
    [befores.length],
  );

  const navAfter = useCallback(
    (dir: number) => {
      if (afters.length === 0) return;
      setAfterIdx((i) => (i + dir + afters.length) % afters.length);
    },
    [afters.length],
  );

  useEffect(() => {
    const makeSwipe = (
      ref: React.RefObject<HTMLDivElement | null>,
      nav: (dir: number) => void,
    ) => {
      const el = ref.current;
      if (!el) return () => {};
      let startX = 0;
      const onStart = (e: TouchEvent) => {
        startX = e.touches[0].clientX;
      };
      const onEnd = (e: TouchEvent) => {
        const diff = startX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) nav(diff > 0 ? 1 : -1);
      };
      el.addEventListener("touchstart", onStart, { passive: true });
      el.addEventListener("touchend", onEnd, { passive: true });
      return () => {
        el.removeEventListener("touchstart", onStart);
        el.removeEventListener("touchend", onEnd);
      };
    };

    const cleanBefore = makeSwipe(beforeRef, navBefore);
    const cleanAfter = makeSwipe(afterRef, navAfter);
    return () => {
      cleanBefore();
      cleanAfter();
    };
  }, [navBefore, navAfter, data]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") navBefore(-1);
      if (e.key === "ArrowRight") navBefore(1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [navBefore]);

  useEffect(() => {
    if (!data) return;
    [beforeIdx + 1, beforeIdx - 1].forEach((i) => {
      if (befores[i]) {
        const img = new window.Image();
        img.src = befores[i];
      }
    });
  }, [beforeIdx, befores, data]);

  useEffect(() => {
    if (!data) return;
    [afterIdx + 1, afterIdx - 1].forEach((i) => {
      if (afters[i]) {
        const img = new window.Image();
        img.src = afters[i];
      }
    });
  }, [afterIdx, afters, data]);

  return (
    <Container className="pt-3 pb-6 md:pt-6 md:pb-10">
      {loading && (
        <div className="text-center py-20 text-[#999]">로딩 중...</div>
      )}

      {!loading && !data && (
        <div className="text-center py-20 text-[#999]">
          사례를 찾을 수 없습니다
        </div>
      )}

      {data && (
        <>
          <div className="mb-4">
            <Link
              href="/remodeling"
              className="text-[13px] text-[#666] hover:text-[#111] transition-colors"
            >
              ← 목록으로
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {befores.length > 0 && (
              <div className="flex flex-col">
                <p className="text-[11px] uppercase tracking-wider text-[#111] font-medium mb-2">
                  BEFORE
                </p>
                <div
                  ref={beforeRef}
                  className="relative aspect-[2/1] border border-[#ccc] rounded-lg overflow-hidden bg-[#F1F8E9]"
                >
                  <Image
                    src={befores[beforeIdx]}
                    alt={`${data.title} Before ${beforeIdx + 1}`}
                    fill
                    className="object-cover"
                    priority
                    quality={70}
                    placeholder="blur"
                    blurDataURL={blurDataURL()}
                  />
                  {befores.length > 1 && (
                    <>
                      <button
                        onClick={() => navBefore(-1)}
                        aria-label="이전 사진"
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-[#111] shadow transition-colors"
                      >
                        &#9664;
                      </button>
                      <button
                        onClick={() => navBefore(1)}
                        aria-label="다음 사진"
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-[#111] shadow transition-colors"
                      >
                        &#9654;
                      </button>
                    </>
                  )}
                </div>
                {befores.length > 1 && (
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-1 mt-1">
                    {befores.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => setBeforeIdx(i)}
                        className={`aspect-square border rounded overflow-hidden bg-[#F1F8E9] relative ${
                          i === beforeIdx
                            ? "border-2 border-[#111]"
                            : "border border-[#ccc]"
                        }`}
                      >
                        <Image
                          src={url}
                          alt={`${data.title} Before ${i + 1}`}
                          fill
                          className="object-cover"
                          quality={70}
                          placeholder="blur"
                          blurDataURL={blurDataURL()}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {afters.length > 0 && (
              <div className="flex flex-col">
                <p className="text-[11px] uppercase tracking-wider text-[#111] font-medium mb-2">
                  AFTER
                </p>
                <div
                  ref={afterRef}
                  className="relative aspect-[2/1] border border-[#ccc] rounded-lg overflow-hidden bg-[#F1F8E9]"
                >
                  <Image
                    src={afters[afterIdx]}
                    alt={`${data.title} After ${afterIdx + 1}`}
                    fill
                    className="object-cover"
                    quality={70}
                    placeholder="blur"
                    blurDataURL={blurDataURL()}
                  />
                  {afters.length > 1 && (
                    <>
                      <button
                        onClick={() => navAfter(-1)}
                        aria-label="이전 사진"
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-[#111] shadow transition-colors"
                      >
                        &#9664;
                      </button>
                      <button
                        onClick={() => navAfter(1)}
                        aria-label="다음 사진"
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-[#111] shadow transition-colors"
                      >
                        &#9654;
                      </button>
                    </>
                  )}
                </div>
                {afters.length > 1 && (
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-1 mt-1">
                    {afters.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => setAfterIdx(i)}
                        className={`aspect-square border rounded overflow-hidden bg-[#F1F8E9] relative ${
                          i === afterIdx
                            ? "border-2 border-[#111]"
                            : "border border-[#ccc]"
                        }`}
                      >
                        <Image
                          src={url}
                          alt={`${data.title} After ${i + 1}`}
                          fill
                          className="object-cover"
                          quality={70}
                          placeholder="blur"
                          blurDataURL={blurDataURL()}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-[#e8ddd0] pt-4">
            <p className="text-[12px] text-[#999] mb-1">설명</p>
            <p className="text-[14px] text-[#333]">{data.title}</p>
          </div>
        </>
      )}
    </Container>
  );
}
