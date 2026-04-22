"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "@/components/admin/toast";
import {
  StyleToolbar,
  parseStyle,
  type TextStyle,
} from "@/components/admin/style-toolbar";
import { styleToCss } from "@/lib/text-style";
import { apiFetch, getHeaders } from "@/lib/admin-api";
import { DEFAULT_CONFIG, type ConfigRecord } from "@/lib/config-schema";

type Config = ConfigRecord;

const inputCls =
  "w-full border border-[#DDD] rounded-xl px-4 py-3 text-[14px] outline-none transition-all focus:border-[#111] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]";

export default function ConfigPage() {
  const [config, setConfig] = useState<Config>({ ...DEFAULT_CONFIG });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);

  const sloganRef = useRef<HTMLInputElement | null>(null);
  const photoGuideTitleRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    apiFetch("/api/admin/config", {
      headers: getHeaders(),
    })
      .then((r) => r.json())
      .then((data) => setConfig((prev) => ({ ...prev, ...data })))
      .catch(() => setToast("불러오기에 실패했습니다"))
      .finally(() => setLoading(false));
  }, []);

  const set =
    (key: keyof Config) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setConfig((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const setText = (key: keyof Config) => (newValue: string) => {
    setConfig((prev) => ({ ...prev, [key]: newValue }));
  };

  const setStyle = (key: keyof Config) => (style: TextStyle) => {
    setConfig((prev) => ({ ...prev, [key]: JSON.stringify(style) }));
  };

  const getStyle = (key: keyof Config): TextStyle =>
    parseStyle(config[key] || "{}");

  const toggleVisible = (key: keyof Config) => {
    setConfig((prev) => ({
      ...prev,
      [key]: prev[key] === "0" ? "1" : "0",
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiFetch("/api/admin/config", {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(config),
      });
      setToast(res.ok ? "저장되었습니다" : "저장에 실패했습니다");
    } catch {
      setToast("저장에 실패했습니다");
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
          {saving ? "저장 중.." : "저장"}
        </button>
      </div>

      {loading && (
        <div className="py-20 text-center text-[#999] text-[14px]">
          로딩 중...
        </div>
      )}

      <div className={`space-y-10 ${loading ? "hidden" : ""}`}>
        <section className="bg-white border border-[#EBEBEB] rounded-2xl p-6">
          <div className="flex items-center justify-between gap-3 mb-6">
            <h2 className="text-[16px] font-bold text-[#111]">
              사진안내 카테고리
            </h2>
            <VisibilityToggle
              visible={config.photo_guide_visible !== "0"}
              onToggle={() => toggleVisible("photo_guide_visible")}
            />
          </div>
          <div
            className={`space-y-5 transition-opacity ${
              config.photo_guide_visible === "0" ? "opacity-50" : ""
            }`}
          >
            <div>
              <StyleToolbar
                value={getStyle("photo_guide_style")}
                onChange={setStyle("photo_guide_style")}
                inputRef={photoGuideTitleRef}
                onTextChange={setText("photo_guide_title")}
              />
              <input
                ref={photoGuideTitleRef}
                type="text"
                value={config.photo_guide_title}
                onChange={set("photo_guide_title")}
                aria-label="사진안내 제목"
                className={inputCls}
                style={styleToCss(getStyle("photo_guide_style"))}
              />
            </div>
            <div>
              <input
                type="text"
                value={config.photo_guide_caption}
                onChange={set("photo_guide_caption")}
                aria-label="사진안내 보조문구"
                className={inputCls}
              />
            </div>
          </div>
        </section>

        <ConfigSection
          title="안내 카테고리 ( 1 )"
          visible={config.service_remodeling_visible !== "0"}
          onToggle={() => toggleVisible("service_remodeling_visible")}
          titleValue={config.service_remodeling_title}
          descValue={config.service_remodeling_desc}
          captionValue={config.service_remodeling_caption}
          titleStyle={getStyle("service_remodeling_title_style")}
          descStyle={getStyle("service_remodeling_desc_style")}
          onTitleStyleChange={setStyle("service_remodeling_title_style")}
          onDescStyleChange={setStyle("service_remodeling_desc_style")}
          onTitleChange={set("service_remodeling_title")}
          onDescChange={set("service_remodeling_desc")}
          onCaptionChange={set("service_remodeling_caption")}
          onTitleTextChange={setText("service_remodeling_title")}
          onDescTextChange={setText("service_remodeling_desc")}
        />

        <ConfigSection
          title="안내 카테고리 ( 2 )"
          visible={config.service_building_visible !== "0"}
          onToggle={() => toggleVisible("service_building_visible")}
          titleValue={config.service_building_title}
          descValue={config.service_building_desc}
          captionValue={config.service_building_caption}
          titleStyle={getStyle("service_building_title_style")}
          descStyle={getStyle("service_building_desc_style")}
          onTitleStyleChange={setStyle("service_building_title_style")}
          onDescStyleChange={setStyle("service_building_desc_style")}
          onTitleChange={set("service_building_title")}
          onDescChange={set("service_building_desc")}
          onCaptionChange={set("service_building_caption")}
          onTitleTextChange={setText("service_building_title")}
          onDescTextChange={setText("service_building_desc")}
        />

        <ConfigSection
          title="안내 카테고리 ( 3 )"
          visible={config.service_rental_visible !== "0"}
          onToggle={() => toggleVisible("service_rental_visible")}
          titleValue={config.service_rental_title}
          descValue={config.service_rental_desc}
          captionValue={config.service_rental_caption}
          titleStyle={getStyle("service_rental_title_style")}
          descStyle={getStyle("service_rental_desc_style")}
          onTitleStyleChange={setStyle("service_rental_title_style")}
          onDescStyleChange={setStyle("service_rental_desc_style")}
          onTitleChange={set("service_rental_title")}
          onDescChange={set("service_rental_desc")}
          onCaptionChange={set("service_rental_caption")}
          onTitleTextChange={setText("service_rental_title")}
          onDescTextChange={setText("service_rental_desc")}
        />

        <ConfigSection
          title="안내 카테고리 ( 4 )"
          visible={config.service_category4_visible !== "0"}
          onToggle={() => toggleVisible("service_category4_visible")}
          titleValue={config.service_category4_title}
          descValue={config.service_category4_desc}
          captionValue={config.service_category4_caption}
          titleStyle={getStyle("service_category4_title_style")}
          descStyle={getStyle("service_category4_desc_style")}
          onTitleStyleChange={setStyle("service_category4_title_style")}
          onDescStyleChange={setStyle("service_category4_desc_style")}
          onTitleChange={set("service_category4_title")}
          onDescChange={set("service_category4_desc")}
          onCaptionChange={set("service_category4_caption")}
          onTitleTextChange={setText("service_category4_title")}
          onDescTextChange={setText("service_category4_desc")}
        />
      </div>

      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </div>
  );
}

function ConfigSection({
  title,
  visible,
  onToggle,
  titleValue,
  descValue,
  captionValue,
  titleStyle,
  descStyle,
  onTitleStyleChange,
  onDescStyleChange,
  onTitleChange,
  onDescChange,
  onCaptionChange,
  onTitleTextChange,
  onDescTextChange,
}: {
  title: string;
  visible: boolean;
  onToggle: () => void;
  titleValue: string;
  descValue: string;
  captionValue: string;
  titleStyle: TextStyle;
  descStyle: TextStyle;
  onTitleStyleChange: (style: TextStyle) => void;
  onDescStyleChange: (style: TextStyle) => void;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDescChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onCaptionChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTitleTextChange: (newValue: string) => void;
  onDescTextChange: (newValue: string) => void;
}) {
  const titleRef = useRef<HTMLInputElement | null>(null);
  const descRef = useRef<HTMLTextAreaElement | null>(null);

  return (
    <section className="bg-white border border-[#EBEBEB] rounded-2xl p-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h2 className="text-[16px] font-bold text-[#111]">{title}</h2>
        <VisibilityToggle visible={visible} onToggle={onToggle} />
      </div>
      <div
        className={`space-y-5 transition-opacity ${visible ? "" : "opacity-50"}`}
      >
        <div>
          <StyleToolbar
            value={titleStyle}
            onChange={onTitleStyleChange}
            inputRef={titleRef}
            onTextChange={onTitleTextChange}
          />
          <input
            ref={titleRef}
            type="text"
            value={titleValue}
            onChange={onTitleChange}
            className={`${inputCls}`}
            style={styleToCss(titleStyle)}
          />
        </div>
        <div>
          <StyleToolbar
            value={descStyle}
            onChange={onDescStyleChange}
            inputRef={descRef}
            onTextChange={onDescTextChange}
          />
          <textarea
            ref={descRef}
            value={descValue}
            onChange={onDescChange}
            rows={3}
            className={`${inputCls}`}
            style={styleToCss(descStyle)}
          />
        </div>
        <div>
          <input
            type="text"
            value={captionValue}
            onChange={onCaptionChange}
            className={inputCls}
          />
        </div>
      </div>
    </section>
  );
}

function VisibilityToggle({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[12px] font-medium transition-all ${
        visible
          ? "border-[#111] bg-[#111] text-white"
          : "border-[#DDD] bg-white text-[#666]"
      }`}
    >
      <span
        className={`relative block h-4 w-7 rounded-full transition-colors ${
          visible ? "bg-white/30" : "bg-[#DDD]"
        }`}
      >
        <span
          className={`absolute top-[2px] left-[2px] h-3 w-3 rounded-full bg-white transition-transform ${
            visible ? "translate-x-3" : ""
          }`}
        />
      </span>
      {visible ? "노출" : "미노출"}
    </button>
  );
}
