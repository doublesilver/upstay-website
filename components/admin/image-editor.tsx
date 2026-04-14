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

  const rotate = (deg: number) => cropperRef.current?.cropper.rotate(deg);

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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EBEBEB]">
          <h3 className="text-[18px] font-bold text-[#111]">사진 편집</h3>
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

        <div className="flex-1 min-h-0 p-4 bg-[#FAFAFA]">
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

        <div className="flex items-center justify-between px-6 py-4 border-t border-[#EBEBEB]">
          <div className="flex gap-2">
            <button
              onClick={() => rotate(-90)}
              className="flex items-center gap-1.5 border border-[#DDD] rounded-xl px-4 py-2 text-[13px] text-[#666] hover:bg-[#F7F7F7] transition-all"
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
                <polyline points="1,4 1,10 7,10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              좌회전
            </button>
            <button
              onClick={() => rotate(90)}
              className="flex items-center gap-1.5 border border-[#DDD] rounded-xl px-4 py-2 text-[13px] text-[#666] hover:bg-[#F7F7F7] transition-all"
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
                <polyline points="23,4 23,10 17,10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              우회전
            </button>
            <button
              onClick={() => cropperRef.current?.cropper.reset()}
              className="border border-[#DDD] rounded-xl px-4 py-2 text-[13px] text-[#666] hover:bg-[#F7F7F7] transition-all"
            >
              초기화
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-5 py-2 rounded-xl text-[14px] text-[#666] hover:bg-[#F7F7F7] transition-all"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#111] text-white rounded-xl px-5 py-2 text-[14px] font-semibold hover:bg-[#333] disabled:opacity-40 transition-all"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  적용 중
                </span>
              ) : (
                "적용"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
