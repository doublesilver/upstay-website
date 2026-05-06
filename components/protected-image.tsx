"use client";

// 우클릭/드래그 억제용 — DevTools/스크린샷 우회 가능, 보안 아님
import Image, { type ImageProps } from "next/image";

export function ProtectedImage(props: ImageProps) {
  return (
    // eslint-disable-next-line jsx-a11y/alt-text
    <Image
      {...props}
      draggable={false}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      style={{
        ...props.style,
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
      }}
    />
  );
}
