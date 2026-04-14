"use client";

import { useEffect, useState } from "react";
import { Toast } from "@/components/admin/toast";
import { ServiceSections } from "@/components/service-sections";

function getToken() {
  return sessionStorage.getItem("admin_token") || "";
}

type Item = { title: string; description: string };

interface Config {
  hero_title: string;
  hero_subtitle: string;
  remodeling_section_title: string;
  remodeling_more_text: string;
  remodeling_page_title: string;
  remodeling_page_subtitle: string;
  service_remodeling_title: string;
  service_remodeling_caption: string;
  service_building_title: string;
  service_building_caption: string;
  service_rental_title: string;
  service_rental_caption: string;
  remodeling_items: string;
  building_items: string;
  rental_items: string;
  [key: string]: string;
}

const defaultConfig: Config = {
  hero_title: "",
  hero_subtitle: "",
  remodeling_section_title: "",
  remodeling_more_text: "",
  remodeling_page_title: "",
  remodeling_page_subtitle: "",
  service_remodeling_title: "",
  service_remodeling_caption: "",
  service_building_title: "",
  service_building_caption: "",
  service_rental_title: "",
  service_rental_caption: "",
  remodeling_items: "[]",
  building_items: "[]",
  rental_items: "[]",
};

function parseItems(json: string): Item[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function ItemsEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const items = parseItems(value);

  const updateItem = (index: number, field: keyof Item, text: string) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: text } : item,
    );
    onChange(JSON.stringify(updated));
  };

  const addItem = () => {
    onChange(JSON.stringify([...items, { title: "", description: "" }]));
  };

  const removeItem = (index: number) => {
    onChange(JSON.stringify(items.filter((_, i) => i !== index)));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[13px] font-medium text-[#333]">{label}</span>
        <button
          type="button"
          onClick={addItem}
          className="text-[12px] text-[#555] border border-[#DDD] rounded-lg px-2.5 py-1 hover:bg-[#F7F7F7] transition-all"
        >
          + 항목 추가
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-start">
            <div className="flex-1 space-y-1.5">
              <input
                type="text"
                placeholder="제목"
                value={item.title}
                onChange={(e) => updateItem(i, "title", e.target.value)}
                className="w-full border border-[#DDD] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#111] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)] transition-all"
              />
              <input
                type="text"
                placeholder="설명"
                value={item.description}
                onChange={(e) => updateItem(i, "description", e.target.value)}
                className="w-full border border-[#DDD] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#111] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)] transition-all"
              />
            </div>
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="mt-1 text-[#BBB] hover:text-red-400 transition-all text-[16px] leading-none px-1"
            >
              ×
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-[12px] text-[#BBB] py-2">항목이 없습니다</p>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[13px] font-semibold text-[#999] uppercase tracking-wider mb-4 pb-2 border-b border-[#EBEBEB]">
      {children}
    </h3>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-[#333] mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full border border-[#DDD] rounded-xl px-4 py-3 text-[14px] outline-none transition-all focus:border-[#111] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]";

export default function ConfigPage() {
  const [config, setConfig] = useState<Config>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch("/api/admin/config", {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setConfig((prev) => ({ ...prev, ...data }));
      });
  }, []);

  const set =
    (key: keyof Config) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setConfig((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const setVal = (key: keyof Config) => (v: string) => {
    setConfig((prev) => ({ ...prev, [key]: v }));
  };

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/admin/config", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(config),
    });
    setSaving(false);
    setToast("저장되었습니다");
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[26px] font-bold text-[#111] tracking-tight">
            편집기
          </h1>
          <p className="mt-1 text-[14px] text-[#888]">
            사이트 콘텐츠를 편집하고 실시간으로 미리봅니다
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#111] text-white rounded-xl px-6 py-3 text-[14px] font-semibold hover:bg-[#333] active:scale-[0.98] disabled:opacity-40 transition-all shrink-0"
        >
          {saving ? "저장 중..." : "변경사항 저장"}
        </button>
      </div>

      <div className="flex gap-6 items-start">
        {/* 좌측 편집 폼 */}
        <div className="flex-1 min-w-0 space-y-8 max-h-[calc(100vh-160px)] overflow-y-auto pr-2">
          {/* 히어로 */}
          <div>
            <SectionLabel>히어로</SectionLabel>
            <div className="space-y-4">
              <Field label="메인 타이틀">
                <textarea
                  value={config.hero_title}
                  onChange={set("hero_title")}
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </Field>
              <Field label="서브타이틀">
                <input
                  type="text"
                  value={config.hero_subtitle}
                  onChange={set("hero_subtitle")}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          {/* 메인 페이지 */}
          <div>
            <SectionLabel>메인 페이지</SectionLabel>
            <div className="space-y-4">
              <Field label="리모델링 섹션 제목">
                <input
                  type="text"
                  value={config.remodeling_section_title}
                  onChange={set("remodeling_section_title")}
                  className={inputCls}
                />
              </Field>
              <Field label="더보기 텍스트">
                <input
                  type="text"
                  value={config.remodeling_more_text}
                  onChange={set("remodeling_more_text")}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          {/* 리모델링 페이지 */}
          <div>
            <SectionLabel>리모델링 페이지</SectionLabel>
            <div className="space-y-4">
              <Field label="페이지 제목">
                <input
                  type="text"
                  value={config.remodeling_page_title}
                  onChange={set("remodeling_page_title")}
                  className={inputCls}
                />
              </Field>
              <Field label="페이지 서브타이틀">
                <input
                  type="text"
                  value={config.remodeling_page_subtitle}
                  onChange={set("remodeling_page_subtitle")}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          {/* 서비스 섹션 */}
          <div>
            <SectionLabel>서비스 섹션</SectionLabel>
            <div className="space-y-6">
              {/* 리모델링 */}
              <div className="bg-[#FAFAFA] rounded-xl p-4 space-y-3">
                <p className="text-[12px] font-semibold text-[#666]">
                  리모델링
                </p>
                <Field label="제목">
                  <input
                    type="text"
                    value={config.service_remodeling_title}
                    onChange={set("service_remodeling_title")}
                    className={inputCls}
                  />
                </Field>
                <Field label="캡션">
                  <input
                    type="text"
                    value={config.service_remodeling_caption}
                    onChange={set("service_remodeling_caption")}
                    className={inputCls}
                  />
                </Field>
              </div>
              {/* 건물관리 */}
              <div className="bg-[#FAFAFA] rounded-xl p-4 space-y-3">
                <p className="text-[12px] font-semibold text-[#666]">
                  건물관리
                </p>
                <Field label="제목">
                  <input
                    type="text"
                    value={config.service_building_title}
                    onChange={set("service_building_title")}
                    className={inputCls}
                  />
                </Field>
                <Field label="캡션">
                  <input
                    type="text"
                    value={config.service_building_caption}
                    onChange={set("service_building_caption")}
                    className={inputCls}
                  />
                </Field>
              </div>
              {/* 임대관리 */}
              <div className="bg-[#FAFAFA] rounded-xl p-4 space-y-3">
                <p className="text-[12px] font-semibold text-[#666]">
                  임대관리
                </p>
                <Field label="제목">
                  <input
                    type="text"
                    value={config.service_rental_title}
                    onChange={set("service_rental_title")}
                    className={inputCls}
                  />
                </Field>
                <Field label="캡션">
                  <input
                    type="text"
                    value={config.service_rental_caption}
                    onChange={set("service_rental_caption")}
                    className={inputCls}
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* 서비스 아이템 */}
          <div>
            <SectionLabel>서비스 아이템</SectionLabel>
            <div className="space-y-6">
              <div className="bg-[#FAFAFA] rounded-xl p-4">
                <ItemsEditor
                  label="리모델링 아이템"
                  value={config.remodeling_items}
                  onChange={setVal("remodeling_items")}
                />
              </div>
              <div className="bg-[#FAFAFA] rounded-xl p-4">
                <ItemsEditor
                  label="건물관리 아이템"
                  value={config.building_items}
                  onChange={setVal("building_items")}
                />
              </div>
              <div className="bg-[#FAFAFA] rounded-xl p-4">
                <ItemsEditor
                  label="임대관리 아이템"
                  value={config.rental_items}
                  onChange={setVal("rental_items")}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 우측 미리보기 */}
        <div className="w-[420px] shrink-0 sticky top-8">
          <div className="bg-white border border-[#EBEBEB] rounded-2xl p-5 max-h-[calc(100vh-160px)] overflow-y-auto">
            <h2 className="text-[15px] font-semibold text-[#111] mb-4">
              미리보기
            </h2>

            {/* 히어로 미리보기 */}
            <div className="bg-[#F7F7F7] rounded-xl p-5 mb-4">
              <h3 className="text-[18px] font-bold text-[#111] leading-relaxed whitespace-pre-line">
                {config.hero_title || "(타이틀 미입력)"}
              </h3>
              <p className="mt-2 text-[13px] text-[#888]">
                {config.hero_subtitle || "(서브타이틀 미입력)"}
              </p>
            </div>

            {/* 서비스 섹션 미리보기 */}
            <div>
              <p className="text-[11px] text-[#BBB] mb-2">서비스 섹션</p>
              <ServiceSections config={config} />
            </div>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </div>
  );
}
