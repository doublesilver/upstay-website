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

  useEffect(() => {
    if (lightbox === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [lightbox]);

  const lightboxImages = lightbox === "before" ? beforeImages : afterImages;
  const lightboxIndex = lightbox === "before" ? beforeIndex : afterIndex;
  const lightboxMove = lightbox === "before" ? moveBefore : moveAfter;

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
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <div
            className="flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <ProtectedImage
              src={lightboxImages[lightboxIndex]}
              alt={`라이트박스 ${lightboxIndex + 1}`}
              width={2000}
              height={1500}
              sizes="85vw"
              className="max-w-[85vw] max-h-[80vh] w-auto h-auto object-contain"
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
                  className="w-8 h-8 rounded-full bg-[#F1F8E9] border border-[#111] shrink-0 flex items-center justify-center text-[#111] shadow transition-colors hover:bg-white"
                >
                  &#9664;
                </button>
                <div className="w-px h-5 bg-[#E5E7EB]" />
                <button
                  type="button"
                  onClick={() => lightboxMove(1)}
                  aria-label="다음 사진"
                  className="w-8 h-8 rounded-full bg-[#F1F8E9] border border-[#111] shrink-0 flex items-center justify-center text-[#111] shadow transition-colors hover:bg-white"
                >
                  &#9654;
                </button>
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
      <div className="flex gap-3 bg-white rounded-xl p-3 border border-[#111]">
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div
            ref={containerRef}
            onClick={onOpenLightbox}
            className="relative w-full aspect-[4/3] cursor-pointer"
          >
            <ProtectedImage
              src={images[activeIndex]}
              alt={`${altPrefix} ${activeIndex + 1}`}
              fill
              sizes="(max-width: 768px) 70vw, 70vw"
              className="object-contain"
              quality={70}
              priority={title === "Before (전)"}
              placeholder="blur"
              blurDataURL={blurDataURL()}
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
                className="w-7 h-7 rounded flex items-center justify-center text-[#111] hover:bg-[#F1F8E9] transition-colors"
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
                className="w-7 h-7 rounded flex items-center justify-center text-[#111] hover:bg-[#F1F8E9] transition-colors"
              >
                &#9654;
              </button>
            </div>
          )}
        </div>
        {images.length > 1 && (
          <>
            <div className="w-px bg-[#E5E7EB] shrink-0" />
            <div className="shrink-0 flex flex-col gap-1.5 w-[56px] md:w-[68px] max-h-[420px] overflow-y-auto">
              {images.map((url, index) => (
                <button
                  key={`${url}-${index}`}
                  type="button"
                  onClick={() => onChange(index)}
                  className={`relative w-full h-[48px] shrink-0 border rounded-lg overflow-hidden bg-[#F1F8E9] ${
                    index === activeIndex
                      ? "border-2 border-[#111]"
                      : "border border-[#ccc]"
                  }`}
                >
                  <ProtectedImage
                    src={url}
                    alt={`${altPrefix} ${index + 1}`}
                    fill
                    sizes="(max-width: 768px) 56px, 68px"
                    className="object-cover"
                    quality={70}
                    placeholder="blur"
                    blurDataURL={blurDataURL()}
                  />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
