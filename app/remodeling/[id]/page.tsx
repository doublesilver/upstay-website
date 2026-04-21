"use client";

import { ProtectedImage } from "@/components/protected-image";
import Link from "next/link";
import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Container } from "@/components/container";
import { blurDataURL } from "@/lib/shimmer";

interface CaseDetail {
  id: number;
  title: string;
  before_images: string[];
  after_images: string[];
}

export default function RemodelingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [beforeIndex, setBeforeIndex] = useState(0);
  const [afterIndex, setAfterIndex] = useState(0);
  const beforeRef = useRef<HTMLDivElement>(null);
  const afterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/remodeling/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((nextData) => {
        setData(nextData);
        setBeforeIndex(0);
        setAfterIndex(0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const beforeImages = useMemo(() => data?.before_images || [], [data]);
  const afterImages = useMemo(() => data?.after_images || [], [data]);

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
    <Container className="pt-4 pb-8 md:pt-8 md:pb-14">
      {loading && (
        <div className="py-20 text-center text-[#999]">로딩 중..</div>
      )}

      {!loading && !data && (
        <div className="py-20 text-center text-[#999]">
          사례를 찾을 수 없습니다
        </div>
      )}

      {data && (
        <>
          <div className="mb-5">
            <Link
              href="/remodeling"
              className="text-[13px] text-[#666] hover:text-[#111] transition-colors"
            >
              ← 목록으로
            </Link>
          </div>

          <div className="space-y-8 md:space-y-10">
            {beforeImages.length > 0 && (
              <GallerySection
                title="BEFORE"
                images={beforeImages}
                activeIndex={beforeIndex}
                onChange={setBeforeIndex}
                onPrev={() => moveBefore(-1)}
                onNext={() => moveBefore(1)}
                containerRef={beforeRef}
                altPrefix={`${data.title || "리모델링"} Before`}
              />
            )}

            {beforeImages.length > 0 && afterImages.length > 0 && (
              <div className="border-t border-[#EBEBEB] my-8" />
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
                altPrefix={`${data.title || "리모델링"} After`}
              />
            )}

            <div className="bg-white border border-[#EBEBEB] rounded-2xl px-5 py-5 md:px-6 md:py-6">
              <p className="mb-2 text-[12px] text-[#999]">설명</p>
              <p className="text-[14px] text-[#333] leading-[1.8] px-1 md:px-0">
                {data.title || "-"}
              </p>
            </div>
          </div>
        </>
      )}
    </Container>
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
    <section className="space-y-3">
      <p className="text-[11px] uppercase tracking-wider text-[#111] font-medium">
        {title}
      </p>
      <div
        ref={containerRef}
        className="relative aspect-[2/1] border border-[#ccc] rounded-xl overflow-hidden bg-[#F1F8E9]"
      >
        <ProtectedImage
          src={images[activeIndex]}
          alt={`${altPrefix} ${activeIndex + 1}`}
          fill
          className="object-cover"
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
        <div className="flex flex-wrap gap-2">
          {images.map((url, index) => (
            <button
              key={`${url}-${index}`}
              type="button"
              onClick={() => onChange(index)}
              className={`relative w-[56px] h-[56px] md:w-[68px] md:h-[68px] border rounded-lg overflow-hidden bg-[#F1F8E9] ${
                index === activeIndex
                  ? "border-2 border-[#111]"
                  : "border border-[#ccc]"
              }`}
            >
              <ProtectedImage
                src={url}
                alt={`${altPrefix} ${index + 1}`}
                fill
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
