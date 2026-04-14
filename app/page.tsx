"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Container } from "@/components/container";
import { ServiceSections } from "@/components/service-sections";
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
    <>
      <Container className="pt-8 pb-12 md:pt-12 md:pb-16">
        {announcements.length > 0 && (
          <section className="mb-8">
            <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-4 py-3">
              {announcements.map((a) => (
                <div key={a.id} className="flex items-start gap-2 py-1.5">
                  <span className="shrink-0 text-[11px] font-medium bg-[#111] text-white rounded px-1.5 py-0.5 mt-0.5">
                    공지
                  </span>
                  <p className="text-[13px] md:text-[14px] text-[#111]">
                    {a.title}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="bg-white border border-[#E5E7EB] rounded-xl p-5 md:p-6">
          <div className="flex items-baseline gap-3">
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

          <div className="mt-6 space-y-6 md:space-y-8">
            {cases.map((c) => (
              <div
                key={c.id}
                className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-5"
              >
                <figure>
                  <div className="aspect-[4/3] border border-[#E5E7EB] overflow-hidden bg-[#F9FAFB]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.before_image}
                      alt="Before"
                      className="w-full h-full object-cover"
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
                  <div className="aspect-[4/3] border border-[#E5E7EB] overflow-hidden bg-[#F9FAFB]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.after_image}
                      alt="After"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <figcaption className="mt-2 text-[10px] md:text-[12px] uppercase tracking-wider text-[#6B7280]">
                    AFTER
                  </figcaption>
                </figure>
              </div>
            ))}
          </div>
        </section>
      </Container>

      {/* 건물관리 + 임대관리: 별도 풀너비 섹션, 한 화면에 보이도록 */}
      <section className="bg-[#F9FAFB] border-t border-[#E5E7EB]">
        <Container className="py-10 md:py-12">
          <ServiceSections />
        </Container>
      </section>
    </>
  );
}
