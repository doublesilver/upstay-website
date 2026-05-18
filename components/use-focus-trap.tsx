"use client";

import { useCallback } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

// WCAG 2.1.2 (No Keyboard Trap의 반대 의미 — modal 안에서는 일부러 가두기) 대응.
// 다이얼로그 컨테이너의 onKeyDown에 붙여 Tab 순환을 다이얼로그 내부에 묶는다.
// disabled 요소는 제외, tabindex="-1"도 제외.
const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function useFocusTrap<T extends HTMLElement>() {
  return useCallback((event: ReactKeyboardEvent<T>) => {
    if (event.key !== "Tab") return;
    const container = event.currentTarget;
    const focusable = Array.from(
      container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    ).filter((el) => !el.hasAttribute("disabled"));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey) {
      if (document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }, []);
}
