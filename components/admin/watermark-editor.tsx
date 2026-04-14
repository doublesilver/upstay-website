"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface WatermarkEditorProps {
  src: string;
  onSave: (blob: Blob) => void;
  onCancel: () => void;
}

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

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setDragging(true);
    updatePos(e);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging) return;
    updatePos(e);
  };

  const handleCanvasMouseUp = () => setDragging(false);

  const updatePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setPos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
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
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#E5E7EB]">
          <h3 className="text-[16px] font-bold text-[#111]">워터마크</h3>
          <button
            onClick={onCancel}
            className="text-[#6B7280] hover:text-[#111] text-[20px]"
          >
            ×
          </button>
        </div>

        <div className="flex-1 min-h-0 p-4 flex gap-4">
          <div className="flex-1 min-w-0 flex items-center justify-center bg-[#F9FAFB] rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-[60vh] cursor-move"
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            />
          </div>

          <div className="w-48 shrink-0 space-y-5">
            <div>
              <label className="block text-[12px] font-medium text-[#111] mb-1.5">
                투명도: {Math.round(opacity * 100)}%
              </label>
              <input
                type="range"
                min="0.05"
                max="1"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#111] mb-1.5">
                크기: {Math.round(scale * 100)}%
              </label>
              <input
                type="range"
                min="0.05"
                max="0.8"
                step="0.05"
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="text-[12px] text-[#6B7280]">
              사진 위를 클릭하거나 드래그하여 워터마크 위치를 조정하세요.
            </div>
            <div className="pt-2 space-y-2">
              <button
                onClick={() => setPos({ x: 0.5, y: 0.5 })}
                className="w-full border border-[#E5E7EB] rounded px-3 py-1.5 text-[12px] hover:bg-[#F9FAFB]"
              >
                중앙으로
              </button>
              <button
                onClick={() => setPos({ x: 0.85, y: 0.9 })}
                className="w-full border border-[#E5E7EB] rounded px-3 py-1.5 text-[12px] hover:bg-[#F9FAFB]"
              >
                우하단
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[#E5E7EB]">
          <button
            onClick={onCancel}
            className="border border-[#E5E7EB] rounded px-4 py-1.5 text-[13px] hover:bg-[#F9FAFB]"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#111] text-white rounded px-4 py-1.5 text-[13px] font-medium hover:bg-[#333] disabled:opacity-50"
          >
            {saving ? "적용 중..." : "워터마크 적용"}
          </button>
        </div>
      </div>
    </div>
  );
}
