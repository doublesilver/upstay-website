"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { use } from "react";
import { Container } from "@/components/container";

interface Pair {
  match_order: number;
  before_image: string;
  after_image: string;
}

interface CaseDetail {
  id: number;
  title: string;
  pairs: Pair[];
}

function PairRow({ pair, index }: { pair: Pair; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-6 transition-all duration-500 ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transitionDelay: `${index * 150}ms`,
      }}
    >
      <figure>
        <div className="aspect-[4/3] border border-[#E5E7EB] overflow-hidden bg-[#F9FAFB] relative">
          <Image
            src={pair.before_image}
            alt="Before"
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
            src={pair.after_image}
            alt="After"
            fill
            className="object-cover"
            sizes="45vw"
            unoptimized
          />
        </div>
        <figcaption className="mt-2 text-[10px] md:text-[12px] uppercase tracking-wider text-[#6B7280]">
          AFTER
        </figcaption>
      </figure>
    </div>
  );
}

export default function RemodelingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<CaseDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/remodeling/${id}`)
      .then((r) => {
        if (!r.ok) {
          setNotFound(true);
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (d) setData(d);
      })
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <Container className="pt-16 pb-16 text-center">
        <h1 className="text-[22px] font-bold text-[#111]">
          사례를 찾을 수 없습니다
        </h1>
        <Link
          href="/remodeling"
          className="mt-4 inline-block text-[14px] text-[#6B7280] hover:text-[#111]"
        >
          ← 목록으로 돌아가기
        </Link>
      </Container>
    );
  }

  if (!data) {
    return (
      <Container className="pt-16 pb-16 text-center">
        <div className="text-[#999]">로딩 중...</div>
      </Container>
    );
  }

  return (
    <Container className="pt-8 pb-12 md:pt-16 md:pb-16">
      <Link
        href="/remodeling"
        className="text-[13px] text-[#6B7280] hover:text-[#111] transition-colors"
      >
        ← 목록으로 돌아가기
      </Link>

      <h1 className="mt-4 text-[22px] md:text-[28px] font-bold tracking-tight text-[#111]">
        {data.title}
      </h1>
      <p className="mt-2 text-[12px] uppercase tracking-wider text-[#6B7280]">
        Before → After
      </p>
      <div className="mt-6 border-t border-[#E5E7EB]" />

      <section className="mt-8 space-y-8 md:space-y-12">
        {data.pairs.map((pair, index) => (
          <PairRow key={pair.match_order} pair={pair} index={index} />
        ))}
      </section>
    </Container>
  );
}
