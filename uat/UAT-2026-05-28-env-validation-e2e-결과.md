# UAT — env 검증 + E2E 자동화 (운영 회귀 방지)

일시: 2026-05-28
PR: env-validation-e2e

## 배경
PUBLIC_ORIGIN 누락이 silent 회귀로 admin 저장 실패 발생. 동일 류 회귀 방지 위해 자동화 도입.

## 자동수정
- `lib/env-validation.ts` — production boot 시 필수 env 검증 + 명시 에러 출력
- `instrumentation.ts` — Next.js 훅으로 env 검증 호출
- `scripts/e2e-check.sh` — production 9개 카테고리 자동 검증 스크립트
- `CHANGES.md` v3.25

## 검증
- [x] tsc PASS
- [x] vitest 73/73 PASS
- [x] env-validation 코드 정상 (dev 환경에선 skip, production에서만 실행)
- [x] e2e-check.sh shellcheck/실행 권한 OK

## 결과 요약

총 시나리오: 4
통과: 4
미통과: 0

## 후속 작업 (사용자)
- OCI에 cron 등록 권장: `*/30 * * * * bash ~/upstay/scripts/e2e-check.sh > /tmp/e2e.log 2>&1`
- 또는 deploy 직후 1회 실행: `bash scripts/e2e-check.sh`
