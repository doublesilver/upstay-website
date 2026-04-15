"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Container } from "@/components/container";
import { ServiceSections } from "@/components/service-sections";
import { Footer } from "@/components/footer";
import { remodelingCases as staticCases } from "@/lib/content";

interface RemodelingCase {
  id: number;
  before_image: string;
  after_image: string;
  title: string;
  image_count?: number;
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

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

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
      <section className="snap-start h-[calc(100dvh-56px)] md:h-[calc(100dvh-80px)] overflow-hidden">
        <Container className="pt-4 pb-6 md:pt-10 md:pb-12 h-full flex flex-col">
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 md:p-5 flex-1 min-h-0 flex flex-col overflow-y-auto">
            <div className="shrink-0">
              <h2 className="text-[16px] md:text-[22px] font-bold tracking-tight text-[#111111]">
                {config.remodeling_section_title || "리모델링 사례보기"}
              </h2>
            </div>

            {/* 모바일: Before→After 가로 배치 세로 스크롤 / 데스크탑: 3열 세로 배치 */}
            <div className="mt-3 md:mt-4 flex-1 min-h-0 overflow-hidden">
              {/* 모바일 레이아웃 */}
              <div className="md:hidden space-y-2.5">
                {cases.map((c) => (
                  <div
                    key={c.id}
                    className="bg-[#fdf6ee] border border-[#e8ddd0] rounded-xl p-3"
                  >
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                      <figure>
                        <div className="aspect-[4/3] border border-[#e8ddd0] rounded-lg overflow-hidden bg-white relative">
                          <Image
                            src={c.before_image}
                            alt={`${c.title} Before`}
                            fill
                            className="object-cover"
                            sizes="45vw"
                            unoptimized
                          />
                        </div>
                        <figcaption className="mt-1 text-[9px] uppercase tracking-wider text-[#9CA3AF]">
                          BEFORE
                        </figcaption>
                      </figure>
                      <span className="text-[20px] font-black text-[#111111] pb-4">
                        →
                      </span>
                      <figure>
                        <div className="aspect-[4/3] border border-[#e8ddd0] rounded-lg overflow-hidden bg-white relative">
                          <Image
                            src={c.after_image}
                            alt={`${c.title} After`}
                            fill
                            className="object-cover"
                            sizes="45vw"
                            unoptimized
                          />
                        </div>
                        <figcaption className="mt-1 text-[9px] uppercase tracking-wider text-[#111111]">
                          AFTER
                        </figcaption>
                      </figure>
                    </div>
                  </div>
                ))}
              </div>

              {/* 데스크탑 레이아웃: 3열 Before↓After */}
              <div className="hidden md:grid md:grid-cols-4 gap-5 h-full overflow-hidden">
                {cases.map((c) => (
                  <div
                    key={c.id}
                    className="bg-[#fdf6ee] border border-[#e8ddd0] rounded-xl p-4 space-y-1.5"
                  >
                    <figure>
                      <figcaption className="mb-1 text-[11px] font-medium uppercase tracking-wider text-[#9CA3AF]">
                        BEFORE
                      </figcaption>
                      <div className="aspect-[3/2] border border-[#e8ddd0] rounded-lg overflow-hidden bg-white relative">
                        <Image
                          src={c.before_image}
                          alt={`${c.title} Before`}
                          fill
                          className="object-cover"
                          sizes="33vw"
                          unoptimized
                        />
                      </div>
                    </figure>
                    <div className="text-center text-[18px] font-black text-[#111111]">
                      ↓
                    </div>
                    <figure>
                      <figcaption className="mb-1 text-[11px] font-medium uppercase tracking-wider text-[#111111]">
                        AFTER
                      </figcaption>
                      <div className="aspect-[3/2] border border-[#e8ddd0] rounded-lg overflow-hidden bg-white relative">
                        <Image
                          src={c.after_image}
                          alt={`${c.title} After`}
                          fill
                          className="object-cover"
                          sizes="33vw"
                          unoptimized
                        />
                      </div>
                    </figure>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 2화면: 서비스 + 푸터 */}
      <section className="snap-start h-[calc(100dvh-56px)] md:h-[calc(100dvh-80px)] bg-[#F9FAFB] border-t border-[#E5E7EB] flex flex-col justify-between overflow-hidden">
        <Container className="py-4 md:py-8 w-full flex-1 flex items-center">
          <div className="w-full">
            <ServiceSections config={config} />
          </div>
        </Container>
        <Footer />
      </section>

      {/* 공지사항 팝업 */}
      {showPopup && announcements.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-[90%] max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
              <h3 className="text-[16px] font-bold text-[#111]">공지사항</h3>
              <button
                onClick={() => setShowPopup(false)}
                className="text-[#6B7280] hover:text-[#111] text-[20px] leading-none"
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
