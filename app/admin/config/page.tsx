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

interface Config {
  remodeling_section_title: string;
  remodeling_page_title: string;
  remodeling_page_subtitle: string;
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
  remodeling_section_title: "",
  remodeling_page_title: "",
  remodeling_page_subtitle: "",
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
    const res = await fetch("/api/admin/config", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(config),
    });
    setSaving(false);
    setToast(res.ok ? "저장되었습니다" : "저장 실패");
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
        {/* 헤더 */}
        <section className="bg-white border border-[#EBEBEB] rounded-2xl p-6">
          <h2 className="text-[16px] font-bold text-[#111] mb-1">헤더</h2>
          <p className="text-[13px] text-[#999] mb-6">
            상단 헤더에 표시되는 슬로건 문구입니다
          </p>
          <div className="space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-[#333] mb-1.5">
                슬로건
              </label>
              <StyleToolbar
                value={getStyle("slogan_text")}
                onChange={setStyle("slogan_text")}
              />
              <input
                type="text"
                value={config.slogan_text ?? ""}
                onChange={set("slogan_text")}
                className={inputCls}
              />
              <Hint>헤더 네비게이션 아래에 표시되는 슬로건 문구입니다.</Hint>
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
              <StyleToolbar
                value={getStyle("remodeling_section_title")}
                onChange={setStyle("remodeling_section_title")}
              />
              <input
                type="text"
                value={config.remodeling_section_title}
                onChange={set("remodeling_section_title")}
                className={inputCls}
              />
              <Hint>Before/After 사진 영역 상단에 표시되는 제목입니다.</Hint>
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
              <StyleToolbar
                value={getStyle("remodeling_page_title")}
                onChange={setStyle("remodeling_page_title")}
              />
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
              <StyleToolbar
                value={getStyle("remodeling_page_subtitle")}
                onChange={setStyle("remodeling_page_subtitle")}
              />
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
            <div>
              <label className="block text-[13px] font-medium text-[#333] mb-1.5">
                카테고리 제목
              </label>
              <StyleToolbar
                value={getStyle("service_remodeling_title")}
                onChange={setStyle("service_remodeling_title")}
              />
              <input
                type="text"
                value={config.service_remodeling_title}
                onChange={set("service_remodeling_title")}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#333] mb-1.5">
                서비스 내용
              </label>
              <StyleToolbar
                value={getStyle("service_remodeling_desc")}
                onChange={setStyle("service_remodeling_desc")}
              />
              <textarea
                value={config.service_remodeling_desc}
                onChange={set("service_remodeling_desc")}
                rows={3}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#333] mb-1.5">
                서비스 캡션
              </label>
              <StyleToolbar
                value={getStyle("service_remodeling_caption")}
                onChange={setStyle("service_remodeling_caption")}
              />
              <input
                type="text"
                value={config.service_remodeling_caption}
                onChange={set("service_remodeling_caption")}
                className={inputCls}
              />
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
            <div>
              <label className="block text-[13px] font-medium text-[#333] mb-1.5">
                카테고리 제목
              </label>
              <StyleToolbar
                value={getStyle("service_building_title")}
                onChange={setStyle("service_building_title")}
              />
              <input
                type="text"
                value={config.service_building_title}
                onChange={set("service_building_title")}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#333] mb-1.5">
                서비스 내용
              </label>
              <StyleToolbar
                value={getStyle("service_building_desc")}
                onChange={setStyle("service_building_desc")}
              />
              <textarea
                value={config.service_building_desc}
                onChange={set("service_building_desc")}
                rows={3}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#333] mb-1.5">
                서비스 캡션
              </label>
              <StyleToolbar
                value={getStyle("service_building_caption")}
                onChange={setStyle("service_building_caption")}
              />
              <input
                type="text"
                value={config.service_building_caption}
                onChange={set("service_building_caption")}
                className={inputCls}
              />
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
            <div>
              <label className="block text-[13px] font-medium text-[#333] mb-1.5">
                카테고리 제목
              </label>
              <StyleToolbar
                value={getStyle("service_rental_title")}
                onChange={setStyle("service_rental_title")}
              />
              <input
                type="text"
                value={config.service_rental_title}
                onChange={set("service_rental_title")}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#333] mb-1.5">
                서비스 내용
              </label>
              <StyleToolbar
                value={getStyle("service_rental_desc")}
                onChange={setStyle("service_rental_desc")}
              />
              <textarea
                value={config.service_rental_desc}
                onChange={set("service_rental_desc")}
                rows={3}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#333] mb-1.5">
                서비스 캡션
              </label>
              <StyleToolbar
                value={getStyle("service_rental_caption")}
                onChange={setStyle("service_rental_caption")}
              />
              <input
                type="text"
                value={config.service_rental_caption}
                onChange={set("service_rental_caption")}
                className={inputCls}
              />
            </div>
          </div>
        </section>

        {/* 푸터 사업자 정보 */}
        <section className="bg-white border border-[#EBEBEB] rounded-2xl p-6">
          <h2 className="text-[16px] font-bold text-[#111] mb-1">
            푸터 사업자 정보
          </h2>
          <p className="text-[13px] text-[#999] mb-4">
            라벨명과 값을 수정할 수 있습니다
          </p>
          <div className="grid grid-cols-2 gap-4 mb-6 p-3 bg-[#F9F9F9] rounded-xl">
            <div>
              <label className="block text-[12px] text-[#999] mb-1">
                왼쪽 : 위치 (음수=왼쪽, 양수=오른쪽)
              </label>
              <input
                type="text"
                value={config.footer_colon_left_offset ?? "0px"}
                onChange={set("footer_colon_left_offset")}
                className={inputCls}
                placeholder="0px"
              />
            </div>
            <div>
              <label className="block text-[12px] text-[#999] mb-1">
                오른쪽 : 위치 (음수=왼쪽, 양수=오른쪽)
              </label>
              <input
                type="text"
                value={config.footer_colon_right_offset ?? "0px"}
                onChange={set("footer_colon_right_offset")}
                className={inputCls}
                placeholder="0px"
              />
            </div>
          </div>
          <div className="space-y-5">
            {[
              {
                label: "상호명",
                labelKey: "footer_label_name",
                valueKey: "footer_name",
              },
              {
                label: "영문명",
                labelKey: "",
                valueKey: "footer_english_name",
              },
              {
                label: "대표자명",
                labelKey: "footer_label_ceo",
                valueKey: "footer_ceo",
              },
              {
                label: "사업자등록번호",
                labelKey: "footer_label_business_number",
                valueKey: "footer_business_number",
              },
              {
                label: "전화번호",
                labelKey: "footer_label_phone",
                valueKey: "footer_phone",
              },
              {
                label: "주소",
                labelKey: "footer_label_address",
                valueKey: "footer_address",
              },
            ].map((field) => (
              <div
                key={field.valueKey}
                className="grid grid-cols-[1fr_auto_2fr] gap-3 items-end"
              >
                {field.labelKey ? (
                  <div>
                    <label className="block text-[12px] text-[#999] mb-1">
                      라벨명
                    </label>
                    <input
                      type="text"
                      value={config[field.labelKey] ?? ""}
                      onChange={set(field.labelKey)}
                      className={inputCls}
                      placeholder={field.label}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[12px] text-[#999] mb-1">
                      라벨
                    </label>
                    <div className="px-4 py-3 text-[14px] text-[#999]">
                      {field.label}
                    </div>
                  </div>
                )}
                {field.labelKey ? (
                  <div>
                    <label className="block text-[12px] text-[#999] mb-1 whitespace-nowrap">
                      자간
                    </label>
                    <input
                      type="text"
                      value={config[`${field.labelKey}_spacing`] ?? ""}
                      onChange={set(`${field.labelKey}_spacing`)}
                      className="w-[70px] border border-[#DDD] rounded-xl px-3 py-3 text-[14px] outline-none focus:border-[#111] transition-all"
                      placeholder="0em"
                    />
                  </div>
                ) : (
                  <div />
                )}
                <div>
                  <label className="block text-[12px] text-[#999] mb-1">
                    값
                  </label>
                  <input
                    type="text"
                    value={config[field.valueKey] ?? ""}
                    onChange={set(field.valueKey)}
                    className={inputCls}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </div>
  );
}
