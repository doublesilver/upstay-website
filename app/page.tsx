"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Container } from "@/components/container";
import { ServiceSections } from "@/components/service-sections";
import { Footer } from "@/components/footer";
import { remodelingCases as staticCases } from "@/lib/content";

interface RemodelingCase {
  id: number;
  before_image: string;
  after_image: string;
  title: string;
  before_images?: string[];
  after_images?: string[];
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  dismiss_duration: string;
  created_at: string;
}

const fallbackCases: RemodelingCase[] = staticCases.map((c, i) => ({
  id: i + 1,
  before_image: c.before,
  after_image: c.after,
  title: `사례 ${c.id}`,
}));

export default function HomePage() {
  const [cases, setCases] = useState<RemodelingCase[]>(fallbackCases);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [config, setConfig] = useState<Record<string, string>>({});
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showPopup) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowPopup(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", handleKey);
    };
  }, [showPopup]);

  useEffect(() => {
    fetch("/api/remodeling")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setCases(data);
      })
      .catch(() => {});
    fetch("/api/announcements")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAnnouncements(data);
          const dismissUntil = localStorage.getItem("popup_dismiss_until");
          if (dismissUntil === "forever") return;
          if (dismissUntil && new Date(dismissUntil) > new Date()) return;
          setShowPopup(true);
        }
      })
      .catch(() => {});
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data === "object") setConfig(data);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="snap-y snap-mandatory h-[calc(100dvh-56px)] md:h-[calc(100dvh-80px)] overflow-y-auto">
      {/* 1화면: 리모델링 */}
      <section className="snap-start min-h-[calc(100dvh-56px)] md:h-[calc(100dvh-80px)] overflow-hidden">
        <Container className="pt-4 pb-6 md:pt-10 md:pb-12 h-full flex flex-col">
          <div className="bg-[#F1F8E9] border border-[#111111] rounded-xl p-3 md:p-5 flex-1 min-h-0 flex flex-col overflow-y-auto">
            <div className="shrink-0">
              <Link
                href="/remodeling"
                className="inline-block bg-white border border-[#ccc] rounded px-1 py-px hover:border-[#999] transition-colors"
              >
                <h2
                  className="text-[12px] md:text-[18px] font-bold tracking-tight text-[#111111] hover:text-[#6B7280] transition-colors"
                  style={(() => {
                    try {
                      const s = JSON.parse(
                        config.remodeling_section_title_style || "{}",
                      );
                      const css: Record<string, string> = {};
                      if (s.fontSize) css.fontSize = s.fontSize;
                      if (s.fontWeight) css.fontWeight = s.fontWeight;
                      return css;
                    } catch {
                      return {};
                    }
                  })()}
                >
                  {config.remodeling_section_title || "리모델링 사례보기"} →
                </h2>
              </Link>
            </div>

            {/* 3카드: BEFORE 2x2 → AFTER 2x2 */}
            <div className="mt-3 md:mt-4 flex-1 min-h-0 space-y-3 md:space-y-4 overflow-y-auto">
              {cases.slice(0, 3).map((c) => {
                const befores = c.before_images?.length
                  ? c.before_images
                  : [c.before_image].filter(Boolean);
                const afters = c.after_images?.length
                  ? c.after_images
                  : [c.after_image].filter(Boolean);
                return (
                  <Link
                    key={c.id}
                    href="/remodeling"
                    className="block w-full bg-white border border-[#111111] rounded-xl p-2 md:p-3 text-left hover:shadow-md transition-shadow"
                  >
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                      <div>
                        <p className="text-[11px] md:text-[11px] uppercase tracking-wider text-[#111] mb-1 font-medium">
                          BEFORE
                        </p>
                        <div className="grid grid-cols-2 gap-1">
                          {befores.slice(0, 4).map((url, j) => (
                            <div
                              key={j}
                              className="aspect-square border border-[#111] rounded overflow-hidden bg-[#F1F8E9] relative"
                            >
                              <Image
                                src={url}
                                alt={`Before ${j + 1}`}
                                fill
                                className="object-cover"
                                sizes="20vw"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      <span className="text-[18px] md:text-[22px] font-black text-[#111]">
                        →
                      </span>
                      <div>
                        <p className="text-[11px] md:text-[11px] uppercase tracking-wider text-[#111] mb-1 font-medium">
                          AFTER
                        </p>
                        <div className="grid grid-cols-2 gap-1">
                          {afters.slice(0, 4).map((url, j) => (
                            <div
                              key={j}
                              className="aspect-square border border-[#111] rounded overflow-hidden bg-[#F1F8E9] relative"
                            >
                              <Image
                                src={url}
                                alt={`After ${j + 1}`}
                                fill
                                className="object-cover"
                                sizes="20vw"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </Container>
      </section>

      {/* 2화면: 서비스 + 푸터 */}
      <section className="snap-start min-h-[calc(100dvh-56px)] md:h-[calc(100dvh-80px)] bg-[#faf8f5] border-t border-[#E5E7EB] flex flex-col justify-between overflow-hidden">
        <Container className="py-4 md:py-8 w-full flex-1 flex items-center">
          <div className="w-full">
            <ServiceSections config={config} />
          </div>
        </Container>
        <Footer config={config} />
      </section>

      {/* 공지사항 팝업 */}
      {showPopup && announcements.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="announcement-title"
            className="bg-white rounded-xl shadow-lg w-[90%] max-w-md mx-4 overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
              <h3
                id="announcement-title"
                className="text-[16px] font-bold text-[#111]"
              >
                공지사항
              </h3>
              <button
                ref={closeBtnRef}
                onClick={() => setShowPopup(false)}
                className="text-[#6B7280] hover:text-[#111] text-[20px] leading-none"
                aria-label="닫기"
              >
                ×
              </button>
            </div>
            <div className="px-5 py-4 max-h-[60vh] overflow-y-auto space-y-3">
              {announcements.map((a) => (
                <div key={a.id}>
                  <p className="text-[14px] font-medium text-[#111]">
                    {a.title}
                  </p>
                  {a.content && (
                    <p className="mt-1 text-[13px] text-[#6B7280] leading-[1.6]">
                      {a.content}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-[#E5E7EB]">
              <button
                onClick={() => {
                  const durations = announcements.map(
                    (a) => a.dismiss_duration || "none",
                  );
                  let duration = "none";
                  if (durations.includes("forever")) duration = "forever";
                  else if (durations.includes("week")) duration = "week";
                  else if (durations.includes("day")) duration = "day";

                  if (duration === "day") {
                    localStorage.setItem(
                      "popup_dismiss_until",
                      new Date(Date.now() + 86400000).toISOString(),
                    );
                  } else if (duration === "week") {
                    localStorage.setItem(
                      "popup_dismiss_until",
                      new Date(Date.now() + 604800000).toISOString(),
                    );
                  } else if (duration === "forever") {
                    localStorage.setItem("popup_dismiss_until", "forever");
                  }
                  setShowPopup(false);
                }}
                className="w-full bg-[#111] text-white rounded-lg py-2.5 text-[14px] font-medium hover:bg-[#333] transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
