import { HomeClient } from "@/components/home-client";
import {
  getMainCases,
  getVisibleAnnouncements,
  getSiteConfig,
} from "@/lib/home-data";

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
