import { cn } from "@/lib/utils";

type KakaoButtonProps = {
  className?: string;
  compact?: boolean;
};

const kakaoUrl = process.env.NEXT_PUBLIC_KAKAO_URL;

export function KakaoButton({ className, compact = false }: KakaoButtonProps) {
  const sharedClassName = cn(
    "inline-flex items-center justify-center whitespace-nowrap border text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2",
    compact ? "h-10 rounded-[11px] px-4" : "h-11 rounded-[12px] px-5",
    kakaoUrl
      ? "border-stone-300 bg-white text-stone-900 hover:border-stone-400 hover:bg-stone-50"
      : "cursor-default border-stone-200 bg-stone-100 text-stone-400",
    className,
  );

  if (!kakaoUrl) {
    return (
      <span className={sharedClassName} aria-disabled="true" title="NEXT_PUBLIC_KAKAO_URL 값을 설정해 주세요.">
        카카오톡 문의
      </span>
    );
  }

  return (
    <a
      href={kakaoUrl}
      target="_blank"
      rel="noreferrer"
      className={sharedClassName}
    >
      카카오톡 문의
    </a>
  );
}
