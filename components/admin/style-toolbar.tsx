"use client";

export interface TextStyle {
  fontSize?: string;
  fontWeight?: string;
  bullet?: boolean;
}

interface StyleToolbarProps {
  value: TextStyle;
  onChange: (style: TextStyle) => void;
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

export function parseStyle(json: string): TextStyle {
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

export function StyleToolbar({ value, onChange }: StyleToolbarProps) {
  const isBold = value.fontWeight === "bold";
  const hasBullet = value.bullet === true;

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
        onClick={() =>
          onChange({ ...value, bullet: hasBullet ? undefined : true })
        }
        className={`px-2 py-1 rounded-lg text-[12px] border transition-colors ${
          hasBullet
            ? "bg-[#111] text-white border-[#111]"
            : "bg-white text-[#999] border-[#DDD] hover:border-[#111]"
        }`}
      >
        • 불렛
      </button>
    </div>
  );
}
