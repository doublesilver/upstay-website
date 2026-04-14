"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
}

export function Toast({ message, type = "success", onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-6 right-6 z-[60] transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
      }`}
    >
      <div
        className={`flex items-center gap-2.5 px-5 py-3 rounded-xl shadow-lg text-[14px] font-medium ${
          type === "success" ? "bg-[#111] text-white" : "bg-red-500 text-white"
        }`}
      >
        <span>{type === "success" ? "✓" : "!"}</span>
        <span>{message}</span>
      </div>
    </div>
  );
}
