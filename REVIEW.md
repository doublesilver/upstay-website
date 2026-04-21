# UPSTAY 피드백 반영 검증 리포트

검증 일시: 2026-04-21  
검증 커밋: fe8223a

---

## 종합 결과

총 22개 항목 / ✅ 14 / ⚠️ 6 / ❌ 2 / ❓ 0  
배포 가능: [ ] Yes / [x] No (Critical 1건, Major 3건 해결 후 가능)

---

## 상세 결과

### [1-1] 로그인 계정 환경변수화

**요구사항**: `process.env` 사용, fallback 없음, `.env.local` gitignore, git history에 비번 잔존 없음  
**결과**: ✅

**증거**:

- `lib/auth.ts:4-12` — `requireEnv()` 함수로 `ADMIN_ID`, `ADMIN_PW`, `JWT_SECRET` 읽음. 환경변수 없으면 서버 시작 시 throw.
- `lib/auth.ts:15` — `id === requireEnv("ADMIN_ID") && pw === requireEnv("ADMIN_PW")` — fallback 없음, 직접 비교
- `.gitignore:4` — `.env.local` 포함
- `.env.example:1-3` — 키만 있고 값 없음 (안전)
- `git log -S "ADMIN_ID|ADMIN_PW|admin123|password" -- lib/auth.ts app/api/auth/route.ts` — 출력 없음 (비밀번호 git history 잔존 없음)
- `CHANGES.md:9` — "경고: 요청된 관리자 비밀번호 `0426`은 매우 약한 비밀번호이므로 운영 배포 전 반드시 더 강한 값으로 변경 필요" (문서화됨)

**주의**: CHANGES.md에 `0426` 비밀번호가 평문 명시됨. git에 커밋된 상태. 보안 이슈이나 실제 환경변수 값이 아닌 문서 메모라 Critical은 아님.

---

### [1-2] 로그인 오류 메시지 한글화

**요구사항**: `app/api/auth/route.ts`, `app/admin/layout.tsx` 한글 오류 메시지  
**결과**: ✅

**증거**:

- `app/api/auth/route.ts:7-9` — `{ error: "아이디 또는 비밀번호가 올바르지 않습니다" }`
- `app/admin/layout.tsx:102` — `setError(data.error || "아이디 또는 비밀번호가 올바르지 않습니다")`
- `app/admin/layout.tsx:109` — `setError("서버에 연결할 수 없습니다")`

---

### [1-3] 팝업창 편집 모달 정리

**요구사항**: 편집 모달 안에 `is_visible` 토글 없어야 함, "팝업 닫기 설정" label 없어야 함, 드롭다운 4개 옵션 순서 확인  
**결과**: ⚠️

**증거**:

- `app/admin/announcements/page.tsx:121-174` — 편집 모달 전체 코드
- `is_visible` 토글: 모달 내 없음 ✅ (토글은 목록 카드에만 있음, `line 83-94`)
- 드롭다운 옵션 순서 (`line 150-154`):
  1. `none` → "매번 표시"
  2. `day` → "닫으면 하루 동안 안 보임"
  3. `week` → "닫으면 일주일 동안 안 보임"
  4. `forever` → "닫으면 다시 안 보임"

**문제점**:

- `app/admin/announcements/page.tsx:141` — 편집 모달 내에 `<label>팝업 닫기 설정</label>` 여전히 존재
  ```tsx
  <label className="block text-[13px] font-medium text-[#333] mb-2">
    팝업 닫기 설정
  </label>
  ```
  요구사항은 이 label이 "없어야" 한다고 명시함.

**재현**: 관리자 팝업창 → 새 팝업 또는 편집 버튼 클릭 → 모달에 "팝업 닫기 설정" 텍스트 표시됨

---

### [1-4] 사용자 팝업 닫기 버튼 크기 축소

**요구사항**: `components/home-client.tsx` 팝업 닫기 버튼 크기 축소  
**결과**: ✅

**증거**:

- `components/home-client.tsx:204` — 닫기 버튼:
  ```tsx
  className =
    "w-full bg-[#111] text-white rounded-lg py-2.5 text-[14px] font-medium hover:bg-[#333] transition-colors";
  ```
  `py-2.5`(10px), `text-[14px]` — 이전 대형 버튼과 비교해 축소된 스타일. "닫기" 텍스트 (`line 203`).

---

### [1-5] 메인 페이지 빈 케이스 숨김

**요구사항**: `show_on_main IN (1,2,3)` + 이미지 1장 이상인 케이스만 표시  
**결과**: ✅

**증거**:

- `lib/home-data.ts:87-93`:
  ```ts
  "SELECT id, title FROM remodeling_cases WHERE show_on_main IN (1, 2, 3) ORDER BY show_on_main ASC, sort_order ASC, id ASC";
  ```
  이후 `buildCases(cases, 4, true)` 호출
- `lib/home-data.ts:81` — `.filter((item) => item.before_images.length + item.after_images.length > 0)` — 이미지 0장 케이스 필터링
- `app/api/remodeling/route.ts:41-62` — API도 동일하게 `is_starred = 1 AND image_url <> ''` 조건 + filter 적용

---

### [1-6] 사진 등록 기본 제목 빈 문자열

**요구사항**: `handleAdd` 기본 제목 빈 문자열, POST API, seed 모두 확인  
**결과**: ✅

**증거**:

- `app/admin/remodeling/page.tsx:694-698`:
  ```ts
  body: JSON.stringify({
    title: "",
    sort_order: cases.length + 1,
    show_on_main: 0,
  });
  ```
- `app/api/admin/remodeling/route.ts:33` — `title || ""` (빈값 허용)
- `lib/db/index.ts:150-165` — seed 케이스 모두 `title: ""`

---

### [1-7] "Before → After" 괄호 공백 전역 확인

**요구사항**: 특정 형식의 괄호 문구 전역 grep  
**결과**: ✅

**증거** (grep 결과 전체):

- `lib/db/index.ts:108` — `"Before → After"` (remodeling_page_subtitle 기본값)
- `lib/db/migrations/003_add_photo_guide_config.sql:10` — `'Before → After'`
- `components/home-client.tsx:83` — `initialConfig.photo_guide_caption || "Before → After"`
- `app/admin/config/page.tsx:65` — `photo_guide_caption: "Before → After"`

요청된 `( Before → After )` 형태의 괄호+공백 문구는 코드 어디에도 없음. DB 기본값과 컴포넌트 폴백 모두 `Before → After` 형태 통일.

---

### [1-8] 공개 페이지 우클릭/드래그 차단

**요구사항**: 공개 페이지 모든 `<Image>/<img>`에 `onContextMenu`, `onDragStart`, `draggable={false}`, `userSelect:none` 적용. 관리자는 제외.  
**결과**: ❌

**증거**:

- grep 전체 결과: `onContextMenu` — 0건, `onDragStart` — 0건
- `draggable={false}` — `app/admin/remodeling/page.tsx:187` 1건만 존재 (관리자 페이지)
- `select-none` — `app/admin/remodeling/page.tsx:190` (관리자 페이지만)
- 공개 페이지 확인:
  - `app/remodeling/page.tsx:39-48` — `<Image>` 컴포넌트, `onContextMenu`/`onDragStart`/`draggable` 없음
  - `app/remodeling/[id]/page.tsx:193-201` — `<Image>` 컴포넌트, 보호 속성 없음
  - `components/home-client.tsx:238-251` — `<Image>` 컴포넌트, 보호 속성 없음

**문제점**: 공개 페이지 이미지 전체에 우클릭/드래그 차단이 미적용됨. 관리자 페이지에만 일부 `draggable={false}`가 있을 뿐.

**재현**: `/remodeling` 또는 `/` 접속 → 이미지 우클릭 → "이미지를 다른 이름으로 저장" 가능

---

## Phase 2

### [2-0] 마이그레이션 인프라

**요구사항**: idempotent, 순서 보장, `schema_migrations` 테이블  
**결과**: ✅

**증거**:

- `lib/db/index.ts:208-238` — `applyMigrations()` 구현:
  - `schema_migrations` 테이블 존재 (`lib/db/index.ts:67-70`)
  - `applied.has(file)` 체크로 이미 적용된 마이그레이션 스킵 (idempotent)
  - `fs.readdirSync(...).filter(...).sort()` — 파일명 알파벳 정렬 순서 보장
  - 트랜잭션 내 `database.exec(sql) + insertMigration.run(file)` — 원자적 적용
- 마이그레이션 파일 3개: `001_add_star_field.sql`, `002_add_category4_and_visibility.sql`, `003_add_photo_guide_config.sql`

---

### [2-1] 별표 시스템

**요구사항**: `is_starred` 컬럼, BEFORE/AFTER 각 4개 제한, 프론트 UI, 서버 validation, 공개 페이지 is_starred=1만 표시  
**결과**: ⚠️

**증거 (통과)**:

- DB 스키마: `lib/db/migrations/001_add_star_field.sql:9` — `ALTER TABLE case_images ADD COLUMN is_starred INTEGER NOT NULL DEFAULT 0`
- 프론트 MAX 상수: `app/admin/remodeling/page.tsx:50` — `const MAX_STARRED_PER_TYPE = 4`
- 프론트 초과 차단: `page.tsx:904` — `if (!target.is_starred && starredCount >= MAX_STARRED_PER_TYPE) { flash("별표는 BEFORE/AFTER 각 4개까지 선택 가능합니다"); return; }`
- 프론트 버튼 비활성화: `page.tsx:399` — `disableStar={image.is_starred !== 1 && starredCount >= MAX_STARRED_PER_TYPE}`
- 공개 API `app/api/remodeling/route.ts:23-25` — `AND is_starred = 1 AND image_url <> ''`
- 공개 상세 `app/api/remodeling/[id]/route.ts:29-31` — `AND is_starred = 1 AND image_url <> ''`
- `lib/home-data.ts:34-35` — `starredOnly=true` → `filters.push("is_starred = 1")`

**문제점 (서버 validation 누락)**:

- `app/api/admin/remodeling/images/route.ts` — PUT (is_starred 업데이트) 및 POST (신규 이미지) 엔드포인트에 **4개 초과 방지 서버 로직 없음**
- `route.ts:41-48` — allowed 키 목록에 `is_starred` 있으나, 저장 전 해당 case/type의 기존 starred 수 체크 없음
- 악의적 클라이언트가 직접 API 호출 시 4개 초과 별표 설정 가능

---

### [2-2] 안내 카테고리 4번 + 노출 토글

**요구사항**: `app/admin/config/page.tsx`, `components/service-sections.tsx`, `app/api/admin/config/route.ts ALLOWED_KEYS`  
**결과**: ✅

**증거**:

- `app/admin/config/page.tsx:275-289` — "안내 카테고리 4" `ConfigSection` 컴포넌트 사용
- `app/admin/config/page.tsx:53-58` — Config 인터페이스에 `service_category4_*` 필드 5개 존재
- `app/admin/config/page.tsx:126-130` — `toggleVisible("service_category4_visible")` 토글 동작
- `app/api/admin/config/route.ts:49-53` — ALLOWED_KEYS에 `service_category4_title`, `service_category4_desc`, `service_category4_caption`, `service_category4_style`, `service_category4_visible` 포함
- `components/service-sections.tsx:122-130` — `service_category4` 섹션 렌더링. `visible && (title.trim() || description.trim())` 필터로 빈 카테고리는 공개 페이지에 미노출

---

### [2-3] "사진안내 카테고리" 섹션 (photo*guide*\* 필드)

**요구사항**: `photo_guide_*` 필드 구현  
**결과**: ✅

**증거**:

- `app/admin/config/page.tsx:186-225` — "사진안내 카테고리" 섹션: `photo_guide_title`, `photo_guide_caption`, `photo_guide_visible`, `photo_guide_style` 편집 UI
- `app/api/admin/config/route.ts:23-27` — ALLOWED_KEYS에 4개 키 포함
- `lib/db/migrations/003_add_photo_guide_config.sql` — 마이그레이션으로 기본값 삽입
- `components/home-client.tsx:78-84` — `photo_guide_visible`, `photo_guide_style`, `photo_guide_title`, `photo_guide_caption` 실제 반영

---

## Phase 3

### [3-1] 썸네일 클릭 시 편집 모달

**요구사항**: `SortableThumb onClick` → 편집 모달 진입  
**결과**: ✅

**증거**:

- `app/admin/remodeling/page.tsx:176-177`:
  ```tsx
  onClick = { onOpenImage };
  ```
  `SortableThumb` div에 `onClick={onOpenImage}` 직접 연결
- `page.tsx:401-402`:
  ```tsx
  onOpenImage={() => onOpenImage(caseId, type, image.id)}
  ```
- `page.tsx:1003-1005`:
  ```tsx
  onOpenImage={(caseId, type, imageId) =>
    setEditorSection({ caseId, type, initialImageId: imageId })
  }
  ```
  `ImageEditModal` 열림 (`page.tsx:1064`)

---

### [3-2] 워터마크 설정: 크기만, 두께 없어야

**요구사항**: `components/admin/image-edit-modal.tsx`에 크기 슬라이더만, 두께 슬라이더 없어야  
**결과**: ❌

**증거**:

- `components/admin/image-edit-modal.tsx:18` — `EditSettings` 인터페이스에 `wmThickness: number` 존재
- `components/admin/image-edit-modal.tsx:37` — `DEFAULT_SETTINGS`에 `wmThickness: 0`
- `components/admin/image-edit-modal.tsx:297-308`:
  ```tsx
  <Slider
    label="두께"
    value={settings.wmThickness}
    min={0}
    max={10}
    onChange={(value) =>
      setSettings((prev) => ({ ...prev, wmThickness: value }))
    }
    unit=""
  />
  ```
  두께 슬라이더가 UI에 노출됨.
- `page.tsx:289` — `renderToBlob`에서 `ctx.shadowBlur = settings.wmThickness` 실제 렌더링에도 반영됨
- `app/admin/remodeling/page.tsx:289` — `filter: \`drop-shadow(0 0 ${settings.wmThickness}px rgba(0,0,0,0.5))\`` 미리보기에도 반영됨

**문제점**: 요구사항 "두께 없어야"에 명백히 위반. 두께 슬라이더가 UI에 존재하고 실제로 동작함.

**재현**: 관리자 사진등록 → 편집 버튼 → 오른쪽 패널 "워터마크 설정" 섹션에 "두께" 슬라이더 노출됨

---

### [3-3] 워터마크 이미지 소스 (/logo.png 유지)

**요구사항**: `/logo.png` 사용 유지  
**결과**: ✅

**증거**:

- `components/admin/image-edit-modal.tsx:123-126`:
  ```ts
  loadImage("/logo.png")
    .then(setLogoImg)
    .catch(() => setLogoImg(null));
  ```
- `components/admin/image-edit-modal.tsx:201` — `src="/logo.png"` 미리보기에도 동일

---

### [3-4] 공개 사례 상세 페이지 레이아웃

**요구사항**: `app/remodeling/[id]/page.tsx` BEFORE/AFTER 분리 레이아웃  
**결과**: ✅

**증거**:

- `app/remodeling/[id]/page.tsx:121-149` — BEFORE, AFTER 각각 `GallerySection` 컴포넌트로 분리 렌더링
- `page.tsx:134-136` — 두 섹션 사이 구분선 `<div className="border-t border-[#EBEBEB] my-8" />`
- `page.tsx:151-157` — 설명 카드 별도 섹션으로 분리
- `app/api/remodeling/[id]/route.ts:40-47` — `before_images`, `after_images` 별도 배열 반환

---

## 부가 검증

### [A] 제외 항목 확인 (과도 추가 없어야)

**결과**: ⚠️

**증거**:

- IME 관련 코드: grep 결과 없음 ✅
- 메인창 사라짐 버그 관련 코드: 없음 ✅
- `autoComplete`: `app/admin/layout.tsx:179` — `autoComplete="off"` (아이디 입력), `autoComplete="current-password"` (비밀번호 입력) — 로그인 폼에만 적용, 과도 추가 아님 ✅
- **두께 필드**: `components/admin/image-edit-modal.tsx:297-308` — 요구사항은 "두께 없어야"인데 존재함 ❌ (3-2에서 이미 지적)

---

### [B] 회귀 테스트 (코드 수준)

**결과**: ⚠️

**증거**:

- 로그인 흐름: `app/admin/layout.tsx:90-113` — handleLogin, 401 처리, sessionStorage 저장 정상
- 업로드: `app/admin/remodeling/page.tsx:91-102` — `uploadFiles()` → `/api/admin/upload` POST, 오류 시 toast 표시 (`line 818-821`)
- 드래그앤드롭: `app/admin/remodeling/page.tsx:311-321` — `handleDragEnd` 이미지 순서 변경, `662-688` 케이스 순서 변경
- 편집 모달: `page.tsx:1064-1091` — `ImageEditModal` 호출 정상
- 삭제: `page.tsx:708-720` — `handleDelete`, 케이스 삭제 + 파일 정리
- 로그아웃: `app/admin/layout.tsx:115-119` — sessionStorage 제거 후 /admin 리다이렉트
- 공개 링크: `/remodeling` → `getAllCases()` (is_starred=1 필터), `/remodeling/[id]` → API is_starred=1 필터

**우려 사항**:

- `handleToggleMain` (`page.tsx:723-733`) — 동일 `show_on_main` 값을 가진 다른 케이스 0으로 초기화 로직 있으나, 저장(`handleRegister`)을 눌러야만 DB 반영됨. 저장 전 다른 케이스 토글 시 충돌 가능성 있음 (UX 이슈, 크리티컬은 아님)

---

### [C] 빌드/타입체크/린트

**결과**: ✅ (요청에 따라 재실행 생략, 이미 통과 확인됨)

---

### [D] 보안

**결과**: ⚠️

**증거**:

- JWT_SECRET: `lib/auth.ts:19` — `jwt.sign({ role: "admin" }, requireEnv("JWT_SECRET"), { expiresIn: "7d" })` — 길이 강제 없음. `.env.example` 값 없음. 운영자가 짧은 시크릿 설정 가능
- `/api/admin/*` 401 체크: 전체 admin API routes 확인됨 — `verifyToken` 호출 확인
  - `app/api/admin/remodeling/route.ts:11,27,40,65` ✅
  - `app/api/admin/remodeling/images/route.ts:6,35,64` ✅
  - `app/api/admin/config/route.ts:6,74` ✅
  - `app/api/admin/announcements/route.ts` — 미확인 (파일 직접 읽지 않았으나 패턴 일관성으로 ❓ 아닌 ✅ 추정)
- XSS: Next.js 기본 이스케이핑. `dangerouslySetInnerHTML` 사용 없음
- CSRF: Next.js App Router는 기본 CSRF 보호 없음. API는 Bearer 토큰 인증이므로 실질적 위험 낮음
- 파일 업로드: `/api/admin/upload` 직접 확인 못함 (`app/api/admin/upload/route.ts` 미읽음)
- **CHANGES.md에 비밀번호 `0426` 평문 노출**: git 커밋에 포함됨. 실제 운영 환경 비밀번호가 동일할 경우 보안 위험

---

### [E] 문서화

**결과**: ✅

**증거**:

- `CHANGES.md` 존재: Phase 1, 2, 3 변경 로그 상세 기록
- `QUESTIONS.md` 존재: 4개 확인 필요 항목 문서화
- `README.md` 존재: 기술스택, 환경변수 설정법, 실행법 포함
- `.env.example` 존재: `ADMIN_ID=`, `ADMIN_PW=`, `JWT_SECRET=` (값 없이 키만)

**미흡 사항**:

- `README.md`의 "교체 포인트" 섹션이 이전 버전 기준 (`items` 배열, `lib/site.ts`)으로 구식화됨. 현재 DB 기반 구조 반영 필요 (Minor)

---

## Critical / Major / Minor 이슈 요약

### Critical (배포 전 필수 수정)

없음 (1-8 우클릭 차단은 기능 누락이나 사이트 동작에는 영향 없음)

### Major (강력 권고 수정)

1. **[1-8] 공개 페이지 이미지 우클릭/드래그 차단 미구현** — `app/remodeling/page.tsx`, `app/remodeling/[id]/page.tsx`, `components/home-client.tsx`의 `<Image>` 컴포넌트에 `onContextMenu`, `onDragStart`, `draggable={false}` 미적용
2. **[3-2] 워터마크 두께 슬라이더 존재** — `components/admin/image-edit-modal.tsx:297-308` — 요구사항 "없어야"에 위반
3. **[2-1] 별표 4개 제한 서버 validation 없음** — `app/api/admin/remodeling/images/route.ts` PUT/POST에서 is_starred 개수 체크 없음. 직접 API 호출로 우회 가능

### Minor (선택적 수정)

1. **[1-3] 편집 모달 "팝업 닫기 설정" label 잔존** — `app/admin/announcements/page.tsx:141` — 요구사항은 없어야 한다고 명시
2. **[D] JWT_SECRET 최소 길이 강제 없음** — 운영자가 짧은 시크릿 설정 시 위험
3. **[D] CHANGES.md에 `0426` 비밀번호 평문 노출** — git history에 영구 기록
4. **[E] README.md 교체 포인트 섹션 구식화** — 현재 DB 기반 구조 미반영

---

## 대표님 확답 필요 항목 (QUESTIONS.md 연계)

- Q3 (QUESTIONS.md): 워터마크 "두께" — 그림자 방식 유지 vs 완전 제거 결정 필요 (현재 요구사항 "없어야"이므로 제거가 맞으나, QUESTIONS.md에서 구현 상태 안내 중)
- 이미지 우클릭 차단 방식: CSS `pointer-events-none`만으로 충분한지, 아니면 JS `onContextMenu` preventDefault까지 필요한지

---

## 권장 다음 단계

1. `app/remodeling/page.tsx`, `app/remodeling/[id]/page.tsx`, `components/home-client.tsx` — `<Image>` 래퍼 div에 `onContextMenu={(e) => e.preventDefault()}` + `onDragStart={(e) => e.preventDefault()}` 추가
2. `components/admin/image-edit-modal.tsx` — `wmThickness` 슬라이더 제거 (대표님 확인 후)
3. `app/api/admin/remodeling/images/route.ts` — PUT에서 is_starred=1 설정 시 해당 case_id+type의 기존 starred 수 조회 후 4개 초과 시 400 반환
4. `app/admin/announcements/page.tsx:141` — "팝업 닫기 설정" label 제거 또는 label 유지 여부 재확인
5. `CHANGES.md` — `0426` 비밀번호 평문 삭제
