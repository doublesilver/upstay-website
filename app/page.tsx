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
        if (Array.isArray(data)) setAnnouncements(data);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="snap-y snap-mandatory h-[calc(100dvh-56px)] overflow-y-auto">
      {/* 1화면: 리모델링 */}
      <section className="snap-start h-[calc(100dvh-56px)] overflow-hidden">
        <Container className="pt-6 pb-8 md:pt-10 md:pb-12 h-full flex flex-col">
          {announcements.length > 0 && (
            <div className="mb-4 shrink-0">
              <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-4 py-2.5">
                {announcements.map((a) => (
                  <div key={a.id} className="flex items-start gap-2 py-1">
                    <span className="shrink-0 text-[11px] font-medium bg-[#111] text-white rounded px-1.5 py-0.5 mt-0.5">
                      공지
                    </span>
                    <p className="text-[13px] md:text-[14px] text-[#111]">
                      {a.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 md:p-6 flex-1 min-h-0 flex flex-col">
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

            {/* 데스크탑: 가로 3열 / 모바일: 세로 */}
            <div className="mt-4 flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 overflow-y-auto md:overflow-hidden">
              {cases.map((c) => (
                <div key={c.id} className="space-y-2">
                  <figure>
                    <figcaption className="mb-1.5 text-[11px] md:text-[12px] font-medium uppercase tracking-wider text-[#9CA3AF]">
                      BEFORE
                    </figcaption>
                    <div className="aspect-[4/3] border border-[#E5E7EB] rounded-lg overflow-hidden bg-[#F9FAFB] relative">
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
                  <div className="text-center text-[14px] text-[#9CA3AF]">
                    ↓
                  </div>
                  <figure>
                    <figcaption className="mb-1.5 text-[11px] md:text-[12px] font-medium uppercase tracking-wider text-[#111111]">
                      AFTER
                    </figcaption>
                    <div className="aspect-[4/3] border border-[#E5E7EB] rounded-lg overflow-hidden bg-[#F9FAFB] relative">
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

      {/* 2화면: 서비스 3컬럼 + 푸터 */}
      <section className="snap-start h-[calc(100dvh-56px)] bg-[#F9FAFB] border-t border-[#E5E7EB] flex flex-col justify-between">
        <Container className="py-8 md:py-10 w-full flex-1 flex items-center">
          <div className="w-full">
            <ServiceSections />
          </div>
        </Container>
        <Footer />
      </section>
    </div>
  );
}
