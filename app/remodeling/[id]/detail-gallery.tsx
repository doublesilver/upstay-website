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

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3 md:gap-4">
      {beforeImages.length > 0 && (
        <GallerySection
          title="BEFORE"
          images={beforeImages}
          activeIndex={beforeIndex}
          onChange={setBeforeIndex}
          onPrev={() => moveBefore(-1)}
          onNext={() => moveBefore(1)}
          containerRef={beforeRef}
          altPrefix={`${title || "리모델링"} Before`}
        />
      )}

      {beforeImages.length > 0 && afterImages.length > 0 && (
        <div className="border-t border-[#EBEBEB] shrink-0" />
      )}

      {afterImages.length > 0 && (
        <GallerySection
          title="AFTER"
          images={afterImages}
          activeIndex={afterIndex}
          onChange={setAfterIndex}
          onPrev={() => moveAfter(-1)}
          onNext={() => moveAfter(1)}
          containerRef={afterRef}
          altPrefix={`${title || "리모델링"} After`}
        />
      )}

      <div className="shrink-0 bg-white border border-[#EBEBEB] rounded-2xl px-4 py-3 md:px-5 md:py-4">
        <p className="mb-1 text-[11px] text-[#999]">설명</p>
        <p className="text-[13px] md:text-[14px] text-[#333] leading-[1.6]">
          {title || "-"}
        </p>
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
}: {
  title: string;
  images: string[];
  activeIndex: number;
  onChange: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  altPrefix: string;
}) {
  return (
    <section className="flex-1 min-h-0 flex flex-col gap-2">
      <p className="shrink-0 text-[11px] uppercase tracking-wider text-[#111] font-medium">
        {title}
      </p>
      <div
        ref={containerRef}
        className="flex-1 min-h-0 relative border border-[#ccc] rounded-xl overflow-hidden bg-[#F1F8E9]"
      >
        <ProtectedImage
          src={images[activeIndex]}
          alt={`${altPrefix} ${activeIndex + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 80vw"
          className="object-contain"
          quality={70}
          priority={title === "BEFORE"}
          placeholder="blur"
          blurDataURL={blurDataURL()}
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={onPrev}
              aria-label="이전 사진"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 hover:bg-white flex items-center justify-center text-[#111] shadow transition-colors"
            >
              &#9664;
            </button>
            <button
              type="button"
              onClick={onNext}
              aria-label="다음 사진"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 hover:bg-white flex items-center justify-center text-[#111] shadow transition-colors"
            >
              &#9654;
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="shrink-0 flex flex-wrap gap-2">
          {images.map((url, index) => (
            <button
              key={`${url}-${index}`}
              type="button"
              onClick={() => onChange(index)}
              className={`relative w-[44px] h-[44px] md:w-[56px] md:h-[56px] border rounded-lg overflow-hidden bg-[#F1F8E9] ${
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
      )}
    </section>
  );
}
