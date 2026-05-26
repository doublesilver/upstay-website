# 전수검사 보고서 — upstay-website (사이클 1)

검사 일시: 2026-05-26 22:40 KST
검사 범위: 전체 138 파일
에이전트: 9개 병렬 (plan, security, accessibility, performance, ux, function, scenario, regression, code-quality)
프로젝트 CLAUDE.md: **부재** — WORK_ZONES.md/CHANGES.md/QUESTIONS.md/메모리 대용

## 📊 한 줄 요약

**조건부 인수 가능** — Critical 12 / High 30 발견. CSP·환경변수 누락 등 R2 컷오버 후속 정리와 인수 문서화가 미흡. 코드 본체 품질은 매우 양호 (73/73 PASS, any 0, audit Critical 0).

---

## 🚨 Critical (12건)

### 자동 수정 가능
- **C1** `next.config.ts:82` — CSP `img-src`에 R2 host(`https://img.upstay.co.kr`) 미포함. 운영에서 차단되면 사진 전체 깨짐
- **C3** `.env.example` — `NEXT_PUBLIC_IMAGE_HOST` 누락
- **C7** `app/admin/config/page.tsx` — unsaved 변경 보호(beforeunload) 부재. config는 가장 자주 수정되는 곳인데 가장 취약
- **C8** `app/remodeling/[id]/detail-gallery.tsx:505` — 모바일 라이트박스 트리거가 div onClick, 키보드 접근 불가 (WCAG 2.1.1)
- **C9** 동일 파일 — 라이트박스 닫힌 후 트리거로 포커스 복귀 없음 (WCAG 2.4.3)
- **C10** `app/globals.css` — 전역 `:focus-visible` 부재 + `outline-none` 광범위 (WCAG 2.4.7)
- **C11** WORK_ZONES.md / CHANGES.md — Railway→OCI 컷오버 미문서화
- **C12** WORK_ZONES.md / CHANGES.md — R2 이미지 host 분리 미문서화

### 사용자 결정·외부 작업 필요
- **C2** ADMIN_PW 평문이 GitHub public 히스토리 + 현재도 동일 값 (`0426`) 사용 — **즉시 교체 + git 히스토리 정리**
- **C5** `lib/site.ts:25` — `KAKAO_URL = "https://pf.kakao.com/"` placeholder. 실제 카카오 채널 URL 필요
- **C6** 견적/문의 폼 자체 부재 — 외주 범위 결정 필요
- **C4** thumb/medium variant 미생성 (`precomputeVariants` + backfill) — 단, R2 백필 완료 상태라 운영 영향 적음. 신규 업로드만 영향

## 🟠 High (30건)

### 자동 수정 가능 (사이클 1 처리)
- **H1** 이미지/케이스 삭제 시 `.thumb.webp`/`.medium.webp` 사본 미unlink → 디스크 leak
- **H6** `/api/admin/remodeling/reorder` + `images/reorder` — items 배열 Zod 검증 + max length 없음
- **H7** `acquireSlot` 무한 대기 + abort 미처리 → DoS 위험
- **H8** `app/api/admin/upload/route.ts` — 동시 파일 수 상한 없음 (OOM 위험)
- **H17** `app/remodeling/[id]/page.tsx` — `generateStaticParams` + revalidate=60. 신규 케이스 fallback 정책 명시 필요
- **H21** `app/admin/page.tsx` — 빈 컴포넌트. `/admin/remodeling`으로 redirect
- **H22** admin POST/PUT/DELETE 핸들러 — `revalidatePath` 호출 누락. ISR 60초 지연
- **H23** `home-client.tsx:30-37` — `prefetchDetailImages` per-card dedup 없음
- **H29** `detail-gallery.tsx:538` — `animate-spin` 스피너에 motion-reduce 미대응 (WCAG 2.3.3)
- **H9** 메인/리모델링 페이지 `<h1>` 없음 (WCAG 1.3.1, 2.4.6)
- **H10** 화살표 → 기호 aria-hidden 누락 (M-1 a11y)
- **H11** label 미연결 (admin/remodeling 설명, admin/config 입력)
- **H12** 색 대비 미달 — `#999`, `#CCC`, `#BBB` on white
- **H13** 카카오 dialog ARIA — `role="dialog"`가 backdrop에 위치
- **H14** 폰트 2MB preload — Pretendard 서브셋 필요
- **H15** `.gitignore`에 `.env`/`.env.*` 미포함
- **H30** CHANGES.md ledger PR #20-#41 (22개 커밋) 미기록

### 사용자 결정·외부 작업 필요
- **H2** 워터마크 두께 슬라이더 회수 — QUESTIONS Q3 결정 필요
- **H3** WORK_ZONES.md Zone 1 API 의존 명세 불일치
- **H4** ADMIN_PW bcrypt 미해시 — 마이그레이션 큼
- **H5** OCI env `PUBLIC_ORIGIN`에 `https://` 잔존 — env 수정
- **H18** 사례 상세 CTA 부재 — 디자인 결정
- **H19** rental/building-management 페이지 CTA 부재 — 디자인 결정
- **H20** KAKAO_URL coded constant — admin/config 이동 결정
- **H24** variant fallback이 R2 컷오버 후 무동작
- **H25** R2/외부 host fallback 부재 (장애 대비)
- **H26** admin 페이지 resolveImg 미적용
- **H27** 모바일 라이트박스 Before/After 동시 비교 불가
- **H28** 데스크탑 라이트박스 무반응

## 🟡 Medium (17건)
- M-1 dead export `KAKAO_URL`/`PHONE_NUMBER` (lib/site.ts)
- M-2 매직넘버 통합 필요 (MAX_PIXELS, IMMUTABLE_CACHE_HEADER 등)
- M-3 `brace-expansion`, `postcss` moderate audit
- M-4 resolveImg / text-style.ts / admin-schemas 일부 단위 테스트 미커버
- M-5 home-data.ts `slot_position > 0` vs `is_starred` 동기화 의존
- (외 12건)

## 🟢 Low (11건)
- L-1 라이트박스 backdrop 라임색 (사진 색감 비교)
- L-2 `unoptimized: true` 환경에서 quality/sizes/blur 무시
- (외 9건)

---

## 📋 인수 체크리스트

```
[ ] C1 CSP img-src R2 추가 (자동수정)
[ ] C2 ADMIN_PW 즉시 교체 + git 히스토리 정리 (사용자)
[ ] C3 .env.example NEXT_PUBLIC_IMAGE_HOST 추가 (자동수정)
[ ] C5 KAKAO_URL 실제 채널 (클라이언트 확정)
[ ] C7 admin/config beforeunload (자동수정)
[ ] C8/C9/C10 접근성 핵심 (자동수정)
[ ] C11/C12 인프라 변경 문서화 + Side CR (사용자 + 자동)
[ ] H1-H30 자동수정 가능분 (사이클 1)
[ ] CHANGES.md v3.19~v3.21 보강 (H30)
```

## 📋 자동수정 범위

이번 사이클에서 자동 처리할 항목 = **Critical 6건 + High 16건 = 22건**.
사용자 결정·외부 작업 필요한 14건은 보고서에만 기록 후 사용자에게 안내.
