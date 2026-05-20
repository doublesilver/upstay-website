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
      // any: 사각 마스크 OS에서 거의 풀사이즈로 로고 표시 (패딩 5%).
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // maskable: 원/물방울/둥근사각 등 어떤 마스크에서도 잘림 없도록 안전 영역(80%) 준수.
      { src: "/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
