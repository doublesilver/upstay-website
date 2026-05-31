import type { Metadata } from "next";
import { HomeClient } from "@/components/home-client";
import {
  getMainCases,
  getVisibleAnnouncements,
  getSiteConfig,
} from "@/lib/home-data";

// 루트 layout에서 canonical을 제거했으므로 홈은 여기서 명시.
export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

// force-dynamic — 빌드 시점 DB(데모 시드)로 prerender되는 회귀 방지.
// 로컬 빌드 → OCI rsync 패턴이라 빌드 시점 DB가 production 실 DB와 다름.
// 매 요청 OCI DB 조회 + Cloudflare HTML 5분 cache로 origin 부담 보호.
export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <HomeClient
      initialCases={getMainCases()}
      initialAnnouncements={getVisibleAnnouncements()}
      initialConfig={getSiteConfig()}
    />
  );
}
