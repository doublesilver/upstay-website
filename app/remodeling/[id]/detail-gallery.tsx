"use client";

import { ProtectedImage } from "@/components/protected-image";
import { useCallback, useEffect, useRef, useState } from "react";
import { blurDataURL } from "@/lib/shimmer";

export function DetailGallery({
  title,
  beforeImages,
  afterImages,
}: {
  title: string;
  beforeImages: string[];
  afterImages: string[];
}) {
  const [beforeIndex, setBeforeIndex] = useState(0);
  const [afterIndex, setAfterIndex] = useState(0);
  const [lightbox, setLightbox] = useState<"before" | "after" | null>(null);
  const beforeRef = useRef<HTMLDivElement>(null);
  const afterRef = useRef<HTMLDivElement>(null);

  const moveBefore = useCallback(
    (direction: number) => {
      if (beforeImages.length === 0) return;
      setBeforeIndex(
        (index) =>
          (index + direction + beforeImages.length) % beforeImages.length,
      );
    },
    [beforeImages.length],
  );

  const moveAfter = useCallback(
    (direction: number) => {
      if (afterImages.length === 0) return;
      setAfterIndex(
        (index) =>
          (index + direction + afterImages.length) % afterImages.length,
      );
    },
    [afterImages.length],
  );

  useEffect(() => {
    const bindSwipe = (
      ref: React.RefObject<HTMLDivElement | null>,
      move: (direction: number) => void,
    ) => {
      const el = ref.current;
      if (!el) return () => {};

      let startX = 0;
      const onStart = (event: TouchEvent) => {
        startX = event.touches[0].clientX;
      };
      const onEnd = (event: TouchEvent) => {
        const diff = startX - event.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) move(diff > 0 ? 1 : -1);
      };

      el.addEventListener("touchstart", onStart, { passive: true });
      el.addEventListener("touchend", onEnd, { passive: true });

      return () => {
        el.removeEventListener("touchstart", onStart);
        el.removeEventListener("touchend", onEnd);
      };
    };

    const cleanBefore = bindSwipe(beforeRef, moveBefore);
    const cleanAfter = bindSwipe(afterRef, moveAfter);
    return () => {
      cleanBefore();
      cleanAfter();
    };
  }, [moveBefore, moveAfter]);

  const lightboxMove = lightbox === "before" ? moveBefore : moveAfter;

  useEffect(() => {
    if (lightbox === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowLeft") lightboxMove(-1);
      if (e.key === "ArrowRight") lightboxMove(1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [lightbox, lightboxMove]);

  return (
    <div className="h-full min-h-0 flex flex-col gap-2 md:gap-3">
      {(beforeImages.length > 0 || afterImages.length > 0) && (
        <div className="flex-1 min-h-0 border border-[#111] rounded-xl p-2 md:p-3 bg-[#F1F8E9] flex flex-col landscape:flex-row lg:flex-row gap-2 md:gap-3">
          {beforeImages.length > 0 && (
            <GallerySection
              title="Before (전)"
              images={beforeImages}
              activeIndex={beforeIndex}
              onChange={setBeforeIndex}
              onPrev={() => moveBefore(-1)}
              onNext={() => moveBefore(1)}
              containerRef={beforeRef}
              altPrefix={`${title || "리모델링"} Before`}
              onOpenLightbox={() => setLightbox("before")}
            />
          )}

          {beforeImages.length > 0 && afterImages.length > 0 && (
            <div className="h-px landscape:h-auto landscape:w-px lg:h-auto lg:w-px bg-[#E5E7EB] shrink-0" />
          )}

          {afterImages.length > 0 && (
            <GallerySection
              title="After (후)"
              images={afterImages}
              activeIndex={afterIndex}
              onChange={setAfterIndex}
              onPrev={() => moveAfter(-1)}
              onNext={() => moveAfter(1)}
              containerRef={afterRef}
              altPrefix={`${title || "리모델링"} After`}
              onOpenLightbox={() => setLightbox("after")}
            />
          )}
        </div>
      )}

      <div className="shrink-0 border border-black rounded-lg flex max-h-[20svh] overflow-hidden lg:hidden">
        <div className="shrink-0 flex flex-col items-center justify-center px-2 py-2 text-[12px] text-[#111] font-bold leading-[1.2]">
          <span>설</span>
          <span>명</span>
        </div>
        <div className="w-px bg-[#D1D5DB] shrink-0 my-2" />
        <div className="flex-1 min-w-0 px-3 py-2 overflow-y-auto">
          <p className="text-[13px] md:text-[14px] text-[#111] leading-[1.5] whitespace-pre-wrap">
            {title || "-"}
          </p>
        </div>
      </div>

      {lightbox !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="사진 크게 보기"
          className="fixed inset-0 z-50 bg-[#F1F8E9] flex flex-col items-center justify-center p-2"
          onClick={() => setLightbox(null)}
        >
          <div
            className="flex flex-col gap-2 max-w-[94vw] w-full lg:max-w-[1100px] border border-[#111] rounded-xl p-2 bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-end w-full px-1">
              <button
                type="button"
                onClick={() => setLightbox(null)}
                aria-label="닫기"
                className="text-[#111] text-xl leading-none px-2 py-1 hover:opacity-70 transition-opacity"
              >
                ✕
              </button>
            </div>

            <div className="flex lg:flex-row flex-col gap-4">
              <div
                className={`${lightbox === "before" ? "" : "hidden"} lg:block ${beforeImages.length === 0 ? "hidden" : ""} flex-1 min-w-0`}
              >
                <LightboxColumn
                  label="Before (전)"
                  images={beforeImages}
                  activeIndex={beforeIndex}
                  onPrev={() => moveBefore(-1)}
                  onNext={() => moveBefore(1)}
                  onSelect={setBeforeIndex}
                />
              </div>

              {beforeImages.length > 0 && afterImages.length > 0 && (
                <div className="hidden lg:block w-px bg-[#E5E7EB] shrink-0 self-stretch" />
              )}

              <div
                className={`${lightbox === "after" ? "" : "hidden"} lg:block ${afterImages.length === 0 ? "hidden" : ""} flex-1 min-w-0`}
              >
                <LightboxColumn
                  label="After (후)"
                  images={afterImages}
                  activeIndex={afterIndex}
                  onPrev={() => moveAfter(-1)}
                  onNext={() => moveAfter(1)}
                  onSelect={setAfterIndex}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LightboxColumn({
  label,
  images,
  activeIndex,
  onPrev,
  onNext,
  onSelect,
}: {
  label: string;
  images: string[];
  activeIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
}) {
  if (images.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-[#111] text-sm font-medium">{label}</span>
        <span className="text-[#111] text-sm">
          ( {activeIndex + 1} / {images.length} )
        </span>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:gap-2">
        {images.length > 1 && (
          <button
            type="button"
            onClick={onPrev}
            aria-label="이전 사진"
            className="hidden lg:flex shrink-0 w-10 h-24 rounded bg-[#F1F8E9] border border-[#111] items-center justify-center text-[#111] shadow transition-colors hover:bg-[#E8F0DC]"
          >
            &#9664;
          </button>
        )}
        <div className="relative w-full lg:flex-1 aspect-[4/3] overflow-hidden rounded">
          <ProtectedImage
            src={images[activeIndex]}
            alt={`${label} ${activeIndex + 1}`}
            fill
            sizes="(min-width: 1024px) 450px, 85vw"
            className="object-cover"
            quality={85}
            placeholder="blur"
            blurDataURL={blurDataURL()}
          />
        </div>
        {images.length > 1 && (
          <button
            type="button"
            onClick={onNext}
            aria-label="다음 사진"
            className="hidden lg:flex shrink-0 w-10 h-24 rounded bg-[#F1F8E9] border border-[#111] items-center justify-center text-[#111] shadow transition-colors hover:bg-[#E8F0DC]"
          >
            &#9654;
          </button>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex items-center justify-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={onPrev}
            aria-label="이전 사진"
            className="w-12 h-8 rounded bg-[#F1F8E9] border border-[#111] shrink-0 flex items-center justify-center text-[#111] shadow transition-colors hover:bg-[#E8F0DC]"
          >
            &#9664;
          </button>
          <div className="w-px h-5 bg-[#555]" />
          <button
            type="button"
            onClick={onNext}
            aria-label="다음 사진"
            className="w-12 h-8 rounded bg-[#F1F8E9] border border-[#111] shrink-0 flex items-center justify-center text-[#111] shadow transition-colors hover:bg-[#E8F0DC]"
          >
            &#9654;
          </button>
        </div>
      )}

      {images.length > 1 && (
        <>
          <div className="w-full h-px bg-[#E5E5E5]" />
          <div className="flex gap-1 overflow-x-auto w-full">
            {images.map((url, i) => (
              <button
                key={`${url}-${i}`}
                type="button"
                onClick={() => onSelect(i)}
                style={{ width: "calc((100% - 16px) / 5)" }}
                className={`relative shrink-0 aspect-[4/3] rounded overflow-hidden border-2 transition-opacity ${
                  i === activeIndex
                    ? "border-[#111] opacity-100"
                    : "border-transparent opacity-60 hover:opacity-90"
                }`}
              >
                <ProtectedImage
                  src={url}
                  alt={`${label} 썸네일 ${i + 1}`}
                  fill
                  sizes="20vw"
                  className="object-cover"
                  quality={50}
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </>
      )}

      <div className="hidden" aria-hidden="true">
        {images[(activeIndex - 1 + images.length) % images.length] && (
          <ProtectedImage
            src={images[(activeIndex - 1 + images.length) % images.length]}
            alt=""
            fill
            sizes="500px"
            quality={85}
            loading="eager"
          />
        )}
        {images[(activeIndex + 1) % images.length] && (
          <ProtectedImage
            src={images[(activeIndex + 1) % images.length]}
            alt=""
            fill
            sizes="500px"
            quality={85}
            loading="eager"
          />
        )}
      </div>
    </div>
  );
}

function GallerySection({
  title,
  images,
  activeIndex,
  onChange,
  onPrev,
  onNext,
  containerRef,
  altPrefix,
  onOpenLightbox,
}: {
  title: string;
  images: string[];
  activeIndex: number;
  onChange: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  altPrefix: string;
  onOpenLightbox: () => void;
}) {
  return (
    <section className="flex-1 min-h-0 min-w-0 flex flex-col gap-1">
      <p className="shrink-0 text-[11px] tracking-wider text-[#111] font-medium">
        {title}
      </p>
      <div className="flex-1 min-h-0 flex flex-col gap-1.5 bg-white rounded-xl p-2 md:p-2.5 border border-[#111]">
        <div className="flex-1 min-h-0 flex items-center gap-2">
          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPrev();
              }}
              aria-label="이전 사진"
              className="shrink-0 w-7 h-14 rounded bg-[#F1F8E9] border border-[#111] flex items-center justify-center text-[#111] hover:bg-white transition-colors"
            >
              &#9664;
            </button>
          )}
          <div
            ref={containerRef}
            onClick={onOpenLightbox}
            className="flex-1 min-h-0 self-stretch relative cursor-pointer touch-pan-y select-none will-change-transform"
          >
            <ProtectedImage
              src={images[activeIndex]}
              alt={`${altPrefix} ${activeIndex + 1}`}
              fill
              sizes="(max-width: 768px) 90vw, 800px"
              className="object-contain pointer-events-none"
              quality={70}
              priority
            />
          </div>
          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              aria-label="다음 사진"
              className="shrink-0 w-7 h-14 rounded bg-[#F1F8E9] border border-[#111] flex items-center justify-center text-[#111] hover:bg-white transition-colors"
            >
              &#9654;
            </button>
          )}
        </div>
        {images.length > 1 && (
          <div className="shrink-0 border-t border-gray-300 pt-1.5">
            <ThumbnailStrip
              images={images}
              activeIndex={activeIndex}
              onChange={onChange}
              altPrefix={altPrefix}
            />
          </div>
        )}
      </div>
    </section>
  );
}

function ThumbnailStrip({
  images,
  activeIndex,
  onChange,
  altPrefix,
}: {
  images: string[];
  activeIndex: number;
  onChange: (index: number) => void;
  altPrefix: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const updateFades = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const hasOverflow = el.scrollWidth > el.clientWidth + 1;
    setShowLeftFade(hasOverflow && el.scrollLeft > 4);
    setShowRightFade(
      hasOverflow && el.scrollLeft < el.scrollWidth - el.clientWidth - 4,
    );
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateFades();
    el.addEventListener("scroll", updateFades, { passive: true });
    const ro = new ResizeObserver(updateFades);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateFades);
      ro.disconnect();
    };
  }, [updateFades, images.length, activeIndex]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const active = el.children[activeIndex] as HTMLElement | undefined;
    if (!active) return;
    const target =
      active.offsetLeft - (el.clientWidth - active.clientWidth) / 2;
    el.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [activeIndex]);

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex gap-1 overflow-x-auto scrollbar-hide w-full"
      >
        {images.map((url, index) => (
          <button
            key={`${url}-${index}`}
            type="button"
            onClick={() => onChange(index)}
            style={{ width: "calc((100% - 16px) / 5)" }}
            className={`relative shrink-0 aspect-[4/3] rounded-lg overflow-hidden bg-[#F1F8E9] ${
              index === activeIndex
                ? "border-2 border-[#111]"
                : "border border-[#ccc]"
            }`}
          >
            <ProtectedImage
              src={url}
              alt={`${altPrefix} ${index + 1}`}
              fill
              sizes="20vw"
              className="object-cover"
              quality={70}
              loading="lazy"
            />
          </button>
        ))}
      </div>
      {showLeftFade && (
        <div className="pointer-events-none absolute top-0 left-0 h-full w-10 bg-gradient-to-r from-white to-transparent" />
      )}
      {showRightFade && (
        <div className="pointer-events-none absolute top-0 right-0 h-full w-10 bg-gradient-to-l from-white to-transparent" />
      )}
    </div>
  );
}
