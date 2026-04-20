"use client";

import Image from "next/image";
import Link from "next/link";
import { blurDataURL } from "@/lib/shimmer";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Container } from "@/components/container";
import { ServiceSections } from "@/components/service-sections";
import { Footer } from "@/components/footer";
import type { RemodelingCase, Announcement } from "@/lib/home-data";

interface Props {
  initialCases: RemodelingCase[];
  initialAnnouncements: Announcement[];
  initialConfig: Record<string, string>;
}

interface TextStyle {
  fontSize?: string;
  fontWeight?: string;
}

function parseStyle(json?: string): TextStyle {
  if (!json) return {};
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

function styleToCss(style: TextStyle): CSSProperties {
  const css: CSSProperties = {};
  if (style.fontSize) css.fontSize = style.fontSize;
  if (style.fontWeight) css.fontWeight = style.fontWeight as CSSProperties["fontWeight"];
  return css;
}

export function HomeClient({
  initialCases,
  initialAnnouncements,
  initialConfig,
}: Props) {
  const [showPopup, setShowPopup] = useState(false);
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
    if (initialAnnouncements.length === 0) return;

    const dismissUntil = localStorage.getItem("popup_dismiss_until");
    if (dismissUntil === "forever") return;
    if (dismissUntil) {
      const expiry = new Date(dismissUntil);
      if (!Number.isNaN(expiry.getTime()) && expiry > new Date()) return;
    }

    setShowPopup(true);
  }, [initialAnnouncements.length]);

  const photoGuideVisible = initialConfig.photo_guide_visible !== "0";
  const photoGuideStyle = styleToCss(parseStyle(initialConfig.photo_guide_style));
  const photoGuideTitle =
    initialConfig.photo_guide_title || "리모델링 사례보기";
  const photoGuideCaption =
    initialConfig.photo_guide_caption || "Before → After";

  return (
    <div className="snap-y snap-mandatory h-[calc(100dvh-56px)] md:h-[calc(100dvh-80px)] overflow-y-auto">
      <section className="snap-start min-h-[calc(100dvh-56px)] md:h-[calc(100dvh-80px)] overflow-hidden">
        <Container className="pt-4 pb-6 md:pt-10 md:pb-12 h-full flex flex-col">
          <div className="bg-[#F1F8E9] border border-[#111111] rounded-xl p-3 md:p-5 flex-1 min-h-0 flex flex-col overflow-y-auto">
            {photoGuideVisible && (
              <div className="shrink-0 flex items-end justify-between gap-3">
                <Link
                  href="/remodeling"
                  className="inline-block bg-white border border-[#ccc] rounded px-1 py-px hover:border-[#999] transition-colors"
                >
                  <h2
                    className="text-[12px] md:text-[18px] font-bold tracking-tight text-[#111111] hover:text-[#6B7280] transition-colors"
                    style={photoGuideStyle}
                  >
                    {photoGuideTitle} →
                  </h2>
                </Link>
                <span className="text-[9px] md:text-[12px] text-[#888] font-medium shrink-0 mt-0 relative top-[4px]">
                  {photoGuideCaption}
                </span>
              </div>
            )}

            <div className="mt-3 md:mt-4 flex-1 min-h-0 space-y-3 md:space-y-4 overflow-y-auto">
              {initialCases.slice(0, 3).map((c, caseIndex) => {
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
                      <GalleryGrid
                        label="BEFORE"
                        images={befores}
                        title={c.title}
                        caseIndex={caseIndex}
                      />
                      <span className="text-[18px] md:text-[22px] font-black text-[#111]">
                        →
                      </span>
                      <GalleryGrid
                        label="AFTER"
                        images={afters}
                        title={c.title}
                        caseIndex={caseIndex}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </Container>
      </section>

      <section className="snap-start min-h-[calc(100dvh-56px)] md:h-[calc(100dvh-80px)] bg-[#faf8f5] border-t border-[#E5E7EB] flex flex-col justify-between overflow-hidden">
        <Container className="py-4 md:py-8 w-full flex-1 flex items-center">
          <div className="w-full">
            <ServiceSections config={initialConfig} />
          </div>
        </Container>
        <Footer config={initialConfig} />
      </section>

      {showPopup && initialAnnouncements.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white rounded-xl shadow-lg w-[90%] max-w-md mx-4 overflow-hidden"
          >
            <div className="px-5 py-4 max-h-[60vh] overflow-y-auto space-y-3">
              {initialAnnouncements.map((announcement) => (
                <div key={announcement.id}>
                  {announcement.content && (
                    <p className="text-[13px] text-[#6B7280] leading-[1.6]">
                      {announcement.content}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-[#E5E7EB]">
              <button
                ref={closeBtnRef}
                onClick={() => {
                  const durations = initialAnnouncements.map(
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

function GalleryGrid({
  label,
  images,
  title,
  caseIndex,
}: {
  label: "BEFORE" | "AFTER";
  images: string[];
  title: string;
  caseIndex: number;
}) {
  return (
    <div>
      <p className="text-[11px] md:text-[11px] uppercase tracking-wider text-[#666] mb-1 font-medium">
        {label}
      </p>
      <div className="grid grid-cols-2 gap-1">
        {images.slice(0, 4).map((url, index) => (
          <div
            key={`${label}-${index}-${url}`}
            className="aspect-square border border-[#111] rounded overflow-hidden bg-[#F1F8E9] relative"
          >
            <Image
              src={url}
              alt={`${title || "리모델링 사례"} ${label} ${index + 1}번 사진`}
              fill
              className="object-cover"
              sizes="20vw"
              quality={70}
              placeholder="blur"
              blurDataURL={blurDataURL()}
              {...(caseIndex === 0 && index === 0 && label === "BEFORE"
                ? { priority: true, fetchPriority: "high" }
                : {})}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
