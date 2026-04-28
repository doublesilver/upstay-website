"use client";

import type { Announcement } from "@/lib/home-data";
import type { RefObject } from "react";
import { parseStyle, styleToCss } from "@/lib/text-style";

export function AnnouncementPopup({
  announcements,
  closeBtnRef,
  onClose,
}: {
  announcements: Announcement[];
  closeBtnRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  const handleClose = () => {
    const durations = announcements.map((a) => a.dismiss_duration || "none");
    let duration = "none";
    if (durations.includes("forever")) duration = "forever";
    else if (durations.includes("week")) duration = "week";
    else if (durations.includes("day")) duration = "day";

    if (duration === "day") {
      localStorage.setItem(
        "popup_dismiss_until",
        new Date(Date.now() + 86400000).toISOString(),
      );
    } else if (duration === "week") {
      localStorage.setItem(
        "popup_dismiss_until",
        new Date(Date.now() + 604800000).toISOString(),
      );
    } else if (duration === "forever") {
      localStorage.setItem("popup_dismiss_until", "forever");
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="popup-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-[#F1F8E9] rounded-xl shadow-lg w-[90%] max-w-[320px] mx-4 p-5"
      >
        <h2 id="popup-dialog-title" className="sr-only">
          공지 팝업
        </h2>
        {announcements.map((a) => {
          const titleStyle = styleToCss(parseStyle(a.title_style));
          const contentStyle = styleToCss(parseStyle(a.content_style));
          return (
            <div
              key={a.id}
              className="bg-white border border-[#111] rounded-xl overflow-hidden mb-4"
            >
              {a.title && (
                <>
                  <div
                    className="px-4 pt-3.5 pb-3 text-[14px] font-medium text-[#111] whitespace-pre-wrap"
                    style={titleStyle}
                  >
                    {a.title}
                  </div>
                  <div className="mx-4 h-px bg-[#E5E5E5]" />
                </>
              )}
              <div
                className="px-4 pt-3.5 pb-4 text-[13px] text-[#333] leading-[1.7] min-h-[100px] whitespace-pre-wrap"
                style={contentStyle}
              >
                {a.content}
              </div>
            </div>
          );
        })}
        <div className="h-px bg-[#E5E5E5] my-3" />
        <div>
          <button
            ref={closeBtnRef}
            onClick={handleClose}
            className="w-full py-3 bg-[#111] text-white rounded-lg text-[14px] font-medium"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
