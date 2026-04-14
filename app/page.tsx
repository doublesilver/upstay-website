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
}

interface Announcement {
  id: number;
  title: string;
  content: string;
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
          setShowPopup(true);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="snap-y snap-proximity h-[calc(100dvh-64px)] overflow-y-auto">
      {/* 1화면: 리모델링 */}
      <section className="snap-start h-[calc(100dvh-64px)] overflow-hidden">
        <Container className="pt-6 pb-8 md:pt-10 md:pb-12 h-full flex flex-col">
          {/* 공지사항 팝업은 아래에 렌더링 */}

          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 md:p-5 flex-1 min-h-0 flex flex-col">
            <div className="flex items-baseline gap-3 shrink-0">
              <h2 className="text-[18px] md:text-[22px] font-bold tracking-tight text-[#111111]">
                리모델링
              </h2>
              <Link
                href="/remodeling"
                className="text-[12px] md:text-[13px] text-[#6B7280] hover:text-[#111111] transition-colors"
              >
                더보기 →
              </Link>
            </div>

            {/* 3열 세로: Before ↓ After */}
            <div className="mt-4 flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 overflow-y-auto md:overflow-hidden">
              {cases.map((c) => (
                <div key={c.id} className="space-y-1.5">
                  <figure>
                    <figcaption className="mb-1 text-[10px] md:text-[11px] font-medium uppercase tracking-wider text-[#9CA3AF]">
                      BEFORE
                    </figcaption>
                    <div className="aspect-[3/2] border border-[#E5E7EB] rounded-lg overflow-hidden bg-[#F9FAFB] relative">
                      <Image
                        src={c.before_image}
                        alt={`${c.title} Before`}
                        fill
                        className="object-cover"
                        sizes="(min-width: 768px) 33vw, 100vw"
                        unoptimized
                      />
                    </div>
                  </figure>
                  <div className="text-center text-[13px] text-[#9CA3AF]">
                    ↓
                  </div>
                  <figure>
                    <figcaption className="mb-1 text-[10px] md:text-[11px] font-medium uppercase tracking-wider text-[#111111]">
                      AFTER
                    </figcaption>
                    <div className="aspect-[3/2] border border-[#E5E7EB] rounded-lg overflow-hidden bg-[#F9FAFB] relative">
                      <Image
                        src={c.after_image}
                        alt={`${c.title} After`}
                        fill
                        className="object-cover"
                        sizes="(min-width: 768px) 33vw, 100vw"
                        unoptimized
                      />
                    </div>
                  </figure>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* 2화면: 서비스 세로 + 푸터 */}
      <section className="snap-start min-h-[calc(100dvh-64px)] bg-[#F9FAFB] border-t border-[#E5E7EB] flex flex-col justify-between">
        <Container className="py-6 md:py-8 w-full flex-1 flex items-center">
          <div className="w-full">
            <ServiceSections />
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
                onClick={() => setShowPopup(false)}
                className="w-full bg-[#111] text-white rounded-lg py-2.5 text-[14px] font-medium hover:bg-[#333] transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
