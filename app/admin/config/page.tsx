"use client";

import { useEffect, useState } from "react";
import { Toast } from "@/components/admin/toast";

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
  value,
  onChange,
}: {
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
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-start">
            <span className="text-[12px] text-[#BBB] pt-2.5 w-5 shrink-0 text-center">
              {i + 1}
            </span>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                placeholder="제목"
                value={item.title}
                onChange={(e) => updateItem(i, "title", e.target.value)}
                className="w-[120px] shrink-0 border border-[#DDD] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#111] transition-all"
              />
              <input
                type="text"
                placeholder="설명"
                value={item.description}
                onChange={(e) => updateItem(i, "description", e.target.value)}
                className="flex-1 border border-[#DDD] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#111] transition-all"
              />
            </div>
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="mt-1.5 text-[#CCC] hover:text-red-400 transition-all"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addItem}
        className="mt-2 text-[12px] text-[#888] border border-dashed border-[#DDD] rounded-lg px-3 py-1.5 hover:bg-[#F7F7F7] transition-all"
      >
        + 항목 추가
      </button>
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px] text-[#999] mt-1 leading-relaxed">{children}</p>
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
            사이트에 표시되는 문구를 수정합니다. 저장하면 즉시 반영됩니다.
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

      <div className="space-y-10">
        {/* 메인 페이지 상단 */}
        <section className="bg-white border border-[#EBEBEB] rounded-2xl p-6">
          <h2 className="text-[16px] font-bold text-[#111] mb-1">
            메인 화면 상단
          </h2>
          <p className="text-[13px] text-[#999] mb-6">
            사이트 첫 화면에서 가장 먼저 보이는 큰 글씨 영역입니다
          </p>
          <div className="space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-[#333] mb-1.5">
                메인 타이틀
              </label>
              <textarea
                value={config.hero_title}
                onChange={set("hero_title")}
                rows={3}
                className={`${inputCls} resize-none`}
              />
              <Hint>
                홈페이지 첫 화면 중앙에 크게 표시됩니다. 줄바꿈을 하면 실제
                화면에서도 줄이 바뀝니다.
              </Hint>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#333] mb-1.5">
                서브타이틀
              </label>
              <input
                type="text"
                value={config.hero_subtitle}
                onChange={set("hero_subtitle")}
                className={inputCls}
              />
              <Hint>메인 타이틀 바로 아래에 작은 글씨로 표시됩니다.</Hint>
            </div>
          </div>
        </section>

        {/* 리모델링 섹션 (메인 페이지) */}
        <section className="bg-white border border-[#EBEBEB] rounded-2xl p-6">
          <h2 className="text-[16px] font-bold text-[#111] mb-1">
            리모델링 섹션 (메인 페이지)
          </h2>
          <p className="text-[13px] text-[#999] mb-6">
            메인 페이지에서 Before/After 사진 위에 표시되는 제목과 버튼
            문구입니다
          </p>
          <div className="space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-[#333] mb-1.5">
                섹션 제목
              </label>
              <input
                type="text"
                value={config.remodeling_section_title}
                onChange={set("remodeling_section_title")}
                className={inputCls}
              />
              <Hint>Before/After 사진 영역 상단에 표시되는 제목입니다.</Hint>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#333] mb-1.5">
                더보기 버튼 문구
              </label>
              <input
                type="text"
                value={config.remodeling_more_text}
                onChange={set("remodeling_more_text")}
                className={inputCls}
              />
              <Hint>리모델링 상세 페이지로 이동하는 링크 텍스트입니다.</Hint>
            </div>
          </div>
        </section>

        {/* 리모델링 페이지 */}
        <section className="bg-white border border-[#EBEBEB] rounded-2xl p-6">
          <h2 className="text-[16px] font-bold text-[#111] mb-1">
            리모델링 페이지
          </h2>
          <p className="text-[13px] text-[#999] mb-6">
            &ldquo;리모델링&rdquo; 메뉴를 클릭했을 때 나오는 전용 페이지의 상단
            문구입니다
          </p>
          <div className="space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-[#333] mb-1.5">
                페이지 제목
              </label>
              <input
                type="text"
                value={config.remodeling_page_title}
                onChange={set("remodeling_page_title")}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#333] mb-1.5">
                페이지 부제목
              </label>
              <input
                type="text"
                value={config.remodeling_page_subtitle}
                onChange={set("remodeling_page_subtitle")}
                className={inputCls}
              />
            </div>
          </div>
        </section>

        {/* 서비스 소개 - 리모델링 */}
        <section className="bg-white border border-[#EBEBEB] rounded-2xl p-6">
          <h2 className="text-[16px] font-bold text-[#111] mb-1">
            서비스 소개 — 리모델링
          </h2>
          <p className="text-[13px] text-[#999] mb-6">
            모든 페이지 하단의 &ldquo;서비스 안내&rdquo; 영역 중 리모델링
            카테고리입니다
          </p>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-[#333] mb-1.5">
                  카테고리 제목
                </label>
                <input
                  type="text"
                  value={config.service_remodeling_title}
                  onChange={set("service_remodeling_title")}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#333] mb-1.5">
                  카테고리 설명
                </label>
                <input
                  type="text"
                  value={config.service_remodeling_caption}
                  onChange={set("service_remodeling_caption")}
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#333] mb-2">
                세부 항목
              </label>
              <Hint>
                리모델링 서비스의 세부 항목입니다. 제목과 설명을 수정하거나
                항목을 추가/삭제할 수 있습니다.
              </Hint>
              <div className="mt-3">
                <ItemsEditor
                  value={config.remodeling_items}
                  onChange={setVal("remodeling_items")}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 서비스 소개 - 건물관리 */}
        <section className="bg-white border border-[#EBEBEB] rounded-2xl p-6">
          <h2 className="text-[16px] font-bold text-[#111] mb-1">
            서비스 소개 — 건물관리
          </h2>
          <p className="text-[13px] text-[#999] mb-6">
            서비스 안내 영역 중 건물관리 카테고리입니다
          </p>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-[#333] mb-1.5">
                  카테고리 제목
                </label>
                <input
                  type="text"
                  value={config.service_building_title}
                  onChange={set("service_building_title")}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#333] mb-1.5">
                  카테고리 설명
                </label>
                <input
                  type="text"
                  value={config.service_building_caption}
                  onChange={set("service_building_caption")}
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#333] mb-2">
                세부 항목
              </label>
              <div className="mt-1">
                <ItemsEditor
                  value={config.building_items}
                  onChange={setVal("building_items")}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 서비스 소개 - 임대관리 */}
        <section className="bg-white border border-[#EBEBEB] rounded-2xl p-6">
          <h2 className="text-[16px] font-bold text-[#111] mb-1">
            서비스 소개 — 임대관리
          </h2>
          <p className="text-[13px] text-[#999] mb-6">
            서비스 안내 영역 중 임대관리 카테고리입니다
          </p>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-[#333] mb-1.5">
                  카테고리 제목
                </label>
                <input
                  type="text"
                  value={config.service_rental_title}
                  onChange={set("service_rental_title")}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#333] mb-1.5">
                  카테고리 설명
                </label>
                <input
                  type="text"
                  value={config.service_rental_caption}
                  onChange={set("service_rental_caption")}
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#333] mb-2">
                세부 항목
              </label>
              <div className="mt-1">
                <ItemsEditor
                  value={config.rental_items}
                  onChange={setVal("rental_items")}
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </div>
  );
}
