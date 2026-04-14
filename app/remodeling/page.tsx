"use client";

import Image from "next/image";
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
  image_count?: number;
}

const fallbackCases: RemodelingCase[] = staticCases.map((c, i) => ({
  id: i + 1,
  before_image: c.before,
  after_image: c.after,
  title: `사례 ${c.id}`,
}));

export default function RemodelingPage() {
  const [cases, setCases] = useState<RemodelingCase[]>(fallbackCases);
  const [config, setConfig] = useState<Record<string, string>>({});

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
          <Link key={item.id} href={`/remodeling/${item.id}`} className="block">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-6">
              <figure>
                <div className="aspect-[4/3] border border-[#E5E7EB] overflow-hidden bg-[#F9FAFB] relative">
                  <Image
                    src={item.before_image}
                    alt={`${item.title} Before`}
                    fill
                    className="object-cover"
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
                    className="object-cover"
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
          </Link>
        ))}
      </section>

      <div className="mt-16">
        <ServiceSections config={config} />
      </div>
    </Container>
  );
}
