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

  const lightboxImages = lightbox === "before" ? beforeImages : afterImages;
  const lightboxIndex = lightbox === "before" ? beforeIndex : afterIndex;
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
    <div className="flex flex-col gap-3 md:gap-4">
      {(beforeImages.length > 0 || afterImages.length > 0) && (
        <div className="border border-[#111] rounded-xl p-3 bg-[#F1F8E9] flex flex-col gap-3">
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
            <div className="h-px bg-[#E5E7EB] shrink-0" />
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

      <div className="shrink-0">
        <p className="mb-1 text-[11px] text-[#999]">설명</p>
        <div className="border border-[#E5E7EB] rounded-lg p-3">
          <p className="text-[13px] md:text-[14px] text-[#333] leading-[1.6]">
            {title || "-"}
          </p>
        </div>
      </div>

      {lightbox !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="사진 크게 보기"
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <div
            className="flex flex-col items-center gap-3 max-w-[90vw] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between w-full px-1">
              <span className="text-white text-sm">
                {lightboxIndex + 1} / {lightboxImages.length}
              </span>
              <button
                type="button"
                onClick={() => setLightbox(null)}
                aria-label="닫기"
                className="text-white text-xl leading-none px-2 py-1 hover:opacity-70 transition-opacity"
              >
                ✕
              </button>
            </div>

            <ProtectedImage
              src={lightboxImages[lightboxIndex]}
              alt={`라이트박스 ${lightboxIndex + 1}`}
              width={2000}
              height={1500}
              sizes="85vw"
              className="max-w-[85vw] max-h-[65vh] w-auto h-auto object-contain"
              quality={85}
              placeholder="blur"
              blurDataURL={blurDataURL()}
            />

            {lightboxImages.length > 1 && (
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => lightboxMove(-1)}
                  aria-label="이전 사진"
                  className="w-8 h-8 rounded-full bg-white border border-[#111] shrink-0 flex items-center justify-center text-[#111] shadow transition-colors hover:bg-gray-100"
                >
                  &#9664;
                </button>
                <div className="w-px h-5 bg-[#555]" />
                <button
                  type="button"
                  onClick={() => lightboxMove(1)}
                  aria-label="다음 사진"
                  className="w-8 h-8 rounded-full bg-white border border-[#111] shrink-0 flex items-center justify-center text-[#111] shadow transition-colors hover:bg-gray-100"
                >
                  &#9654;
                </button>
              </div>
            )}

            {lightboxImages.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto py-1 px-2 max-w-full">
                {lightboxImages.map((url, i) => (
                  <button
                    key={`${url}-${i}`}
                    type="button"
                    onClick={() =>
                      lightbox === "before"
                        ? setBeforeIndex(i)
                        : setAfterIndex(i)
                    }
                    className={`relative w-12 h-9 shrink-0 rounded overflow-hidden border-2 transition-opacity ${
                      i === lightboxIndex
                        ? "border-white opacity-100"
                        : "border-transparent opacity-60 hover:opacity-90"
                    }`}
                  >
                    <ProtectedImage
                      src={url}
                      alt={`썸네일 ${i + 1}`}
                      fill
                      sizes="48px"
                      className="object-cover"
                      quality={50}
                      loading="eager"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
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
    <section className="flex flex-col gap-2">
      <p className="shrink-0 text-[11px] tracking-wider text-[#111] font-medium">
        {title}
      </p>
      <div className="flex flex-col gap-2 bg-white rounded-xl p-3 border border-[#111]">
        <div
          ref={containerRef}
          onClick={onOpenLightbox}
          className="relative w-full aspect-[4/3] cursor-pointer"
        >
          <ProtectedImage
            src={images[activeIndex]}
            alt={`${altPrefix} ${activeIndex + 1}`}
            fill
            sizes="(max-width: 768px) 90vw, 800px"
            className="object-contain"
            quality={70}
            priority
          />
        </div>
        {images.length > 1 && (
          <div className="flex justify-center items-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPrev();
              }}
              aria-label="이전 사진"
              className="w-7 h-7 rounded bg-[#F1F8E9] border border-[#111] flex items-center justify-center text-[#111] hover:bg-white transition-colors"
            >
              &#9664;
            </button>
            <div className="w-px h-5 bg-[#E5E7EB]" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              aria-label="다음 사진"
              className="w-7 h-7 rounded bg-[#F1F8E9] border border-[#111] flex items-center justify-center text-[#111] hover:bg-white transition-colors"
            >
              &#9654;
            </button>
          </div>
        )}
        {images.length > 1 && (
          <ThumbnailStrip
            images={images}
            activeIndex={activeIndex}
            onChange={onChange}
            altPrefix={altPrefix}
          />
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
        className="flex gap-1.5 overflow-x-auto scrollbar-hide"
      >
        {images.map((url, index) => (
          <button
            key={`${url}-${index}`}
            type="button"
            onClick={() => onChange(index)}
            className={`relative w-[68px] h-[52px] shrink-0 border rounded-lg overflow-hidden bg-[#F1F8E9] ${
              index === activeIndex
                ? "border-2 border-[#111]"
                : "border border-[#ccc]"
            }`}
          >
            <ProtectedImage
              src={url}
              alt={`${altPrefix} ${index + 1}`}
              fill
              sizes="68px"
              className="object-cover"
              quality={70}
              loading="eager"
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
