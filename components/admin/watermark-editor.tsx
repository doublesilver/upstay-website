"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface WatermarkEditorProps {
  src: string;
  onSave: (blob: Blob) => void;
  onCancel: () => void;
}

const PRESETS = [
  { label: "중앙", x: 0.5, y: 0.5 },
  { label: "좌상", x: 0.15, y: 0.12 },
  { label: "우상", x: 0.85, y: 0.12 },
  { label: "좌하", x: 0.15, y: 0.88 },
  { label: "우하", x: 0.85, y: 0.88 },
];

export function WatermarkEditor({
  src,
  onSave,
  onCancel,
}: WatermarkEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [baseImg, setBaseImg] = useState<HTMLImageElement | null>(null);
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);
  const [opacity, setOpacity] = useState(0.3);
  const [scale, setScale] = useState(0.25);
  const [pos, setPos] = useState({ x: 0.5, y: 0.5 });
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setBaseImg(img);
    img.src = src;

    const logo = new Image();
    logo.crossOrigin = "anonymous";
    logo.onload = () => setLogoImg(logo);
    logo.src = "/logo.png";
  }, [src]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImg) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = baseImg.width;
    canvas.height = baseImg.height;
    ctx.drawImage(baseImg, 0, 0);

    if (logoImg) {
      const logoW = baseImg.width * scale;
      const logoH = (logoImg.height / logoImg.width) * logoW;
      const x = pos.x * baseImg.width - logoW / 2;
      const y = pos.y * baseImg.height - logoH / 2;
      ctx.globalAlpha = opacity;
      ctx.drawImage(logoImg, x, y, logoW, logoH);
      ctx.globalAlpha = 1;
    }
  }, [baseImg, logoImg, opacity, scale, pos]);

  useEffect(() => {
    draw();
  }, [draw]);

  const updatePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setPos({
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    });
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaving(true);
    canvas.toBlob(
      (blob) => {
        if (blob) onSave(blob);
        setSaving(false);
      },
      "image/jpeg",
      0.92,
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EBEBEB]">
          <h3 className="text-[18px] font-bold text-[#111]">워터마크</h3>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full hover:bg-[#F7F7F7] flex items-center justify-center text-[#999] hover:text-[#111] transition-all"
          >
            <svg
              width="18"
              height="18"
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

        <div className="flex-1 min-h-0 p-5 flex gap-5">
          {/* 캔버스 */}
          <div className="flex-1 min-w-0 flex items-center justify-center bg-[#FAFAFA] rounded-xl overflow-hidden">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-[55vh] cursor-move"
              onMouseDown={(e) => {
                setDragging(true);
                updatePos(e);
              }}
              onMouseMove={(e) => {
                if (dragging) updatePos(e);
              }}
              onMouseUp={() => setDragging(false)}
              onMouseLeave={() => setDragging(false)}
            />
          </div>

          {/* 컨트롤 패널 */}
          <div className="w-56 shrink-0 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[13px] font-medium text-[#333]">
                  투명도
                </label>
                <span className="text-[12px] text-[#999] bg-[#F7F7F7] rounded-md px-2 py-0.5">
                  {Math.round(opacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full accent-[#111]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[13px] font-medium text-[#333]">
                  크기
                </label>
                <span className="text-[12px] text-[#999] bg-[#F7F7F7] rounded-md px-2 py-0.5">
                  {Math.round(scale * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.8"
                step="0.05"
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="w-full accent-[#111]"
              />
            </div>

            <div>
              <label className="text-[13px] font-medium text-[#333] mb-2 block">
                위치 프리셋
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => setPos({ x: p.x, y: p.y })}
                    className={`py-1.5 rounded-lg text-[12px] transition-all ${
                      Math.abs(pos.x - p.x) < 0.05 &&
                      Math.abs(pos.y - p.y) < 0.05
                        ? "bg-[#111] text-white"
                        : "bg-[#F7F7F7] text-[#666] hover:bg-[#EBEBEB]"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[12px] text-[#BBB] leading-relaxed">
              사진 위를 클릭하거나 드래그하여 워터마크 위치를 조정하세요
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#EBEBEB]">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl text-[14px] text-[#666] hover:bg-[#F7F7F7] transition-all"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#111] text-white rounded-xl px-5 py-2.5 text-[14px] font-semibold hover:bg-[#333] disabled:opacity-40 transition-all"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                적용 중
              </span>
            ) : (
              "워터마크 적용"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
