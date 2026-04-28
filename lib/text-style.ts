import type { CSSProperties } from "react";

export interface TextStyle {
  fontSize?: string;
  fontWeight?: string;
}

export function parseStyle(json?: string): TextStyle {
  if (!json) return {};
  try {
    return JSON.parse(json) as TextStyle;
  } catch {
    return {};
  }
}

const SAFE_FONT_SIZE = /^\d{1,3}(px|rem|em|%)$/;
const SAFE_FONT_WEIGHT = /^(\d{3}|normal|bold|bolder|lighter)$/;

export function styleToCss(style: TextStyle): CSSProperties {
  const css: CSSProperties = {};
  if (style.fontSize && SAFE_FONT_SIZE.test(style.fontSize)) {
    css.fontSize = style.fontSize;
  }
  if (style.fontWeight && SAFE_FONT_WEIGHT.test(style.fontWeight)) {
    css.fontWeight = style.fontWeight as CSSProperties["fontWeight"];
  }
  return css;
}
