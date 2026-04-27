"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

export function KakaoButton() {
  const [showKakaoInfo, setShowKakaoInfo] = useState(false);

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
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
          onClick={() => setShowKakaoInfo(false)}
          role="dialog"
          aria-modal="true"
          aria-label="카카오톡 문의"
        >
          <div
            className="bg-white rounded-xl p-6 max-w-[320px] mx-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-[#111] mb-3">카카오톡 ID</h2>
            <p className="text-sm text-[#555] mb-4">친구추가 후 문의주세요</p>
            <div className="border border-[#111] rounded-lg p-3 text-center mb-4">
              <span className="text-xl font-bold text-[#111]">mh.0624</span>
            </div>
            <div className="mx-3 h-px bg-[#E5E5E5] mb-4" />
            <button
              type="button"
              onClick={() => setShowKakaoInfo(false)}
              className="w-full bg-[#111] text-white py-3 rounded-lg font-semibold"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  );
}
