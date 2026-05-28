# UAT — E2E 검사에서 발견된 rate limit 미동작 fix

일시: 2026-05-28
PR: fix-rate-limit-cf-ip

## 배경
E2E 검사 시 5회 잘못된 로그인 후 6번째도 401 (429 안 옴) → brute-force 방어 무력화.

## 원인
Cloudflare proxy 환경에서 `clientIp`가 `x-forwarded-for` 마지막 = Cloudflare edge IP. 매 요청 다른 edge IP로 인식 → rate limit 우회.

## 자동수정
- `app/api/auth/route.ts` `clientIp` 함수에 `cf-connecting-ip` 우선 사용 추가
- fallback으로 기존 x-forwarded-for 로직 유지

## 검증
- [x] tsc PASS
- [x] vitest 73/73 PASS

## 결과 요약

총 시나리오: 2
통과: 2
미통과: 0

## 별도 추적 — R2 cf-cache DYNAMIC
사용자 작업 필요. Cloudflare 대시보드 → Cache Rules → `img.upstay.co.kr` 도메인에 image 캐시 룰 추가.
