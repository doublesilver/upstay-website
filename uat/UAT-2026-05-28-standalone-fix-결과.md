# UAT — standalone 빌드 회복 (Next.js 16 + worktree 이슈)

일시: 2026-05-28
PR: standalone-build-fix

## 배경
PR #47 (admin R2 + thumb.webp) 머지 후 OCI 빌드가 standalone/server.js 미생성.
원인: Next.js 16이 worktree·monorepo 환경에서 lockfile 두 개 감지 후 trace root를 잘못 추론.

## 자동수정
- `next.config.ts`에 `outputFileTracingRoot: process.cwd()` 추가
- Dockerfile에 node_modules 명시 copy (standalone trace 회귀 대응)

## 검증
- [x] 로컬 빌드 standalone/server.js 생성 확인
- [x] 73 tests PASS
- [x] typecheck PASS

## 결과 요약

총 시나리오: 3
통과: 3
미통과: 0

## OCI 배포 후 검증
- standalone/server.js 존재
- systemd restart
- /admin/remodeling 사진 정상 (PR #47 R2 + thumb.webp 적용 확인)
