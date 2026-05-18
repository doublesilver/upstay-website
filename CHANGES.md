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
