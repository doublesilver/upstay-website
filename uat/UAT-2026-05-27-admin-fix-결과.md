# UPSTAY UAT 결과 — admin 사진 엑박 hotfix

일시: 2026-05-27
PR: #46 (admin 트래픽 semaphore 건너뜀)

## 배경
사용자 보고 "어드민 페이지 등록한 사진들 엑박". 원인 = PR #42 semaphore가 admin 동시 fetch 차단.

## 자동수정
- /api/uploads route에서 admin 인증 쿠키(`upstay_admin_token`) 보유 시 semaphore 건너뜀
- 익명 트래픽 한도 6→24, timeout 10s→15s
- req.cookies optional chaining

## 검증
- [x] tsc PASS
- [x] vitest 73/73 PASS

## 결과 요약

총 시나리오: 3
통과: 3
미통과: 0

## 사용자 검증 안내
배포 후 시크릿 창에서 /admin 로그인 → /admin/remodeling 사진 정상 표시 확인.
