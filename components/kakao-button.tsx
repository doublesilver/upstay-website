"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

const KAKAO_ID = "mh.0624";

export function KakaoButton() {
  const [showKakaoInfo, setShowKakaoInfo] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!showKakaoInfo) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowKakaoInfo(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", handleKey);
    };
  }, [showKakaoInfo]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(KAKAO_ID);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowKakaoInfo(true)}
        aria-label="카카오톡 문의"
        className="block h-10 w-10 md:h-11 md:w-11 rounded-xl overflow-hidden hover:opacity-90 transition"
      >
        <Image
          src="/icon-kakao.png"
          alt="카카오톡 문의"
          width={44}
          height={44}
          className="w-full h-full object-cover"
        />
      </button>

      {showKakaoInfo && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setShowKakaoInfo(false)}
          role="dialog"
          aria-modal="true"
          aria-label="카카오톡 친구추가"
        >
          <div
            className="bg-[#F5F5E7] rounded-2xl p-5 max-w-[calc(100vw-2rem)] w-fit flex flex-col items-stretch"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-[15px] font-medium text-[#111] text-center mb-4 whitespace-nowrap">
              카카오톡 친구추가
            </h2>

            <button
              type="button"
              onClick={handleCopyId}
              className="bg-white border border-[#DDD] rounded-lg py-3 px-2 text-[14px] text-[#111] hover:bg-[#FAFAFA] transition whitespace-nowrap"
            >
              {copied ? "복사됨" : `ID: ${KAKAO_ID}`}
            </button>

            <div className="h-px bg-[#DDD] my-3" />

            <button
              type="button"
              onClick={() => setShowKakaoInfo(false)}
              className="bg-[#111] text-white rounded-lg py-3 text-[14px] font-medium hover:bg-[#333] transition"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  );
}
