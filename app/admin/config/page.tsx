"use client";

import { useEffect, useState } from "react";
import { Toast } from "@/components/admin/toast";

function getToken() {
  return sessionStorage.getItem("admin_token") || "";
}

export default function ConfigPage() {
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch("/api/admin/config", {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setHeroTitle(data.hero_title || "");
        setHeroSubtitle(data.hero_subtitle || "");
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/admin/config", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        hero_title: heroTitle,
        hero_subtitle: heroSubtitle,
      }),
    });
    setSaving(false);
    setToast("저장되었습니다");
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[26px] font-bold text-[#111] tracking-tight">
          메인 문구 관리
        </h1>
        <p className="mt-1 text-[14px] text-[#888]">
          메인 페이지에 표시되는 타이틀을 수정합니다
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 편집 영역 */}
        <div className="bg-white border border-[#EBEBEB] rounded-2xl p-6">
          <h2 className="text-[15px] font-semibold text-[#111] mb-5">
            문구 편집
          </h2>

          <div className="space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-[#333] mb-2">
                메인 타이틀
              </label>
              <textarea
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                rows={3}
                className="w-full border border-[#DDD] rounded-xl px-4 py-3 text-[14px] outline-none transition-all focus:border-[#111] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)] resize-none"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#333] mb-2">
                서브타이틀
              </label>
              <input
                type="text"
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                className="w-full border border-[#DDD] rounded-xl px-4 py-3 text-[14px] outline-none transition-all focus:border-[#111] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-6 bg-[#111] text-white rounded-xl px-6 py-3 text-[14px] font-semibold hover:bg-[#333] active:scale-[0.98] disabled:opacity-40 transition-all"
          >
            {saving ? "저장 중..." : "변경사항 저장"}
          </button>
        </div>

        {/* 미리보기 */}
        <div className="bg-white border border-[#EBEBEB] rounded-2xl p-6">
          <h2 className="text-[15px] font-semibold text-[#111] mb-5">
            미리보기
          </h2>
          <div className="bg-[#F7F7F7] rounded-xl p-6 min-h-[200px] flex flex-col justify-center">
            <h3 className="text-[20px] font-bold text-[#111] leading-relaxed whitespace-pre-line">
              {heroTitle || "(타이틀 미입력)"}
            </h3>
            <p className="mt-2 text-[14px] text-[#888]">
              {heroSubtitle || "(서브타이틀 미입력)"}
            </p>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </div>
  );
}
