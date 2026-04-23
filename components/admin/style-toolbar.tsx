"use client";

export { parseStyle, type TextStyle } from "@/lib/text-style";

interface StyleToolbarProps {
  value: import("@/lib/text-style").TextStyle;
  onChange: (style: import("@/lib/text-style").TextStyle) => void;
  inputRef?: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  onTextChange?: (newValue: string) => void;
  hideSize?: boolean;
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
  hideSize,
}: StyleToolbarProps) {
  const isBold = value.fontWeight === "bold";

  const insertBullet = () => {
    const el = inputRef?.current;
    if (!el || !onTextChange) return;
    const s = el.selectionStart ?? el.value.length;
    const e = el.selectionEnd ?? el.value.length;
    const value = el.value;
    const lines = value.split("\n");
    let charCount = 0;
    let startLine = 0;
    let endLine = 0;
    for (let i = 0; i < lines.length; i++) {
      const lineEnd = charCount + lines[i].length;
      if (charCount <= s && s <= lineEnd + 1) startLine = i;
      if (charCount <= e && e <= lineEnd + 1) endLine = i;
      charCount += lines[i].length + 1;
    }
    const newLines = lines.map((line, i) =>
      i >= startLine && i <= endLine ? "• " + line : line,
    );
    const newValue = newLines.join("\n");
    const added = (endLine - startLine + 1) * 2;
    onTextChange(newValue);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + 2, e + added);
    });
  };

  return (
    <div className="flex items-center gap-2 mb-1.5">
      {!hideSize && (
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
      )}
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
        title="글머리기호"
        onClick={insertBullet}
        className="px-2 py-1 rounded-lg text-[12px] border border-[#DDD] bg-white text-[#999] hover:border-[#111] transition-colors"
      >
        •
      </button>
    </div>
  );
}
