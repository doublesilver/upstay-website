"use client";

export { parseStyle, type TextStyle } from "@/lib/text-style";

interface StyleToolbarProps {
  value: import("@/lib/text-style").TextStyle;
  onChange: (style: import("@/lib/text-style").TextStyle) => void;
  inputRef?: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  onTextChange?: (newValue: string) => void;
}

const FONT_SIZES = [
  "10px",
  "11px",
  "12px",
  "13px",
  "14px",
  "15px",
  "16px",
  "17px",
  "18px",
  "20px",
  "22px",
  "24px",
];

export function StyleToolbar({
  value,
  onChange,
  inputRef,
  onTextChange,
}: StyleToolbarProps) {
  const isBold = value.fontWeight === "bold";

  const insertMiddleDot = () => {
    const el = inputRef?.current;
    if (!el || !onTextChange) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const newValue = el.value.slice(0, start) + "·" + el.value.slice(end);
    const newPos = start + 1;
    onTextChange(newValue);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(newPos, newPos);
    });
  };

  return (
    <div className="flex items-center gap-2 mb-1.5">
      <select
        value={value.fontSize || ""}
        onChange={(e) =>
          onChange({ ...value, fontSize: e.target.value || undefined })
        }
        className="border border-[#DDD] rounded-lg px-2 py-1 text-[12px] outline-none focus:border-[#111] bg-white"
      >
        <option value="">크기 기본</option>
        {FONT_SIZES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() =>
          onChange({ ...value, fontWeight: isBold ? undefined : "bold" })
        }
        className={`px-2 py-1 rounded-lg text-[12px] font-bold border transition-colors ${
          isBold
            ? "bg-[#111] text-white border-[#111]"
            : "bg-white text-[#999] border-[#DDD] hover:border-[#111]"
        }`}
      >
        B
      </button>
      <button
        type="button"
        title="가운데점"
        onClick={insertMiddleDot}
        className="px-2 py-1 rounded-lg text-[12px] border border-[#DDD] bg-white text-[#999] hover:border-[#111] transition-colors"
      >
        ·
      </button>
    </div>
  );
}
