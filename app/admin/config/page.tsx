"use client";

import { useEffect, useState } from "react";
import { Toast } from "@/components/admin/toast";
import {
  StyleToolbar,
  parseStyle,
  type TextStyle,
} from "@/components/admin/style-toolbar";

function getToken() {
  return sessionStorage.getItem("admin_token") || "";
}

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  if (res.status === 401) {
    sessionStorage.removeItem("admin_token");
    window.location.href = "/admin";
    throw new Error("Unauthorized");
  }
  return res;
}

interface Config {
  slogan_text: string;
  service_remodeling_title: string;
  service_remodeling_desc: string;
  service_remodeling_caption: string;
  service_building_title: string;
  service_building_desc: string;
  service_building_caption: string;
  service_rental_title: string;
  service_rental_desc: string;
  service_rental_caption: string;
  [key: string]: string;
}

const defaultConfig: Config = {
  slogan_text: "",
  service_remodeling_title: "",
  service_remodeling_desc: "",
  service_remodeling_caption: "",
  service_building_title: "",
  service_building_desc: "",
  service_building_caption: "",
  service_rental_title: "",
  service_rental_desc: "",
  service_rental_caption: "",
};

const inputCls =
  "w-full border border-[#DDD] rounded-xl px-4 py-3 text-[14px] outline-none transition-all focus:border-[#111] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]";

export default function ConfigPage() {
  const [config, setConfig] = useState<Config>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    apiFetch("/api/admin/config", {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setConfig((prev) => ({ ...prev, ...data }));
      })
      .catch(() => setToast("불러오기 실패"));
  }, []);

  const getStyle = (key: string): TextStyle =>
    parseStyle(config[`${key}_style`] || "{}");
  const setStyle = (key: string) => (style: TextStyle) => {
    setConfig((prev) => ({ ...prev, [`${key}_style`]: JSON.stringify(style) }));
  };

  const set =
    (key: keyof Config) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setConfig((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiFetch("/api/admin/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(config),
      });
      setToast(res.ok ? "저장되었습니다" : "저장 실패");
    } catch {
      setToast("저장 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[26px] font-bold text-[#111] tracking-tight">
            메인창
          </h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#111] text-white rounded-xl px-6 py-3 text-[14px] font-semibold hover:bg-[#333] active:scale-[0.98] disabled:opacity-40 transition-all shrink-0"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>

      <div className="space-y-10">
        {/* 헤더 */}
        <section className="bg-white border border-[#EBEBEB] rounded-2xl p-6">
          <h2 className="text-[16px] font-bold text-[#111] mb-6">
            헤더 ( 상단 헤더에 표시되는 슬로건 문구입니다 )
          </h2>
          <div className="space-y-5">
            <div>
              <StyleToolbar
                value={getStyle("slogan_text")}
                onChange={setStyle("slogan_text")}
              />
              <input
                type="text"
                value={config.slogan_text ?? ""}
                onChange={set("slogan_text")}
                aria-label="슬로건"
                className={inputCls}
              />
            </div>
          </div>
        </section>

        {/* 서비스 소개 - 리모델링 */}
        <section className="bg-white border border-[#EBEBEB] rounded-2xl p-6">
          <h2 className="text-[16px] font-bold text-[#111] mb-1">
            안내 카테고리 (1)
          </h2>
          <div className="space-y-5">
            <div>
              <StyleToolbar
                value={getStyle("service_remodeling_title")}
                onChange={setStyle("service_remodeling_title")}
              />
              <input
                type="text"
                value={config.service_remodeling_title}
                onChange={set("service_remodeling_title")}
                aria-label="안내 카테고리 1 제목"
                className={inputCls}
              />
            </div>
            <div>
              <StyleToolbar
                value={getStyle("service_remodeling_desc")}
                onChange={setStyle("service_remodeling_desc")}
              />
              <textarea
                value={config.service_remodeling_desc}
                onChange={set("service_remodeling_desc")}
                rows={3}
                aria-label="안내 카테고리 1 내용"
                className={inputCls}
              />
            </div>
            <div>
              <StyleToolbar
                value={getStyle("service_remodeling_caption")}
                onChange={setStyle("service_remodeling_caption")}
              />
              <input
                type="text"
                value={config.service_remodeling_caption}
                onChange={set("service_remodeling_caption")}
                aria-label="안내 카테고리 1 보조"
                className={inputCls}
              />
            </div>
          </div>
        </section>

        {/* 서비스 소개 - 건물관리 */}
        <section className="bg-white border border-[#EBEBEB] rounded-2xl p-6">
          <h2 className="text-[16px] font-bold text-[#111] mb-1">
            안내 카테고리 (2)
          </h2>
          <div className="space-y-5">
            <div>
              <StyleToolbar
                value={getStyle("service_building_title")}
                onChange={setStyle("service_building_title")}
              />
              <input
                type="text"
                value={config.service_building_title}
                onChange={set("service_building_title")}
                aria-label="안내 카테고리 2 제목"
                className={inputCls}
              />
            </div>
            <div>
              <StyleToolbar
                value={getStyle("service_building_desc")}
                onChange={setStyle("service_building_desc")}
              />
              <textarea
                value={config.service_building_desc}
                onChange={set("service_building_desc")}
                rows={3}
                aria-label="안내 카테고리 2 내용"
                className={inputCls}
              />
            </div>
            <div>
              <StyleToolbar
                value={getStyle("service_building_caption")}
                onChange={setStyle("service_building_caption")}
              />
              <input
                type="text"
                value={config.service_building_caption}
                onChange={set("service_building_caption")}
                aria-label="안내 카테고리 2 보조"
                className={inputCls}
              />
            </div>
          </div>
        </section>

        {/* 서비스 소개 - 임대관리 */}
        <section className="bg-white border border-[#EBEBEB] rounded-2xl p-6">
          <h2 className="text-[16px] font-bold text-[#111] mb-1">
            안내 카테고리 (3)
          </h2>
          <div className="space-y-5">
            <div>
              <StyleToolbar
                value={getStyle("service_rental_title")}
                onChange={setStyle("service_rental_title")}
              />
              <input
                type="text"
                value={config.service_rental_title}
                onChange={set("service_rental_title")}
                aria-label="안내 카테고리 3 제목"
                className={inputCls}
              />
            </div>
            <div>
              <StyleToolbar
                value={getStyle("service_rental_desc")}
                onChange={setStyle("service_rental_desc")}
              />
              <textarea
                value={config.service_rental_desc}
                onChange={set("service_rental_desc")}
                rows={3}
                aria-label="안내 카테고리 3 내용"
                className={inputCls}
              />
            </div>
            <div>
              <StyleToolbar
                value={getStyle("service_rental_caption")}
                onChange={setStyle("service_rental_caption")}
              />
              <input
                type="text"
                value={config.service_rental_caption}
                onChange={set("service_rental_caption")}
                aria-label="안내 카테고리 3 보조"
                className={inputCls}
              />
            </div>
          </div>
        </section>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </div>
  );
}
