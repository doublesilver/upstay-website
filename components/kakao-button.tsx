import { KAKAO_URL } from "@/lib/site";

export function KakaoButton() {
  return (
    <a
      href={KAKAO_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="카카오톡 문의"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#FEE500] border border-[#E5E7EB] hover:brightness-95 transition"
    >
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M12 3.5C6.75 3.5 2.5 6.86 2.5 11c0 2.66 1.77 4.99 4.43 6.32l-.93 3.4c-.08.3.26.54.52.37l4.05-2.68c.47.05.95.09 1.43.09 5.25 0 9.5-3.36 9.5-7.5S17.25 3.5 12 3.5Z"
          fill="#111111"
        />
      </svg>
    </a>
  );
}
