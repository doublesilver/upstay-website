import type { Metadata, Viewport } from "next";
import "./globals.css";
import { HeaderWrapper } from "@/components/header-wrapper";
import { siteConfig } from "@/lib/site";
import { getSiteConfig } from "@/lib/home-data";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.koreanName,
    locale: "ko_KR",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const config = getSiteConfig();
  return (
    <html lang="ko">
      <head>
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
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
              image: "https://upstay.co.kr/og-image.png",
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
