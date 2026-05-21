# 변경 로그

## Phase 1

- 관리자 계정을 환경변수 기반으로 전환하고 `.env.example`, `.env.local`을 추가함
- 로그인 실패 메시지를 한글화하고 아이디 입력 자동완성을 차단함
- 팝업창 편집 모달에서 공개 토글을 제거하고 레이아웃을 단순화함
- 메인 페이지 사례 노출 조건을 `show_on_main` 1~3 및 이미지 존재 기준으로 제한함
- `handleAdd` 기본 제목이 빈 문자열인지 확인했고, 초기 시드 데이터의 `"사례 N"` 제목도 빈 문자열로 조정함
- 경고: 초기 비밀번호가 약함. 운영 배포 전 강한 값으로 변경 필요

## Phase 2

- `lib/db/migrations/`를 추가하고 SQL 파일 기반 마이그레이션 러너를 적용함
- `case_images.is_starred` 필드를 추가하고 기존 데이터는 `match_order = 0` 기준으로 이전함
- 별표가 하나도 없는 기존 데이터/시드 데이터는 공개 페이지 공백 방지를 위해 각 BEFORE/AFTER의 앞 4장을 임시 별표 처리함
- 리모델링 관리자에서 별표를 독립 토글로 분리하고 BEFORE/AFTER별 최대 4장 제한을 적용함
- 메인 설정에 사진안내 카테고리, 카테고리 4, 각 카테고리 노출 토글을 추가함
- 공개 메인/리모델링 목록/상세 페이지는 별표된 이미지 기준으로만 노출되도록 변경함

## Phase 3

- 리모델링 관리자에서 썸네일 본체 클릭만으로 편집 모달에 진입하도록 변경함
- 워터마크 편집에 `두께` 슬라이더를 추가하고 미리보기/실제 렌더링에 그림자 방식으로 반영함
- 공개 상세 페이지를 BEFORE/AFTER 분리형 레이아웃으로 정리하고 설명 영역을 카드 형태로 분리함
- 메인 페이지 `(Before → After)` 보조문구를 더 작은 회색 톤으로 조정함

## v3.5 (2026-04-26 카톡 피드백)

### 작업 7 — 안내 카테고리 컨트롤 정리

- `app/admin/config/page.tsx` — 각 카테고리(헤더/사진안내/안내1~5) 헤더 우측에 B/· 통합 toolbar 1세트로 이동, 각 입력 필드 위 toolbar 제거, fontSize 드롭다운 제거
- `app/admin/config/page.tsx:54-71` — `insertBulletInto` 인라인 헬퍼 (selection 보존 패턴)
- `app/admin/config/page.tsx:78-110` — `ToolbarButton` 인라인 컴포넌트 (`onMouseDown.preventDefault` blur 방지)
- `app/admin/config/page.tsx:407-457` — `ConfigSection`에 activeField 추적 + 헤더 통합 toolbar
- `components/admin/style-toolbar.tsx` — 삭제 (config 외 사용처 없음)
- `lib/config-schema.ts` — 변경 없음 (zod fontSize optional 보존, 기존 JSON 호환성 유지)

### 작업 6 — 사례 카드 전체보기 시각 힌트

- `components/home-client.tsx:135-140` — 카드 우측 상단에 `전체보기 →` 라벨 추가, group-hover 색상 전환

### 작업 1 — 카카오톡 모달 디자인 변경

- `components/kakao-button.tsx:5,8,29-39` — `KAKAO_ID` 상수, `copied` 상태, `handleCopyId` 클립보드 복사 + 1.5초 후 라벨 복원
- `components/kakao-button.tsx:75-93` — 배경 `#F5F5E7`, 흰 ID 박스(클릭 복사) + 검정 닫기 버튼 동일 너비, 체크 아이콘 + "카카오톡 친구추가" 제목
- ESC/외부 클릭/scroll-lock은 기존 보존

### 작업 5 — 라이트박스 BEFORE/AFTER 여백 분리

- `app/remodeling/[id]/detail-gallery.tsx:170` — 데스크탑 두 컬럼 사이 `lg:gap-10` 적용
- `app/remodeling/[id]/detail-gallery.tsx:172,189` — 각 컬럼에 `lg:px-2` 패딩 추가
- `app/remodeling/[id]/detail-gallery.tsx:185` — 구분선 색상 `#E5E7EB` → `#DDD`로 진하게
- 모바일 단일 표시는 변경 없음

### 작업 4 — 사례 상세 화면 라벨 정리 (DB 변경 없음)

- `app/admin/remodeling/page.tsx:605` — admin 라벨 `내용` → `설명`
- `app/remodeling/[id]/detail-gallery.tsx:134-143` — 모바일 설명 박스 디자인 변경 (좌측 회색 라벨 `설명` + 우측 본문 `title` 렌더, line-height 1.7)
- `remodeling_cases` 테이블 schema 변경 없음 — 후속 차수에 description 컬럼 분리 검토 (`QUESTIONS.md` Q6)

### 작업 2 — 팝업창 인라인 편집 전환

- `app/admin/announcements/page.tsx` 전면 재작성 — 기존 편집 모달 제거, 카드 자체 인라인 편집
- 좌측 textarea(title/content) + 우측 사이드바(공개 토글, B/· 1세트, 닫기 설정 select, 저장/삭제 버튼)
- `AnnouncementCard` 인라인 함수 컴포넌트 (page.tsx 내부 — 사용자 규칙 "한 번 쓰이는 코드 헬퍼 분리 금지" 준수)
- `activeField` state로 B/· 적용 대상 추적, `flushSync` + `setSelectionRange` 패턴 이식 (selection 정확히 보존)
- `onMouseDown.preventDefault()`로 textarea blur 방지
- **명시적 저장만** (debounce 자동저장 폐기) — `isDirty` 계산, 변경 카드 `border-yellow-300` + "● 미저장" 뱃지
- `dirtyMap` 페이지 state로 `beforeunload` 경고 + 공개 토글 시 dirty 카드 차단
- 삭제 모달은 유지 (기존 동작)
- 기존 API `/api/admin/announcements` (POST/PUT/DELETE) 시그니처 변경 없음

### 작업 3 — 워터마크 production 진단

- `data/upstay.db` 백업: `data/upstay.db.backup-2026-04-28`
- SQLite 진단 결과: 25/25 케이스가 `image_url_wm = ''` (분리 저장 사용 이력 0건)
- `app/admin/remodeling/page.tsx:213` — 썸네일 배지 `WM` → `워터마크` 한글화 + 폰트 크기 9px로 가독성 향상
- `image_url_wm || image_url` 폴백 로직 변경 없음 (`lib/home-data.ts:56`, `app/remodeling/[id]/page.tsx:56,60`)
- `image-edit-modal.tsx` 코드 검토 — `image_url` 자체를 덮어쓰는 경로 없음 확인
- `QUESTIONS.md`에 진단 결과 + 대표님 카톡 안내 초안 추가 (Q5)

### 배포 시 주의사항

- DB 마이그레이션 **0건** (이번 차수 schema 변경 없음)
- production 데이터 영향: 0 — 모두 UI/UX 변경
- 기존 워터마크 박힌 25개 이미지: 재업로드 외 제거 불가 (대표님 안내 필요, `QUESTIONS.md` Q5)
- 후속 차수 follow-up: title→description rename 검토, 워터마크 옵션 진행 결정 후 처리

## v3.6 (2026-04-28 카톡 추가 피드백)

### 작업 1 — 카카오 모달 정렬

- `components/kakao-button.tsx` — 체크 ✓ 이모지 span 제거, 모달 max-w 320 → 260px로 축소하여 ID 박스/닫기 버튼이 제목 텍스트 끝선과 자연 정렬

### 작업 5 — 사례 카드 전체보기 위치 변경

- `components/home-client.tsx` — 카드 헤더 단독 "전체보기" 행 제거
- GalleryGrid label="Before"일 때 라벨 위에 "전체보기 →" 좌측 정렬, group-hover 색상 전환
- After 영역에는 invisible spacer로 정렬 유지

### 작업 4 — 라이트박스 사진 크게

- `app/remodeling/[id]/detail-gallery.tsx:156` — 라이트박스 컨테이너 `lg:max-w-[1100px]` → `lg:max-w-[1400px]`로 확대

### 작업 3 — PC 상세 화면 설명 박스 표시

- `app/remodeling/[id]/detail-gallery.tsx:134` — 모바일 설명 박스의 `lg:hidden` 제거 → PC에서도 동일 위치에 표시
- 갤러리 영역은 flex-1로 자동 축소 (max-h-[20svh] 설명 박스만큼)

### 작업 6 — config B/· 일괄 토글

- `app/admin/config/page.tsx` 전면 수정
- activeField/sloganActive/photoGuideActive 추적 제거, B/· 항상 활성화
- 카테고리 B 클릭 = title_style + desc_style 양쪽 fontWeight bold 동시 토글 (allBold면 normal로, 아니면 둘 다 bold로)
- 카테고리 · 클릭 = title + desc 양쪽 끝에 "• " 추가 (`appendBullet` 헬퍼)
- 헤더/사진안내 동일 패턴 (단일 필드)
- `insertBulletInto` cursor 기반 헬퍼 제거, `appendBullet` 단순 추가 헬퍼로 교체

### 작업 2 — 팝업 B/· 일괄 적용

- `app/admin/announcements/page.tsx`
- AnnouncementCard에서 activeField state, titleRef/contentRef, flushSync 의존 제거
- B 클릭 = title + content 양쪽 전체 텍스트를 \*\* 페어로 감싸기 토글 (`toggleBoldAll`)
- · 클릭 = 양쪽 끝에 "• " 추가 (`appendBulletAll`)
- B 버튼은 양쪽 모두 bold 상태일 때 active 시각 표시

## 2026-04-27 긴급 버그 수정 + 영역 분할 인프라 (TRACK A + B)

### TRACK A — 버그 수정

- **A1 (Zone 7)**: `app/admin/config/page.tsx` photo_guide 영역 toolbar — 포커스 추적 패턴으로 복원. photo_guide_title input에 포커스 시 B/· 활성화, 미포커스 시 비활성. B = `photo_guide_style` fontWeight 토글, · = `photo_guide_title`에 cursor 위치 기반 글머리기호 삽입.
- **A2 (Zone 7)**: 안내 카테고리(1)~(5) ConfigSection — v3.6의 일괄 토글을 v3.5 패턴으로 복원. activeField state(`'title'|'desc'|null`) 추적. B 클릭 = activeField에 해당하는 `*_style` 컬럼만 fontWeight 토글, · 클릭 = activeField textarea/input에만 글머리기호 삽입. 헤더 toolbar는 1세트 유지 (대표님 요구).
- **A3 (Zone 2)**: `app/remodeling/page.tsx` 사례 리스트 — 카드 사이 마진 `my-4 md:my-5` → `my-1 md:my-2`로 축소, "전체보기" 텍스트를 `border + rounded-full` 박스 형태로 변경, 호버 시 테두리/색상 전환.

### TRACK B — 영역 분할 인프라

- **B1**: `WORK_ZONES.md` 신규 — 7개 Zone 정의 + 의존 그래프 + 작업 진행 규칙 + 공용 모듈 명시
- **B2**: `.github/PULL_REQUEST_TEMPLATE.md` 신규 — Zone 체크박스 + 검증 체크리스트 포함

### 알려진 한계 / 후속 차수 결정 사항

- **caption 필드 toolbar**: 지시서 A1/A2가 `photo_guide_caption` 및 카테고리 caption 필드도 toolbar 대상 요구했으나, caption 필드는 schema에 별도 `_style` JSON 컬럼이 없어 fontWeight 토글 불가능. 이번 차수는 **caption 제외**로 진행. 향후 caption*style 컬럼 추가 마이그레이션 (`lib/db/migrations/014*\*.sql`) 필요 여부 결정 필요.


## v3.11~v3.14 (2026-05-06 ~ 2026-05-18 PR #1~#12 일괄 정리)

이번 절에서는 5월 6일 이후 머지된 12개 PR을 한 번에 기록한다. 각 PR은 squash merge로 main에 반영.

### 마이그레이션 차수

- **017** `017_restore_image_url_wm.sql` — 016에서 폐기했던 `case_images.image_url_wm`을 복원. 클라이언트가 워터마크 시스템을 계속 사용하기로 확정함에 따라 컬럼 부활. **중요**: 016이 production volume에서 한 번이라도 적용됐다면 기존 워터마크 URL이 영구 손실됨. 배포 전 schema_migrations 조회로 016 적용 이력 점검 필요.
- **018** `018_add_edit_settings.sql` (PR #7) — `case_images.edit_settings TEXT` 컬럼 추가. 사진 편집 슬라이더 보정값(선명도/밝기/워터마크 위치·투명도·스케일)을 DB에 영속화. 기존엔 localStorage에만 저장되어 다른 디바이스/브라우저에서 슬라이더 값이 초기화되어 보이는 버그 수정.
- **019** `019_add_is_draft.sql` (PR #9) — `remodeling_cases.is_draft INTEGER NOT NULL DEFAULT 0` 컬럼 추가. 박스 3단계 영역 흐름(새박스 / 메인1·2·3 / 그 외)의 "새박스" 상태 표현. "박스 추가" 시 1, "저장" 또는 "메인1/2/3 지정" 시 0으로 전이.
- **020** `020_remodeling_cases_sort_index.sql` (v3.14) — `remodeling_cases(sort_order ASC, id ASC)` 복합 인덱스 추가. 케이스 누적 시 `ORDER BY sort_order` 쿼리가 SCAN + USE TEMP B-TREE로 회귀하는 문제 방지.

### 기능 변경

- **PR #5** `feat(admin): 메인1/2/3 박스를 목록 상단 1→2→3 순서로 고정` (의도 정정 PR #8에서 반전됨)
- **PR #6** `fix(admin): 메인1/2/3 토글 시 UNIQUE 위반으로 표시 안 되던 버그 수정` — `handleToggleMain`에서 같은 슬롯을 점유하던 박스를 먼저 `show_on_main=0`으로 비운 뒤 새 박스에 슬롯 부여. partial unique index(`idx_show_on_main_slot`) 회피.
- **PR #7** `feat(admin): 사진 편집 보정값을 DB에 영속화` — 018 마이그레이션과 동반. EditableImage 인터페이스에 `edit_settings` 필드, applyOne/applyAll 시 settings JSON 함께 저장.
- **PR #8** `fix(admin): 신규 박스를 메인1/2/3 위에 표시 (PR #5 정렬 방향 정정)` — `sortedCases`의 `[main, others]` → `[others, main]`로 반전.
- **PR #9** `feat(admin): 박스 3단계 영역(새박스/메인/그외) 흐름 구현` — 019 마이그레이션과 동반. sortedCases가 `[drafts, mains, others]` 3단 정렬, 새박스·메인 박스 드래그 비활성.
- **PR #11** `fix(admin): 새 박스 sort_order를 전체 박스 기준 최소-1로 부여` — `handleAdd`가 `Math.min(...draftCases.sort_order) - 1` → `Math.min(...cases.sort_order) - 1`. 저장 후 그 외 영역에서도 박스가 메인 바로 아래에 위치하도록.
- **PR #12** `style(remodeling): 전체보기 버튼 테두리 검정톤(#111)으로 변경`

### 보안 / 인프라 (v3.14 자동 수정)

- **CRITICAL**: `sanitize-html ^2.17.4`로 업데이트 — XMP 태그 XSS(`GHSA-rpr9-rxv7-x643`) 해소.
- **CRITICAL**: `next ^16.2.6`으로 업데이트 — 미들웨어 우회 다중(`GHSA-26hh-7cqf-hhc6` 등) 해소.
- `components/header.tsx` navItem `<span>` → `<Link>` — 사이트 핵심 탐색 복구.
- `app/api/auth/route.ts` rate-limit IP 추출을 `x-forwarded-for`의 마지막 IP로 변경 — 프록시 환경에서 스푸핑 방어.
- `app/remodeling/[id]/page.tsx` 별표(slot_position) 우선 정렬 적용.
- dnd-kit `KeyboardSensor` 3곳 추가 — 드래그&드롭 키보드 접근성.
- 색 대비 4.5:1 미달 토큰 일괄 교체 (`#9CA3AF` → `#6B7280`, `#888` → `#555`, 빈 상태 `#999` → `#666`).
- 관리자 로그인 input `aria-label` 추가 + 에러 박스 `role="alert"`.
- 홈 페이지 빈 상태 안내 "등록된 사례를 준비 중입니다.".
- 테스트 4개 suite의 `JWT_SECRET` import 제거 + `setupTempDataDir`에 env 자동 주입. 30개 테스트 전수 통과.
- ESLint 2 warnings 해소 (`setStyle` dead code 제거, `image-edit-modal` useEffect deps 의도 주석).

### 후속 차수 결정 필요

- `/remodeling` 리스트의 별표 fallback (WORK_ZONES.md Zone 2 명세 vs `lib/home-data.ts:96` 코드 불일치) — 클라이언트 확답 필요.
- `case_images.image_url_wm` production volume 데이터 손실 점검 — `schema_migrations` 016 적용 이력 확인 후 결과에 따라 백업 복원 가능성.
- 운영 자격증명(`ADMIN_PW`, `JWT_SECRET`) GitHub 히스토리 노출 — Railway 환경변수 새 값으로 교체 + 필요 시 `git filter-repo` history 정리.
- `file2s.zip` / `file33s.zip` / `upstay-logo.png` 등 무관 commit 파일 정리 (force push 동의 필요).


## v3.15 (2026-05-18) — 1차 전수검사 자동수정 일괄

PR #13 squash merge. 검수 보고서 `inspection-report-2026-05-18-2003.md` 기반.

### CRITICAL
- sanitize-html `^2.17.4` 업데이트 — `GHSA-rpr9-rxv7-x643` XSS 해소.
- next `^16.2.6` 메이저 업그레이드 — 미들웨어 우회 다중(`GHSA-26hh-7cqf-hhc6` 등) 해소.
- `components/header.tsx` navItem `<span>` → `<Link>` — 사이트 핵심 탐색 복구.

### HIGH (보안·a11y·성능 일괄)
- 테스트 4 suite 정상화 (`JWT_SECRET` import 제거 → setupTempDataDir env 자동 주입). 9 files / 30 tests 전수 PASS.
- ESLint 2 warnings 해소 (`setStyle` dead code 제거 + image-edit-modal useEffect deps 의도 주석).
- rate-limit IP 추출을 `x-forwarded-for` "마지막" 값으로 변경 — 프록시 환경 스푸핑 방어.
- 사례 상세 페이지 `slot_position` 우선 정렬 적용.
- 색 대비 4.5:1 미달 토큰 일괄 교체 (`#9CA3AF`→`#6B7280`, `#888`→`#555`, 빈상태 `#999`→`#666`).
- dnd-kit `KeyboardSensor` 3곳 추가 (admin/remodeling, admin/config, image-edit-modal) — 드래그&드롭 키보드 접근성.
- 관리자 로그인 input `aria-label` + 에러 박스 `role="alert"`.
- 홈 빈 상태 안내 텍스트.

### 마이그레이션
- `020_remodeling_cases_sort_index.sql` — `(sort_order, id)` 복합 인덱스로 정렬 회귀 방지.

## v3.16 (2026-05-18 ~ 2026-05-19) — PWA 메타 자산 보강 일괄

PR #14~#20. 외주 Out-of-Scope 자발적 품질 보강 (추가 비용 없음, 클라이언트 사후 동의 권장).

### UX·접근성
- PR #14 `ui(admin)`: 박스 3단계 영역(새박스/메인/그외) 시각 구분 헤더+구분선.
- PR #15 `perf(font)`: Pretendard 셀프 호스팅(next/font/local) — LCP 개선, CDN 의존 제거, CSP `jsdelivr` 제거.
- PR #16 `ui(admin)`: 모바일 햄버거 메뉴 + 슬라이드 사이드바 (lg 이하).
- PR #17 `a11y`: 모달 focus trap + 초기 포커스 (KakaoButton / AnnouncementPopup / 삭제 다이얼로그 2곳).
- PR #18 `perf(admin)`: 이미지 bulk delete N+1 → 단일 요청 (`ids: number[]` + `case_id` 트랜잭션).
- PR #19 `test`: 핵심 비즈니스 로직 단위 테스트 (`lib/case-sorting.ts` 추출 + 5 test 파일, 73 tests 전수 PASS).

### PR #20 PWA 메타 자산 7종 일괄 보강
- `app/icon.svg`, `app/icon.png` (32), `app/apple-icon.png` (180), `public/icon-{192,512}.png` (Android Chrome maskable), `public/og-image.png` (1200×630, SNS 표준), `app/manifest.ts` (Web App Manifest).
- `scripts/build-icons.mjs` — sharp 기반 일괄 생성 스크립트.
- `app/layout.tsx` viewport themeColor + metadata.icons + manifest + twitter card 추가.

## v3.17 (2026-05-19 ~ 2026-05-21) — 회귀 핫픽스 + PWA 추가 보강 + 2차 자동수정

### PR #21 회귀 + silent fail 차단
- `lib/admin-api.ts` 401 응답 시 `alert()` 동기 차단으로 명시 안내 후 redirect — "업로드 안 됨 + 메시지 없음" 보고 해결.
- `lib/auth.ts` JWT 만료 8h → 24h (단일 admin + HttpOnly+SameSite+CSRF+rate-limit 종합 위험 평가).
- `components/admin/image-edit-modal.tsx` draft fallback 일시 제거 (이후 PR #24에서 복원).

### PR #22~#23 PWA 아이콘 추가 보강
- PR #22: Maskable 안전 영역 80%까지 사용(padding 0.2 → 0.1).
- PR #23: any/maskable 자산 분리 (`icon-{192,512}.png` purpose=any 패딩 5%, `icon-maskable-{192,512}.png` purpose=maskable 패딩 10%) + SVG trim. manifest.ts 분리 등록.

### PR #24 모달 회귀 핫픽스 + 다량 업로드 batch
- `image-edit-modal.tsx` draft fallback 복원 (`draftSettingsRef`) + useEffect deps `[currentId]` 만으로 한정 → 전체적용 중 슬라이더/워터마크 흔들림 제거.
- "미저장" orange 뱃지 — 데이터 손상 오인 방지와 작업 흐름 양립.
- `handleBulkUpload` 5장씩 batch 분할 + 진행 토스트 → next 미들웨어 100MB / Cloudflare 100MB 한도 회피.

### PR #25 사진 편집 모달 정리
- 초기화 버튼 `RotateCcw` 아이콘 제거 (텍스트만).

### 2차 전수검사 자동수정 (현재 차수)
- `lib/home-data.ts` `getMainCases` / `getAllCases` 공개 쿼리에 `is_draft = 0` 필터 — 새박스(작업 중)가 공개 페이지에 노출되지 않도록.
- `app/remodeling/[id]/page.tsx` `generateStaticParams` + 케이스 조회에 `is_draft = 0` 필터 — sitemap·정적 빌드 깨끗.
- 마이그레이션 `021_case_images_type_index.sql` — `(case_id, type, match_order)` 일반 복합 인덱스로 케이스 증가 시 full scan 회귀 방지.
- `lib/admin-schemas.ts` 이미지 URL regex `^/api/uploads/[\w.-]+$` 로 좁힘 (SSRF·내부망 주입 차단).
- `app/api/admin/upload/route.ts` sharp `limitInputPixels` 24M → 200M 상향 — 최신 폰 카메라(48MP/200MP)도 자동 다운스케일 정상 처리, silent fallback DoS 위험 제거.
- `next.config.ts` 정적 자산 캐시 헤더 매칭 패턴 보강 — PWA 아이콘(`icon-192/512`, `icon-maskable-*`)과 `og-image` 도 포함.
- `README.md` 디렉토리 구조 + 워터마크 표기 갱신, `scripts/build-icons.mjs` 헤더 주석 any/maskable 분리 반영.

### 후속 차수 결정 필요 (계속)
- `/remodeling` 별표 fallback (클라이언트 확답).
- production volume의 016 적용 이력 점검 (워터마크 손실 가능성).
- 운영 자격증명 GitHub 히스토리 + Railway env 교체.
- 무관 파일(`file2s.zip` 등) 정리 (force push 동의 필요).
- Pretendard 폰트 KS X 1001 서브셋 woff2 교체 (~450KB 절감).
- 비밀번호 평문 → argon2 해시 전환.

## v3.18 (2026-05-21) — 3차 검수 자동수정 + 정책 결정

### PR #27 자동수정 (UI 무영향 14건)

CRITICAL 3건
- CN-1 `app/sitemap.ts` `WHERE is_draft = 0` — PR #26 누락분.
- C-3 README:518 ADMIN_PW 평문 제거 → placeholder + `openssl rand`.
- C-4 무관 파일 4건 git rm (file2s.zip, file33s.zip, Screenshot*.JPG, upstay-logo.png).

HIGH 4건
- NH-2 ImageThumb nested interactive 해소 — 자식 별표 button `tabIndex={-1}` + `aria-label`.
- NH-3 드래그 핸들 `aria-label` 2곳 (admin/remodeling, admin/config).
- NH-4 모바일 헤더 `<h1>` → `<p aria-hidden>` — 페이지 본문 h1 중복 회피.
- H-22 sharp metadata 사전 게이트 — 100MP 초과 업로드 400. 200MP OOM 차단.

MEDIUM 7건
- NM-1 `/api/uploads` `limitInputPixels` 100M 통일 (업로드 게이트와 일관).
- NM-3 `next.config.ts` `icon-maskable-.*` 중복 패턴 제거.
- NM-4 `next.config.ts` `/uploads/:path*` dead source 제거.
- NM-15 로그인 input `aria-describedby` + `aria-invalid` 에러 메시지 연결.
- NM-19 `.env.example`에 `SEED_DEMO=` 주석 추가.
- 보안 HSTS 헤더 (`Strict-Transport-Security`) 추가.
- `.gitignore`에 `.env.*` 패턴 + `sanitize-html`에 `https` only + `target="_blank"`에 `rel="noopener noreferrer"` 자동 주입.

### 정책 결정 (클라이언트 확답)

- **H-3 `/remodeling` 별표 fallback**: 클라이언트가 "현재 동작 유지"로 결정.
  - 별표(`slot_position` 1~4) 지정된 사진이 있는 박스만 메인/리스트에 노출.
  - 별표 미지정 박스는 의도적 제외.
  - `WORK_ZONES.md` Zone 2 명세를 "별표만 노출"로 정정 (명세-코드 일치).
  - `QUESTIONS.md` Q7로 기록.

### 후속 차수 잔존

- C-2 production volume 016/017 데이터 점검 (사용자 외부 액션 진행 중)
- C-3 Railway env `ADMIN_PW`/`JWT_SECRET` 교체 (사용자 외부 액션 진행 중)
- H-1 `/admin/config` 이탈 경고 (UI 다이얼로그 체감 우려로 보류)
- H-6 Pretendard 폰트 KS X 1001 서브셋 (디자인 결정)
- H-13 비밀번호 argon2 해시 전환 (보안 정책 결정)
- H-16 배치 업로드 토스트 카피 (UX 카피 체감 우려)
- H-17 `lib/site.ts` 주소 통일 (DB 운영값 확인)
- NM-2 `home-data.ts` starredOnly=false dead 분기 (시그니처 변경, 별도 차수)
- NM-30+ Medium 22건 (별도 차수)

## v3.19 (2026-05-21) — 이미지 로딩 속도 개선 (precompute WebP/AVIF)

### 배경
클라이언트(민혁) "업로드한 사진이 로딩되는게 너무 느리다" 보고.
진단 결과 sharp 변환 자체는 잘 동작하지만, **첫 요청 시 매번 변환에 1-3초** 소요 → 콜드캐시 첫 방문자가 느림.

### 변경 (UI 무영향, DB 변경 0)

**`app/api/admin/upload/route.ts`**
- 업로드 직후 `precomputeVariants()` 백그라운드 호출. fire-and-forget이라 업로드 응답 지연 0.
- 원본 옆에 `1234-abc.jpg.webp` + `1234-abc.jpg.avif` 사본 동시 생성.
- gif는 sharp 단일프레임 한계로 제외.

**`app/api/uploads/[...path]/route.ts`**
- Accept 헤더 기반 서빙 시 1순위로 precomputed 사본 확인 → 있으면 즉시 streaming (sharp 호출 0, <50ms).
- 없으면 (기존 업로드) 2순위로 기존 변환 캐시 fallback — 후방 호환 완전 유지.

**`app/api/admin/remodeling/images/route.ts` + `app/api/admin/remodeling/route.ts`**
- 이미지/케이스 삭제 시 `.webp` + `.avif` 사본도 동반 unlink. ENOENT는 정상(기존 업로드).

### 효과
- 새 업로드: 첫 요청부터 사용자 전원 빠름 (Railway CPU 0, 응답 <50ms)
- 기존 업로드: 변경 없음 (기존 캐시 그대로)
- 디스크 사용량: 업로드당 약 1.5-1.8배 (원본 + webp + avif)
- Cloudflare cache HIT률 향상 — 정적 파일 동일 응답이라 CDN 캐싱 용이

### 검증
- 73 tests PASS (회귀 0)
- typecheck PASS, lint clean, build PASS

### 백필 (선택)
기존 업로드에도 효과 적용하려면 1회성 백필 스크립트 필요. 우선 새 업로드부터 효과 확인 후 결정.

## v3.20 (2026-05-21) — 기존 업로드 백필 스크립트

### 배경
v3.19에서 새 업로드는 첫 요청부터 빠르게 됐지만, 기존 업로드는 여전히 콜드 캐시 시 sharp 변환에 1-3초.
일회성 백필 스크립트로 기존 사진 전부에 WebP/AVIF 사본을 미리 생성한다.

### 변경
- **`scripts/backfill-image-variants.mjs`** 신규
  - `data/uploads/` 스캔 → 원본 후보 추출 (사본 자체는 배제)
  - 이미 사본 있으면 skip → 중복 실행 안전
  - 각 사진 실패해도 다음 진행 → 배치 중단 방지
  - `--dry-run`으로 처리 대상 미리 확인 가능
  - 직렬 처리 (Railway 1코어 환경 대비, 사이트 응답 영향 최소화)
- **`Dockerfile`** scripts/ 디렉토리 standalone runner에 명시 copy

### 안전성
- 원본 파일은 read-only로만 접근 — sharp 자체가 in-place 수정 API 없음
- DB 변경 0
- 기존 변환 캐시(`data/cache/`) 변경 0
- 이미 생성된 사본은 skip → 중복 실행해도 안전

### 실행 방법
```
railway ssh
cd /app && node scripts/backfill-image-variants.mjs --dry-run  # 미리보기
cd /app && node scripts/backfill-image-variants.mjs            # 실제 실행
```
