"use client";

import { useEffect, useState } from "react";

function getToken() {
  return sessionStorage.getItem("admin_token") || "";
}

export default function ConfigPage() {
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

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
    setMsg("");
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
    setMsg("저장되었습니다");
    setSaving(false);
    setTimeout(() => setMsg(""), 2000);
  };

  return (
    <div>
      <h1 className="text-[20px] font-bold text-[#111] mb-6">메인 문구 관리</h1>
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 max-w-lg">
        <label className="block text-[13px] font-medium text-[#111] mb-1">
          메인 타이틀
        </label>
        <textarea
          value={heroTitle}
          onChange={(e) => setHeroTitle(e.target.value)}
          rows={3}
          className="w-full border border-[#E5E7EB] rounded px-3 py-2 text-[14px] mb-4 outline-none focus:border-[#111] resize-none"
        />

        <label className="block text-[13px] font-medium text-[#111] mb-1">
          서브타이틀
        </label>
        <input
          type="text"
          value={heroSubtitle}
          onChange={(e) => setHeroSubtitle(e.target.value)}
          className="w-full border border-[#E5E7EB] rounded px-3 py-2 text-[14px] mb-4 outline-none focus:border-[#111]"
        />

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#111] text-white rounded px-5 py-2 text-[13px] font-medium hover:bg-[#333] transition-colors disabled:opacity-50"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
          {msg && <span className="text-[13px] text-green-600">{msg}</span>}
        </div>
      </div>
    </div>
  );
}
