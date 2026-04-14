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
    <div>
      {/* 사례보기 섹션 */}
      <section className="py-6 md:py-10">
        <Container>
          <div className="flex items-center justify-between mb-4 md:mb-5">
            <h2 className="text-[16px] md:text-[22px] font-bold tracking-tight text-[#111111]">
              {config.remodeling_section_title || "사례보기"}
            </h2>
            <p className="hidden md:block text-[13px] font-semibold uppercase tracking-widest text-[#9CA3AF]">
              BEFORE → AFTER →
            </p>
            <Link
              href="/remodeling"
              className="text-[11px] md:text-[13px] text-[#6B7280] hover:text-[#111111] transition-colors"
            >
              {config.remodeling_more_text || "더보기 →"}
            </Link>
          </div>

          <div className="space-y-3 md:space-y-4">
            {cases.map((c) => (
              <div
                key={c.id}
                className="bg-[#fdf6ee] border border-[#e8ddd0] rounded-xl p-3 md:p-4"
              >
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-4">
                  <figure>
                    <div className="aspect-[4/3] border border-[#e8ddd0] rounded-lg overflow-hidden bg-white relative">
                      <Image
                        src={c.before_image}
                        alt={`${c.title} Before`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 45vw, 40vw"
                        unoptimized
                      />
                    </div>
                    <figcaption className="mt-1.5 text-[9px] md:text-[11px] uppercase tracking-wider text-[#9CA3AF] text-center">
                      BEFORE
                    </figcaption>
                  </figure>

                  <span className="text-[16px] md:text-[22px] font-bold text-[#111111] pb-4">
                    →
                  </span>

                  <figure>
                    <div className="aspect-[4/3] border border-[#e8ddd0] rounded-lg overflow-hidden bg-white relative">
                      <Image
                        src={c.after_image}
                        alt={`${c.title} After`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 45vw, 40vw"
                        unoptimized
                      />
                    </div>
                    <figcaption className="mt-1.5 text-[9px] md:text-[11px] uppercase tracking-wider text-[#111111] text-center">
                      AFTER
                    </figcaption>
                  </figure>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* 서비스 소개 섹션 */}
      <section className="py-6 md:py-10 bg-[#F9FAFB] border-t border-[#E5E7EB]">
        <Container>
          <ServiceSections config={config} />
        </Container>
      </section>

      {/* 푸터 */}
      <Footer />

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
