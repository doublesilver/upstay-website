"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { Container } from "@/components/container";

interface RemodelingCase {
  id: number;
  title: string;
  before_image: string;
  after_image: string;
  before_images: string[];
  after_images: string[];
}

export default function RemodelingPage() {
  return (
    <Suspense>
      <RemodelingPageInner />
    </Suspense>
  );
}

function RemodelingPageInner() {
  const [cases, setCases] = useState<RemodelingCase[]>([]);

  useEffect(() => {
    fetch("/api/remodeling?all=true")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setCases(data);
      })
      .catch(() => {});
  }, []);

  return (
    <Container className="pt-8 pb-12 md:pt-16 md:pb-16">
      <div className="space-y-4 md:space-y-5 bg-[#fdf6ee] border border-[#111111] rounded-xl p-3 md:p-4">
        {cases.map((c) => {
          const befores = c.before_images?.length
            ? c.before_images
            : [c.before_image].filter(Boolean);
          const afters = c.after_images?.length
            ? c.after_images
            : [c.after_image].filter(Boolean);
          return (
            <Link
              key={c.id}
              href={`/remodeling/${c.id}`}
              className="block w-full bg-white border border-[#111111] rounded-xl p-2 md:p-3 text-left hover:shadow-md transition-shadow"
            >
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <div>
                  <p className="text-[11px] md:text-[11px] uppercase tracking-wider text-[#111] mb-1 font-medium">
                    BEFORE
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {befores.slice(0, 4).map((url, j) => (
                      <div
                        key={j}
                        className="aspect-square border border-[#111] rounded overflow-hidden bg-[#fdf6ee] relative"
                      >
                        <Image
                          src={url}
                          alt={`Before ${j + 1}`}
                          fill
                          className="object-cover"
                          sizes="20vw"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <span className="text-[18px] md:text-[22px] font-black text-[#111]">
                  &rarr;
                </span>
                <div>
                  <p className="text-[11px] md:text-[11px] uppercase tracking-wider text-[#111] mb-1 font-medium">
                    AFTER
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {afters.slice(0, 4).map((url, j) => (
                      <div
                        key={j}
                        className="aspect-square border border-[#111] rounded overflow-hidden bg-[#fdf6ee] relative"
                      >
                        <Image
                          src={url}
                          alt={`After ${j + 1}`}
                          fill
                          className="object-cover"
                          sizes="20vw"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </Container>
  );
}
