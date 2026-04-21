import type { CSSProperties } from "react";

export interface TextStyle {
  fontSize?: string;
  fontWeight?: string;
  bullet?: boolean;
}

export function parseStyle(json?: string): TextStyle {
  if (!json) return {};
  try {
    return JSON.parse(json) as TextStyle;
  } catch {
    return {};
  }
}

export function styleToCss(style: TextStyle): CSSProperties {
  const css: CSSProperties = {};
  if (style.fontSize) css.fontSize = style.fontSize;
  if (style.fontWeight)
    css.fontWeight = style.fontWeight as CSSProperties["fontWeight"];
  return css;
}
