import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";
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
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
