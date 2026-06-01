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
  // worktree 디렉토리(.claude/worktrees/*)에 자체 package-lock.json이 생기면
  // Next.js가 monorepo 루트를 잘못 추론해 standalone에 server.js를 안 만듦.
  // 빌드되는 현재 디렉토리를 root로 강제.
  outputFileTracingRoot: process.cwd(),
  // OCI 운영 환경에 누적된 일회성 스크립트들(이미지 백필·압축 등)이 standalone
  // trace에 포함되면 server.js 생성을 막을 수 있어 명시적으로 제외.
  outputFileTracingExcludes: {
    "*": [
      "**/.claude/**",
      "**/data.empty/**",
      "gen-*.js",
      "compress-*.sh",
      "**/scripts/backfill-*.mjs",
      // SQLite WAL/SHM은 빌드 시작 후 사라질 수 있어 trace 실패 노이즈 유발.
      "**/data/*.db-shm",
      "**/data/*.db-wal",
    ],
  },
  reactStrictMode: true,
  expireTime: 60,
  experimental: {
    // proxyClientMaxBodySize는 Next.js 16.2.6에 아직 없음. deprecated 경고는 무시.
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
            // 워터마크 이미지는 자체 사이트 canvas 합성에만 쓰이므로 전체 공개(*) 대신
            // 자사 origin으로 제한. tainted canvas 우회 가능성 차단(검수 M-7).
            key: "Access-Control-Allow-Origin",
            value: "https://upstay.co.kr",
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
          // HSTS — Cloudflare/Caddy가 HTTPS를 강제하지만 앱 레벨에서도 선언해
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
            // 사용하지 않는 강력 기능(카메라·마이크·위치)을 명시 차단. 서드파티
            // 스크립트가 끼어들어도 권한을 못 얻게 하는 방어선(검수 L-4).
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
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
