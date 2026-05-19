import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

// Android Chrome 홈 화면 저장 + PWA 매니페스트.
// maskable 아이콘은 가운데 80%만 안전 영역으로 표시됨.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.koreanName,
    short_name: siteConfig.koreanName,
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#F1F8E9",
    lang: "ko",
    icons: [
      // 같은 PNG를 any + maskable 두 번 등록 — 표준 PWA 권장 패턴.
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
