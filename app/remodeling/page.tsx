"use client";

import Image from "next/image";
import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Container } from "@/components/container";
import { remodelingCases as staticCases } from "@/lib/content";

interface RemodelingCase {
  id: number;
  before_image: string;
  after_image: string;
  title: string;
  image_count?: number;
}

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

const fallbackCases: RemodelingCase[] = staticCases.map((c, i) => ({
  id: i + 1,
  before_image: c.before,
  after_image: c.after,
  title: `사례 ${c.id}`,
}));

function PairRow({ pair, index }: { pair: Pair; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-6 transition-all duration-500 ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transitionDelay: `${index * 150}ms`,
      }}
    >
      <figure>
        <div className="aspect-[4/3] border border-[#E5E7EB] overflow-hidden bg-[#F9FAFB] relative">
          <Image
            src={pair.before_image}
            alt="Before"
            fill
            className="object-cover"
            sizes="40vw"
            unoptimized
          />
        </div>
        <figcaption className="mt-2 text-[10px] md:text-[12px] uppercase tracking-wider text-[#6B7280]">
          BEFORE
        </figcaption>
      </figure>

      <span
        aria-hidden="true"
        className="text-[14px] md:text-[18px] text-[#111111] pb-5"
      >
        →
      </span>

      <figure>
        <div className="aspect-[4/3] border border-[#E5E7EB] overflow-hidden bg-[#F9FAFB] relative">
          <Image
            src={pair.after_image}
            alt="After"
            fill
            className="object-cover"
            sizes="40vw"
            unoptimized
          />
        </div>
        <figcaption className="mt-2 text-[10px] md:text-[12px] uppercase tracking-wider text-[#6B7280]">
          AFTER
        </figcaption>
      </figure>
    </div>
  );
}

function UnmatchedGrid({
  images,
  startIndex,
}: {
  images: string[];
  startIndex: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      <div
        className="flex items-center gap-3 mb-6 transition-all duration-500 ease-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(12px)",
        }}
      >
        <div className="flex-1 border-t border-[#E5E7EB]" />
        <span className="text-[12px] text-[#999] uppercase tracking-wider shrink-0">
          After
        </span>
        <div className="flex-1 border-t border-[#E5E7EB]" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {images.map((url, i) => (
          <div
            key={i}
            className="aspect-[4/3] border border-[#E5E7EB] overflow-hidden bg-[#F9FAFB] relative rounded-lg transition-all duration-500 ease-out"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(20px)",
              transitionDelay: `${(startIndex + i) * 100}ms`,
            }}
          >
            <Image
              src={url}
              alt={`After ${i + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 45vw, 30vw"
              unoptimized
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailModal({
  caseId,
  onClose,
}: {
  caseId: number;
  onClose: () => void;
}) {
  const [data, setData] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/remodeling/${caseId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [caseId]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  const matched =
    data?.pairs.filter((p) => p.before_image && p.after_image) || [];
  const unmatchedAfter =
    data?.pairs
      .filter((p) => !p.before_image && p.after_image)
      .map((p) => p.after_image) || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-4xl mx-4 my-8 rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-[modalIn_0.25s_ease-out]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EBEBEB] shrink-0">
          <div>
            <h2 className="text-[18px] font-bold text-[#111]">
              {data?.title || "로딩 중..."}
            </h2>
            {data && (
              <p className="text-[12px] text-[#999] mt-0.5">
                Before → After
                {unmatchedAfter.length > 0 &&
                  ` · After ${unmatchedAfter.length}장 추가`}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-[#F7F7F7] flex items-center justify-center text-[#999] hover:text-[#111] transition-all"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {loading && (
            <div className="text-center py-20 text-[#999]">로딩 중...</div>
          )}

          {!loading && !data && (
            <div className="text-center py-20 text-[#999]">
              사례를 찾을 수 없습니다
            </div>
          )}

          {data && (
            <div className="space-y-8">
              {matched.map((pair, index) => (
                <PairRow key={pair.match_order} pair={pair} index={index} />
              ))}

              {unmatchedAfter.length > 0 && (
                <UnmatchedGrid
                  images={unmatchedAfter}
                  startIndex={matched.length}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes modalIn {
          from {
            opacity: 0;
            transform: translateY(24px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

export default function RemodelingPage() {
  return (
    <Suspense>
      <RemodelingPageInner />
    </Suspense>
  );
}

function RemodelingPageInner() {
  const searchParams = useSearchParams();
  const [cases, setCases] = useState<RemodelingCase[]>(fallbackCases);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    const idParam = searchParams.get("id");
    if (idParam) setSelectedId(Number(idParam));
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/remodeling")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setCases(data);
      })
      .catch(() => {});
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data === "object") setConfig(data);
      })
      .catch(() => {});
  }, []);

  const handleClose = useCallback(() => setSelectedId(null), []);

  return (
    <Container className="pt-8 pb-12 md:pt-16 md:pb-16">
      <header>
        <h1 className="text-[22px] md:text-[28px] font-bold tracking-tight text-[#111111]">
          {config.remodeling_page_title || "리모델링"}
        </h1>
        <p className="mt-2 text-[12px] uppercase tracking-wider text-[#6B7280]">
          {config.remodeling_page_subtitle || "Before → After"}
        </p>
        <div className="mt-6 border-t border-[#E5E7EB]" />
      </header>

      <section className="mt-8 space-y-8 md:space-y-12">
        {cases.map((item) => (
          <button
            key={item.id}
            onClick={() => setSelectedId(item.id)}
            className="block w-full text-left group"
          >
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-6">
              <figure>
                <div className="aspect-[4/3] border border-[#E5E7EB] overflow-hidden bg-[#F9FAFB] relative">
                  <Image
                    src={item.before_image}
                    alt={`${item.title} Before`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="45vw"
                    unoptimized
                  />
                </div>
                <figcaption className="mt-2 text-[10px] md:text-[12px] uppercase tracking-wider text-[#6B7280]">
                  BEFORE
                </figcaption>
              </figure>

              <span
                aria-hidden="true"
                className="text-[14px] md:text-[18px] text-[#111111] pb-5"
              >
                →
              </span>

              <figure>
                <div className="aspect-[4/3] border border-[#E5E7EB] overflow-hidden bg-[#F9FAFB] relative">
                  <Image
                    src={item.after_image}
                    alt={`${item.title} After`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="45vw"
                    unoptimized
                  />
                  {item.image_count !== undefined && item.image_count > 1 && (
                    <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[11px] font-medium px-2 py-0.5 rounded">
                      +{item.image_count - 1}
                    </span>
                  )}
                </div>
                <figcaption className="mt-2 text-[10px] md:text-[12px] uppercase tracking-wider text-[#6B7280]">
                  AFTER
                </figcaption>
              </figure>
            </div>
          </button>
        ))}
      </section>

      {selectedId !== null && (
        <DetailModal caseId={selectedId} onClose={handleClose} />
      )}
    </Container>
  );
}
