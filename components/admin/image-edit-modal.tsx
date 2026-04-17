"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, RotateCcw } from "lucide-react";

export interface EditableImage {
  id: number;
  image_url: string;
  image_url_wm?: string;
}

export interface EditSettings {
  sharpness: number;
  brightness: number;
  wmOpacity: number;
  wmScale: number;
  wmPos: { x: number; y: number };
}

interface Props {
  images: EditableImage[];
  initialImageId: number;
  sectionLabel: string;
  onApplyOne: (imageId: number, blob: Blob) => Promise<void> | void;
  onApplyAll: (
    imageIds: number[],
    getBlob: (imageId: number) => Promise<Blob | null>,
  ) => Promise<void> | void;
  onCancel: () => void;
}

const DEFAULT_SETTINGS: EditSettings = {
  sharpness: 100,
  brightness: 100,
  wmOpacity: 50,
  wmScale: 20,
  wmPos: { x: 0.5, y: 0.5 },
};

const POS_GRID: { label: string; x: number; y: number }[] = [
  { label: "↖", x: 0.15, y: 0.12 },
  { label: "↑", x: 0.5, y: 0.12 },
  { label: "↗", x: 0.85, y: 0.12 },
  { label: "←", x: 0.15, y: 0.5 },
  { label: "•", x: 0.5, y: 0.5 },
  { label: "→", x: 0.85, y: 0.5 },
  { label: "↙", x: 0.15, y: 0.88 },
  { label: "↓", x: 0.5, y: 0.88 },
  { label: "↘", x: 0.85, y: 0.88 },
];

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function renderToBlob(
  imageSrc: string,
  logoImg: HTMLImageElement | null,
  s: EditSettings,
): Promise<Blob | null> {
  const base = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = base.width;
  canvas.height = base.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.filter = `brightness(${s.brightness}%) contrast(${s.sharpness}%)`;
  ctx.drawImage(base, 0, 0);
  ctx.filter = "none";

  if (logoImg && s.wmOpacity > 0) {
    const logoW = base.width * (s.wmScale / 100);
    const logoH = (logoImg.height / logoImg.width) * logoW;
    const x = s.wmPos.x * base.width - logoW / 2;
    const y = s.wmPos.y * base.height - logoH / 2;
    ctx.globalAlpha = s.wmOpacity / 100;
    ctx.drawImage(logoImg, x, y, logoW, logoH);
    ctx.globalAlpha = 1;
  }

  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92),
  );
}

export function ImageEditModal({
  images,
  initialImageId,
  sectionLabel,
  onApplyOne,
  onApplyAll,
  onCancel,
}: Props) {
  const [currentId, setCurrentId] = useState<number>(initialImageId);
  const [settings, setSettings] = useState<EditSettings>(DEFAULT_SETTINGS);
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);
  const [saving, setSaving] = useState<"one" | "all" | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const current = useMemo(
    () => images.find((i) => i.id === currentId) ?? images[0],
    [images, currentId],
  );

  useEffect(() => {
    loadImage("/logo.png")
      .then(setLogoImg)
      .catch(() => setLogoImg(null));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const reset = () => setSettings(DEFAULT_SETTINGS);

  const applyOne = async () => {
    if (!current) return;
    setSaving("one");
    const blob = await renderToBlob(current.image_url, logoImg, settings);
    if (blob) await onApplyOne(current.id, blob);
    setSaving(null);
  };

  const applyAll = async () => {
    setSaving("all");
    await onApplyAll(
      images.map((i) => i.id),
      async (id) => {
        const img = images.find((x) => x.id === id);
        if (!img) return null;
        return renderToBlob(img.image_url, logoImg, settings);
      },
    );
    setSaving(null);
  };

  const cssFilter = `brightness(${settings.brightness}%) contrast(${settings.sharpness}%)`;

  const logoW =
    previewRef.current && logoImg
      ? previewRef.current.clientWidth * (settings.wmScale / 100)
      : 0;
  const logoH = logoImg && logoW ? (logoImg.height / logoImg.width) * logoW : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-[1100px] max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-3 border-b border-[#EBEBEB]">
          <h3 className="text-[16px] font-bold text-[#111]">
            사진 편집{" "}
            <span className="text-[12px] font-medium text-[#999] ml-1">
              {sectionLabel}
            </span>
          </h3>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full hover:bg-[#F7F7F7] flex items-center justify-center text-[#999] hover:text-[#111] transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 min-h-0 flex">
          <div className="flex-1 min-w-0 flex flex-col bg-[#FAFAFA]">
            <div className="flex-1 min-h-0 flex items-center justify-center p-4">
              <div
                ref={previewRef}
                className="relative max-w-full max-h-full"
                style={{ lineHeight: 0 }}
              >
                {current && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={current.image_url}
                      alt=""
                      className="max-h-[58vh] max-w-full object-contain block"
                      style={{ filter: cssFilter }}
                    />
                    {logoImg && settings.wmOpacity > 0 && logoW > 0 && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src="/logo.png"
                        alt=""
                        className="absolute pointer-events-none"
                        style={{
                          width: `${logoW}px`,
                          height: `${logoH}px`,
                          left: `calc(${settings.wmPos.x * 100}% - ${logoW / 2}px)`,
                          top: `calc(${settings.wmPos.y * 100}% - ${logoH / 2}px)`,
                          opacity: settings.wmOpacity / 100,
                        }}
                      />
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="border-t border-[#EBEBEB] px-3 py-2 bg-white">
              <div className="flex gap-1.5 overflow-x-auto">
                {images.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setCurrentId(img.id)}
                    className={`w-16 h-16 rounded-md overflow-hidden border-2 shrink-0 transition-all ${
                      img.id === currentId
                        ? "border-[#111]"
                        : "border-transparent hover:border-[#DDD]"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.image_url_wm || img.image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="w-[280px] shrink-0 border-l border-[#EBEBEB] flex flex-col">
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div>
                <p className="text-[11px] font-bold tracking-wider text-[#999] mb-3">
                  사진 수정
                </p>
                <Slider
                  label="선명함"
                  value={settings.sharpness}
                  min={50}
                  max={200}
                  onChange={(v) => setSettings((p) => ({ ...p, sharpness: v }))}
                  unit=""
                />
                <Slider
                  label="밝기"
                  value={settings.brightness}
                  min={50}
                  max={150}
                  onChange={(v) =>
                    setSettings((p) => ({ ...p, brightness: v }))
                  }
                  unit=""
                />
              </div>

              <div className="border-t border-[#EEE]" />

              <div>
                <p className="text-[11px] font-bold tracking-wider text-[#999] mb-3">
                  워터마크 설정
                </p>
                <Slider
                  label="투명도"
                  value={settings.wmOpacity}
                  min={0}
                  max={100}
                  onChange={(v) => setSettings((p) => ({ ...p, wmOpacity: v }))}
                  unit="%"
                />
                <Slider
                  label="크기"
                  value={settings.wmScale}
                  min={5}
                  max={80}
                  onChange={(v) => setSettings((p) => ({ ...p, wmScale: v }))}
                  unit="%"
                />
                <div className="mt-4">
                  <label className="block text-[12px] text-[#333] mb-2">
                    위치
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {POS_GRID.map((g) => {
                      const active =
                        Math.abs(settings.wmPos.x - g.x) < 0.02 &&
                        Math.abs(settings.wmPos.y - g.y) < 0.02;
                      return (
                        <button
                          key={g.label}
                          onClick={() =>
                            setSettings((p) => ({
                              ...p,
                              wmPos: { x: g.x, y: g.y },
                            }))
                          }
                          className={`aspect-square rounded-lg text-[16px] transition-all ${
                            active
                              ? "bg-[#111] text-white"
                              : "bg-[#F7F7F7] text-[#666] hover:bg-[#EBEBEB]"
                          }`}
                        >
                          {g.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[#EBEBEB] p-4 flex items-center justify-end gap-2">
              <button
                onClick={reset}
                className="inline-flex items-center gap-1 border border-[#DDD] rounded-lg px-3 py-2 text-[12px] text-[#666] hover:bg-[#F7F7F7] transition-all"
              >
                <RotateCcw size={12} />
                초기화
              </button>
              <button
                onClick={applyOne}
                disabled={saving !== null}
                className="border border-[#DDD] rounded-lg px-4 py-2 text-[12px] text-[#333] hover:bg-[#F7F7F7] disabled:opacity-40 transition-all"
              >
                {saving === "one" ? "적용 중..." : "적용"}
              </button>
              <button
                onClick={applyAll}
                disabled={saving !== null || images.length === 0}
                className="bg-[#111] text-white rounded-lg px-4 py-2 text-[12px] font-semibold hover:bg-[#333] disabled:opacity-40 transition-all"
              >
                {saving === "all" ? "적용 중..." : "전체 적용"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  onChange,
  unit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  unit: string;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[12px] text-[#333]">{label}</span>
        <span className="text-[11px] text-[#999] bg-[#F7F7F7] rounded-md px-2 py-0.5">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#111]"
      />
    </div>
  );
}
