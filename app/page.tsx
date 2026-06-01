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

// ISR 전환(검수 H-2) — list/detail과 동일하게 60초 재검증. force-dynamic은
// 홈만 매 요청 OCI DB를 때려(동일 데이터인데) origin에 불필요한 부담이었다.
// 빌드 시점 DB(로컬 데모 시드)로 prerender되더라도, 첫 배포 후 60초 내 런타임에서
// 실 DB로 재생성되어 production 데이터로 수렴한다(빈 화면으로 굳는 회귀 없음).
// admin 저장 시 revalidatePath("/")로 즉시 갱신(invalidatePublicCache).
export const revalidate = 60;

export default function HomePage() {
  return (
    <HomeClient
      initialCases={getMainCases()}
      initialAnnouncements={getVisibleAnnouncements()}
      initialConfig={getSiteConfig()}
    />
  );
}
