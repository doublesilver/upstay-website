import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { HeaderWrapper } from "@/components/header-wrapper";
import { siteConfig } from "@/lib/site";
import { getSiteConfig } from "@/lib/home-data";

// Pretendard Variable: 가변(variable) 폰트라 한 파일로 weight 45~920을 모두 커버.
// next/font/local은 자동으로 preload + font-display:swap 처리해 외부 CDN 차단/지연을 피함.
const pretendard = localFont({
  src: "../public/fonts/PretendardVariable.woff2",
  display: "swap",
  variable: "--font-pretendard",
  weight: "45 920",
  style: "normal",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Android Chrome 주소창 / PWA standalone 상단 색상. 헤더 배경과 동일.
  themeColor: "#F1F8E9",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://upstay.co.kr"),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.koreanName}`,
  },
  description: siteConfig.description,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  // app/icon.{svg,png}, app/apple-icon.png은 Next.js file convention이 자동으로 처리하지만
  // app/manifest.ts와 PWA 아이콘은 명시 등록이 필요해 icons 메타에 추가.
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    other: [
      { rel: "icon", url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { rel: "icon", url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.koreanName,
    locale: "ko_KR",
    type: "website",
    url: "/",
    images: [
      {
        url: "/og-image-v2.png",
        width: 1200,
        height: 630,
        alt: siteConfig.koreanName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: ["/og-image-v2.png"],
  },
  // 검색엔진 사이트 소유 확인 메타 태그. Next.js metadata API가 자동으로
  // <head>에 <meta name="naver-site-verification" content="..." /> 삽입.
  verification: {
    other: {
      "naver-site-verification":
        "2fc452e86032255ba853356a93561923fdb8d261",
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const config = getSiteConfig();
  return (
    <html lang="ko" className={pretendard.variable}>
      <body className="bg-white text-[#111111]">
        <HeaderWrapper initialConfig={config} />
        <main>{children}</main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: "업스테이",
              image: "https://upstay.co.kr/og-image-v2.png",
              address: {
                "@type": "PostalAddress",
                streetAddress: "학동로 26길 82 (논현동 157-26번지 1층)",
                addressLocality: "강남구",
                addressRegion: "서울",
                addressCountry: "KR",
              },
              telephone: "010-3168-0624",
              url: "https://upstay.co.kr",
            }),
          }}
        />
      </body>
    </html>
  );
}
