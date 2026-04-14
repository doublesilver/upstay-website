"use client";

import { useRef, useState } from "react";
import Cropper, { ReactCropperElement } from "react-cropper";
import "react-cropper/node_modules/cropperjs/dist/cropper.css";

interface ImageEditorProps {
  src: string;
  onSave: (blob: Blob) => void;
  onCancel: () => void;
}

export function ImageEditor({ src, onSave, onCancel }: ImageEditorProps) {
  const cropperRef = useRef<ReactCropperElement>(null);
  const [saving, setSaving] = useState(false);

  const rotate = (deg: number) => {
    cropperRef.current?.cropper.rotate(deg);
  };

  const handleSave = () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;
    setSaving(true);
    cropper.getCroppedCanvas({ maxWidth: 2400, maxHeight: 2400 }).toBlob(
      (blob) => {
        if (blob) onSave(blob);
        setSaving(false);
      },
      "image/jpeg",
      0.9,
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#E5E7EB]">
          <h3 className="text-[16px] font-bold text-[#111]">사진 편집</h3>
          <button
            onClick={onCancel}
            className="text-[#6B7280] hover:text-[#111] text-[20px]"
          >
            ×
          </button>
        </div>

        <div className="flex-1 min-h-0 p-4">
          <Cropper
            ref={cropperRef}
            src={src}
            style={{ height: "100%", width: "100%" }}
            viewMode={1}
            guides
            background={false}
            responsive
            autoCropArea={1}
          />
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-[#E5E7EB]">
          <div className="flex gap-2">
            <button
              onClick={() => rotate(-90)}
              className="border border-[#E5E7EB] rounded px-3 py-1.5 text-[13px] hover:bg-[#F9FAFB]"
            >
              ↺ 좌회전
            </button>
            <button
              onClick={() => rotate(90)}
              className="border border-[#E5E7EB] rounded px-3 py-1.5 text-[13px] hover:bg-[#F9FAFB]"
            >
              ↻ 우회전
            </button>
            <button
              onClick={() => cropperRef.current?.cropper.reset()}
              className="border border-[#E5E7EB] rounded px-3 py-1.5 text-[13px] hover:bg-[#F9FAFB]"
            >
              초기화
            </button>
          </div>
          <div className="flex gap-2">
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
              {saving ? "저장 중..." : "적용"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
