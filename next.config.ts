import type { NextConfig } from "next";

// CSP img-src에 외부 이미지 host(R2 등) 자동 포함.
// NEXT_PUBLIC_IMAGE_HOST=https://img.upstay.co.kr 설정 시 그 origin이 img-src에 추가됨.
const IMAGE_HOST = process.env.NEXT_PUBLIC_IMAGE_HOST?.trim() || "";
const IMAGE_HOST_ORIGIN = (() => {
  if (!IMAGE_HOST) return "";
  try {
    return new URL(IMAGE_HOST).origin;
  } catch {
    return "";
  }
})();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  output: "standalone",
  reactStrictMode: true,
  expireTime: 60,
  experimental: {
    middlewareClientMaxBodySize: "100mb",
  },
  allowedDevOrigins: [
    "100.120.53.20",
    "leeeunseokui-macbookair",
    "leeeunseokui-macbookair.local",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "http", hostname: "localhost" },
    ],
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async headers() {
    return [
      // 참고: 실제 업로드 이미지 서빙 경로는 `/api/uploads/[...path]` 라우트 핸들러가
      // Cache-Control 헤더를 직접 설정하므로, 여기서 `/uploads/:path*` 패턴을 따로 두는
      // 것은 dead rule이라 제거. 헤더 정책은 route.ts에서 일원화.
      {
        source: "/watermark.png",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // PWA 아이콘(any/maskable) + 로고 + apple-icon + favicon + OG 이미지까지 포함.
        // 기존 패턴은 `icon.svg` 등 dot 변형만 매치하고 `icon-192.png` 같은 dash는 미매치였음.
        // icon-.* 가 icon-maskable-.* 를 이미 포함하므로 후자는 중복(제거).
        source:
          "/:file(icon.*|icon-.*|logo.*|apple-icon.*|favicon.*|og-image.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          // HSTS — Railway/Cloudflare가 HTTPS를 강제하지만 앱 레벨에서도 선언해
          // 브라우저가 캐싱하도록 한다. SSL stripping 다운그레이드 공격 방어.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              process.env.NODE_ENV === "production"
                ? "script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com"
                : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self'",
              `img-src 'self' data: https://images.unsplash.com blob:${IMAGE_HOST_ORIGIN ? ` ${IMAGE_HOST_ORIGIN}` : ""}`,
              process.env.NODE_ENV === "production"
                ? "connect-src 'self'"
                : "connect-src 'self' ws: wss:",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
