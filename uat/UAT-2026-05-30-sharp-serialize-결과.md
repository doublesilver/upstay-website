# UAT — Sharp 직렬화 + AVIF 백그라운드 분리 (메모리 압박 회피)

일시: 2026-05-30
PR: sharp-serialize

## 배경
사용자 "사진 업로드 아직도 안된다" 보고. 워크플로 진단 결과:
- OCI/Caddy/Cloudflare 정상
- Caddy 로그에 업로드 시도 흔적 없음 (15:58 이후 0건)
- RAM 956MB 중 free 85MB + swap 668MB baseline = 메모리 압박 환경

가설: Sharp 4종 병렬(thumb+medium+webp+avif)이 한 요청당 200-400MB 일시 점유
→ 동시 업로드 시 swap 진입 → Cloudflare 100s timeout

## 자동수정
precomputeVariants 변경:
- 4종 Promise.all → 직렬 await (thumb → medium → webp → avif)
- AVIF는 setImmediate 백그라운드 분리 (가장 무거움, fire-and-forget)
- 메모리 피크 단일 sharp 수준으로 감소

## 검증
- [x] tsc PASS
- [x] vitest 73/73 PASS

## 결과 요약

총 시나리오: 2
통과: 2
미통과: 0

## 후속 작업
사용자에게 정확한 시도 정보 요청 (timing, 파일 크기, 메시지, 시크릿창 동일 여부)
