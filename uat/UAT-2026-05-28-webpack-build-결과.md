# UAT — webpack 빌드 전환 (turbopack native module 해시 OS mismatch 해소)

일시: 2026-05-28
PR: build-with-webpack

## 배경
PR #47 admin R2 + thumb.webp 머지 후 OCI 배포 시 admin에서 "불러오기에 실패" + 500.
원인: turbopack이 native module(better-sqlite3)을 OS별 해시 식별자(`better-sqlite3-90e2652d1716b047`)로 바인딩 → macOS arm64 빌드의 해시가 OCI Linux x86_64에서 mismatch → `Cannot find module`.

## 자동수정
- `package.json` build script를 `next build --webpack`으로 변경
- webpack은 표준 require 사용 → OS 무관하게 동작

## 검증
- [x] 로컬 webpack 빌드 standalone/server.js 정상 생성 (57MB)
- [x] OCI rsync + native node_modules symlink 후 systemd active
- [x] homepage 200, /api/config 200, /api/admin/config 401 (인증 없음 정상)
- [x] 사용자 시크릿창 admin 정상 로딩 확인 (사용자 본인 검증)

## 결과 요약

총 시나리오: 4
통과: 4
미통과: 0

## 후속 패턴 (README 추가 권장)
로컬 macOS arm64 빌드 → OCI Linux x86_64 rsync 시:
1. `npm run build` (webpack)
2. rsync `.next/standalone/` + `.next/static/` (node_modules 제외)
3. OCI에서 `ln -sfn ~/upstay/node_modules ~/upstay/.next/standalone/node_modules`
4. `cp .next/static .next/standalone/.next/` + `cp public .next/standalone/`
5. systemctl restart upstay
