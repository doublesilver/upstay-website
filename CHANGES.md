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
