# UPSTAY 전수 리뷰 v3 — 현재 상태(main 36f8d2d) 심층 진단

**검증 일시**: 2026-04-21
**검증 방식**: OMC 병렬 3 에이전트 (architect·security-reviewer·code-reviewer, 각 opus/sonnet)
**대상**: `main` 브랜치 HEAD 전체 코드베이스

---

## 종합 판정

| 등급            | 총 건수 | 배포 차단?                   |
| --------------- | ------- | ---------------------------- |
| 🔴 **Critical** | **13**  | **예 — 일부 배포 차단 수준** |
| 🟡 Major        | 30+     | 1~2주 내 처리                |
| 🟢 Minor        | 30+     | 장기 백로그                  |

**Critical 핵심 요지**: 외주 운영 규모에서 즉시 폭발하는 버그는 없으나 **운영 중 데이터 손실·권한 우회·성능 급락** 가능성을 가진 결함이 13건. 그중 **4건은 당장 수정 가능한 작은 변경**이고 나머지는 중규모 리팩토링 필요.

---

## 🔴 Critical — 즉시 수정 권장

### [Arch-C1] `/api/uploads/[...path]` 비스트리밍 전체 버퍼 서빙

- **위치**: `app/api/uploads/[...path]/route.ts:17-44`
- **영향**: `readFile` 전체를 메모리에 올린 뒤 `new Response(buffer)` → 동시 이미지 요청 시 이벤트 루프 스톨 + 메모리 압박. `If-Modified-Since`/`ETag`/`Range` 미지원.
- **Fix**: `ReadableStream.from(fs.createReadStream(...))` 또는 Railway에 Nginx sidecar 붙여 정적 서빙

### [Arch-C2] 쿼리 로직 3곳 중복 (데이터 레이어 분열)

- **위치**: `lib/home-data.ts:84-104` vs `app/api/remodeling/route.ts:5-64` vs `app/api/remodeling/[id]/route.ts:24-47`
- **영향**: 미묘하게 다른 필터/slice 로직 → 한 곳만 수정하면 즉시 괴리. `home-data`의 `starredOnly=false` 분기는 dead code.
- **Fix**: `lib/home-data.ts`에 `getCasesWithImages({ scope, imageLimit })` 단일 함수로 통합, 모든 라우트가 재사용

### [Arch-C3] `lib/db/index.ts` `DROP TABLE IF EXISTS remodeling_cases` 데이터 손실 폭탄

- **위치**: `lib/db/index.ts:24-30`
- **영향**: 레거시 DB 백업 복원 시 `before_image` 컬럼 감지 → 테이블 전체 DROP + FK CASCADE로 `case_images`까지 소실
- **Fix**: 이 블록 통째로 제거 (마이그레이션 시스템이 이미 003까지 있으므로 역할 종료)

### [Arch-C4] 스키마 변경 경로 2중화 (ALTER 즉석 + 마이그레이션 파일)

- **위치**: `lib/db/index.ts:73-80` (ALTER 즉석) vs `lib/db/migrations/00*.sql`
- **영향**: 변경 추적 불가. `insertDefaultConfig`와 002 마이그레이션이 동일 키를 중복 삽입.
- **Fix**: `initSchema`는 `CREATE TABLE IF NOT EXISTS`만, default config + 모든 ALTER는 migrations로 이관

### [Rel-C1/C2] dead API 라우트 2개 + `home-data.ts`와 중복

- **위치**: `app/api/remodeling/route.ts` 전체, `app/api/announcements/route.ts` 전체
- **영향**: grep 결과 어떤 페이지/컴포넌트도 호출 안 함. 쿼리 로직 중복 → 드리프트 위험
- **Fix**: 두 파일 삭제 (외부 캐시 프록시로 남길 이유 없음)

### [Rel-C3] `/api/admin/remodeling/images` POST 서버 `match_order` 미검증

- **위치**: `app/api/admin/remodeling/images/route.ts:34-38`
- **영향**: 클라이언트 계산 `match_order`를 그대로 저장 → 동시 업로드 또는 다른 탭에서 재정렬 후 업로드 시 UNIQUE 위반 500 에러
- **Fix**:
  ```ts
  const next = db
    .prepare(
      "SELECT COALESCE(MAX(match_order),0)+1 AS n FROM case_images WHERE case_id=? AND type=?",
    )
    .get(case_id, type) as { n: number };
  // match_order 인자 무시하고 next.n 사용
  ```

### [Rel-C4] reorder 트랜잭션 예외 미전파

- **위치**: `app/api/admin/remodeling/reorder/route.ts:16-19`, `images/reorder/route.ts:12-19`
- **영향**: `tx(items)` 예외 시 Next.js가 HTML 500 반환 → 클라이언트 JSON 파싱 실패 → 토스트 "Unexpected token <"
- **Fix**: `try { tx(items); } catch (e) { return Response.json({error: (e as Error).message}, {status: 500}); }`

### [Sec-C-candidate] `/api/admin/remodeling` DELETE 파일 unlink 경로 검증 없음

- **위치**: `app/api/admin/remodeling/route.ts:77-83`
- **영향**: DB에 `image_url="/api/uploads/../upstay.db"` 조작 시 **SQLite DB 파일 삭제 가능** (인증된 관리자에 한정)
- **Fix**: `path.resolve(UPLOAD_DIR, filename)` + `startsWith(UPLOAD_DIR)` 가드

### [Perf-C1] `public/icon-phone.png` **3.57MB** (LCP 킬러)

- **위치**: `public/icon-phone.png` 3,573,299 bytes, `components/header.tsx:84-91`
- **영향**: 44×44 렌더인데 3.5MB 원본을 매번 Next optimizer에서 읽음. 카톡 아이콘은 41KB로 적정 — phone만 **85배 크기**, 실수로 보임
- **Fix**: 200×200 이하로 재인코딩 후 덮어쓰기

### [Quality-C1] 카테고리(4) title/desc style 동일 키 공유 버그

- **위치**: `app/admin/config/page.tsx:321-335`
- **영향**: 안내 카테고리 (4)만 `titleStyle`과 `descStyle`에 동일한 `service_category4_style` 전달 → 제목 굵게 변경 시 본문도 동시 변경. (1)~(3)은 `_title_style`/`_desc_style` 분리.
- **Fix**: 004 마이그레이션 추가하여 `service_category4_title_style`/`_desc_style` 분리

### [Quality-C2] `show_on_main` UNIQUE 제약 없음 → 메인 2개 이상 같은 슬롯 가능

- **위치**: `lib/db/index.ts:38-44`
- **영향**: `handleToggleMain`은 클라이언트 스왑만 수행. 서버 저장 시 UNIQUE 없음 → 두 케이스가 모두 `show_on_main=1` 가능 → 메인 홈에 3개 초과 노출
- **Fix**: `CREATE UNIQUE INDEX idx_show_on_main ON remodeling_cases(show_on_main) WHERE show_on_main > 0` 마이그레이션 + API 트랜잭션 스왑

### [Arch-C-extra] 관리자 인증 server-side 가드 전무

- **위치**: `app/admin/layout.tsx:121` + 전 children 트리
- **영향**: `sessionStorage` 토큰 없으면 로그인 폼 렌더 — 하지만 **/admin/remodeling HTML/JS는 풀다운로드됨**. API는 보호되지만 UI 구조 노출.
- **Fix**: `middleware.ts`에서 `/admin/*` JWT 쿠키 검증 후 리다이렉트 (sessionStorage → HttpOnly cookie로 전환 필요)

---

## 🟡 Major (1~2주 내 처리 권장)

### 보안 (5건)

- **[Sec-M1]** 로그인 API rate limit 부재 — brute force 무제한 (단일 인스턴스면 middleware 메모리 카운터로 OK)
- **[Sec-M2]** JWT 7일 + 회전 정책 없음 — 탈취 시 장기 유효. `expiresIn: "8h"` + jti 도입 권장
- **[Sec-M3]** 공개 `/api/config`가 `site_config` 전체 노출 — PUBLIC_KEYS 화이트리스트 필요
- **[Sec-M4]** HTTP 보안 헤더 0개 — `next.config.ts`의 `headers()`로 CSP, X-Frame-Options, nosniff 추가
- **[Sec-M5]** `/api/admin/remodeling/images` is_starred PUT 레이스 컨디션 — 두 탭 동시 5번째 토글 시 가드 우회

### 아키텍처·설계 (9건)

- **[Arch-M1]** config 스키마 3곳 drift: `ALLOWED_KEYS` vs `Config interface` vs `insertDefaultConfig` — `lib/config-schema.ts` 단일 소스화
- **[Arch-M2]** `apiFetch` wrapper 3곳 복붙 (admin/layout·announcements·config) — announcements/config는 non-ok를 조용히 삼킴
- **[Arch-M3]** `components/admin/image-editor.tsx`, `watermark-editor.tsx` dead code + cropperjs/react-cropper 의존성 ~100KB
- **[Arch-M4]** `lib/content.ts`의 `remodelingCases`, `remodelingServiceItems` dead. `/building-management`, `/rental-management`는 정적 리스트 사용하는데 홈(`ServiceSections`)은 DB config 사용 → 불일치 버그
- **[Arch-M5]** `app/page.tsx` ISR 60초 + `revalidatePath("/")` 이중 작동. `HeaderWrapper`가 client-side로 `/api/config` 별도 fetch → CLS + FOUC
- **[Arch-M6]** `/admin/*` 레이아웃 분리 없음 → admin 접근 시에도 public HeaderWrapper fetch 낭비
- **[Arch-M7]** `/api/admin/remodeling/images/reorder`의 items에 `case_id`/`type` 없음 → 다른 case 이미지 순서 조작 가능한 권한 우회 위험
- **[Arch-M8]** 이미지 단건 DELETE 경로 파일 정리 누락 → `data/uploads` 고아 무한 증가
- **[Arch-M9]** 상세 페이지(`app/remodeling/[id]/page.tsx`) CSR로 남음 + `layout.tsx`에서 같은 데이터 SSR 중복 조회

### 신뢰성 (4건)

- **[Rel-M1]** `app/api/admin/remodeling/route.ts:81-84` `fs.unlinkSync` silent — 최소 `console.warn` 로깅
- **[Rel-M2]** `components/header-wrapper.tsx:17` silent catch
- **[Rel-M3]** reorder 2단계 UPDATE에서 `case_id`/`type` 검증 없음 (Arch-M7과 중첩)
- **[Rel-M4]** `handleBulkUpload`가 `Promise.all` 대신 순차 `await` — N장 × RTT

### UX·접근성 (5건)

- **[UX-M1]** 공개 팝업 배경 클릭 닫힘 없음 — `home-client.tsx:185-240`
- **[UX-M2]** 관리자 모달 4곳 모두 배경 클릭 + 포커스 트랩 미구현
- **[UX-M3]** 상세 페이지 CSR → 초기 빈 박스 깜빡임
- **[UX-M4]** 토스트 타이밍 — "업로드 중" flash가 결과 flash로 2.5초 내 덮어써짐
- **[UX-M5]** 로딩 스피너/스켈레톤 부재 — 초기 load 실패와 빈 상태 구분 불가

### 성능 (4건)

- **[Perf-M1]** `app/remodeling/[id]/page.tsx:196-205, 240-248` Image fill인데 `sizes` 누락 → 100vw 가정
- **[Perf-M2]** dead editor 컴포넌트 제거 시 cropperjs ~70KB 절감 (Arch-M3)
- **[Perf-M3]** `/api/admin/remodeling` GET N+1 쿼리 (case마다 images 조회)
- **[Perf-M4]** `case_images`에 `is_starred` 조건 부분 인덱스 없음 (100 케이스 이상 시 체감)

### 코드 품질 (추가 7건)

- `defaultConfig` 하드코딩 38개 키 — 스키마 통합 시 자동 해결
- `renderPopupContent`의 `&lt;span>&lt;br/></span>` 빈 줄 간격 두 배 버그
- `parseStyle`/`TextStyle` 4곳 복제 (서로 다른 시그니처)
- `components/footer.tsx` `<table>` 레이아웃 해킹
- `lib/db/index.ts` `seedRemodelingCases` Unsplash 외부 의존 데모 — 프로덕션 리셋 시 노출 위험
- `wrapBold`/`insertBullet`의 `requestAnimationFrame` selection 복원 — React 19 concurrent에서 깨질 수 있음
- `next.config.ts`의 `serverActions.bodySizeLimit="50mb"` 사용처 없음 (dead option, DoS 표면)

---

## 🟢 Minor

생략 (30+ 건). REVIEW_V3.md 요약판이라 **Critical/Major 위주**. 전체 목록은 로그 참조.

대표 예시:

- DATA_DIR fallback 4곳 중복 → `lib/paths.ts` 통합
- `blurDataURL()` 매 렌더 호출 → 상수화
- `revalidatePath("/remodeling")`만 호출하고 `/remodeling/[id]` 누락 (현재 force-dynamic이라 무관)
- `components/admin/toast.tsx` `type` prop 정의되어 있으나 호출처 모두 `message`만 넘김
- `lib/site.ts` ceo="안민혁" vs `lib/db/index.ts` seed `footer_ceo="이동훈"` 불일치

---

## 테스트 커버리지 평가

### 현재 (9 tests / 3 files)

- ✅ **reorder-two-phase** — SQL 무결성 실증 견고 (단일 phase fail + 2-phase success)
- ⚠️ **star-limit** — SQL count만 증명, **실제 Route handler의 가드 로직은 호출 안 함**
- ✅ **home-data-filter** — WHERE IN + is_starred + image_url 필터 견고
- ❌ `lib/auth.ts` 미커버, `ALLOWED_KEYS` 미커버, path traversal 미커버, magic number 미커버, revalidatePath 호출 수 미커버

### 추가 필요 (P0~P3)

**P0 보안·무결성**:

1. path traversal (`../../data/upstay.db`) 차단
2. magic number mismatch (PNG 확장자로 JPEG 매직)
3. `verifyToken` 만료/조작 토큰 fail-fast

**P1 서버 가드 라우트 호출**: 4. is_starred 5번째 POST → 409 응답 (현재 SQL만 검증) 5. is_starred PUT 레이스 → 409 6. reorder 중간 무효 id → 트랜잭션 롤백 7. UNIQUE(case_id, type, match_order) 충돌 재현

**P2~P3**: ALLOWED_KEYS 필터, CASCADE delete 정확성, getMainCases 정렬, announcements ALTER 멱등성, `invalidatePublicCache` 호출 카운트

**vitest 개선**: `coverage: { provider: 'v8', thresholds: { lines: 60, functions: 70 } }` 추가

---

## 즉시 조치 우선순위 (시간 대비 효과)

| #   | 작업                                                                                       | 공수 | 효과                             |
| --- | ------------------------------------------------------------------------------------------ | ---- | -------------------------------- |
| 1   | `public/icon-phone.png` 3.5MB → 작은 PNG로 재인코딩                                        | 3분  | LCP 개선 즉효                    |
| 2   | `/api/remodeling`, `/api/announcements` dead 삭제                                          | 10분 | 중복 드리프트 제거               |
| 3   | `lib/db/index.ts`의 `DROP TABLE IF EXISTS remodeling_cases` 제거                           | 5분  | 복구 시 데이터 손실 폭탄 제거    |
| 4   | reorder 라우트 try/catch                                                                   | 10분 | 토스트 오류 메시지 정상화        |
| 5   | `/api/admin/remodeling` DELETE에 path.resolve 가드                                         | 15분 | 관리자 권한 오용 시 DB 삭제 방지 |
| 6   | `components/admin/image-editor.tsx`, `watermark-editor.tsx` + cropperjs/react-cropper 제거 | 20분 | dead code + ~100KB 의존성        |
| 7   | 공개 `/api/config` PUBLIC_KEYS 화이트리스트                                                | 30분 | 향후 민감 키 추가 시 자동 차단   |
| 8   | HTTP 보안 헤더 (CSP/X-Frame-Options/nosniff)                                               | 20분 | 클릭재킹·MIME 스니핑 방어        |
| 9   | 로그인 rate limit (middleware 메모리 카운터)                                               | 30분 | Brute force 차단                 |
| 10  | 카테고리(4) title/desc style 분리 + 004 마이그레이션                                       | 40분 | 현재 발동 중인 버그              |

**1~10번 모두 하루 내 처리 가능.** 나머지 Critical/Major는 구조적 리팩토링이라 별도 스프린트 필요.

---

## 배포 가능 여부 — 조건부 OK

현재 라이브는 **1명 관리자 + 외주 초기 단계**에서는 실질적 장애 위험 낮음. 다만:

- **3일 내 처리 권장**: 1, 3, 5, 10 (데이터 손실·보안·UX 버그)
- **1주 내 처리 권장**: 나머지 Critical + Major 상위
- **1개월 내**: 아키텍처 리팩토링 (쿼리 통합, config schema 단일화, CSR→SSR)

클라이언트 오픈 전에는 **최소 1~10번 + 테스트 P0·P1 일부** 처리가 필요합니다.
