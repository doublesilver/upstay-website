import type { Metadata } from "next";
import "./globals.css";
import { HeaderWrapper } from "@/components/header-wrapper";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL("https://upstay.vercel.app"),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.koreanName}`,
  },
  description: siteConfig.description,
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.koreanName,
    locale: "ko_KR",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body className="bg-white text-[#111111]">
        <HeaderWrapper />
        <main>{children}</main>
      </body>
    </html>
  );
}
