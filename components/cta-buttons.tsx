import Link from "next/link";
import { KakaoButton } from "@/components/kakao-button";
import { cn } from "@/lib/utils";

type CTAButtonsProps = {
  compact?: boolean;
};

export function CTAButtons({ compact = false }: CTAButtonsProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", compact && "gap-2.5")}>
      <Link
        href="/remodeling"
        className={cn(
          "inline-flex items-center justify-center border border-stone-800 bg-stone-900 text-sm font-medium text-white hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2",
          compact ? "h-10 rounded-[11px] px-4" : "h-11 rounded-[12px] px-5",
        )}
      >
        리모델링 보기
      </Link>
      <KakaoButton compact={compact} />
    </div>
  );
}
