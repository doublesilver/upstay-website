// 이미지 host 분리 — DB의 image_url은 `/api/uploads/X.jpg` 그대로 유지하되,
// 표시 시점에 NEXT_PUBLIC_IMAGE_HOST가 설정되어 있으면 그쪽으로 prefix 교체.
// R2(Cloudflare) 또는 다른 CDN 등 외부 호스트로 이미지 부담 옮길 때 사용.
//
// 예:
//   NEXT_PUBLIC_IMAGE_HOST=https://img.upstay.co.kr
//   "/api/uploads/abc.jpg"  →  "https://img.upstay.co.kr/abc.jpg"
//
// 빈 값이면 변경 없음 (origin 로컬 서빙 유지).
const IMAGE_HOST = process.env.NEXT_PUBLIC_IMAGE_HOST || "";

export function resolveImg(url: string): string {
  if (!IMAGE_HOST) return url;
  if (!url.startsWith("/api/uploads/")) return url;
  return url.replace("/api/uploads", IMAGE_HOST);
}
