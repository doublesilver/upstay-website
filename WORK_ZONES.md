# UPSTAY 작업 영역 (Work Zones)

작업 시 사이드 이펙트 방지를 위해 페이지/기능 단위로 7개 영역으로 분할 관리한다.
**한 번에 하나의 영역만 변경**하고 다음 영역으로 넘어가기 전에 검증을 완료한다.

## 영역 정의

### Zone 1: 메인페이지 (사용자)

- **경로**: `/`
- **대표 파일**:
  - `app/page.tsx`
  - `components/home-client.tsx`
  - `components/service-sections.tsx`
- **데이터 소스**: `lib/home-data.ts` (`getMainCases`, `getSiteConfig`)
- **API 의존**: `/api/admin/config` (read-only via SSR)
- **검증 페이지**: 데스크탑 + 모바일

### Zone 2: 사례 리스트 (사용자)

- **경로**: `/remodeling`
- **대표 파일**: `app/remodeling/page.tsx`
- **데이터 소스**: `lib/home-data.ts` (`getAllCases`) — 별표 우선 + 일반 fallback
- **검증 페이지**: 데스크탑 + 모바일

### Zone 3: 사례 상세 (사용자)

- **경로**: `/remodeling/[id]`
- **대표 파일**:
  - `app/remodeling/[id]/page.tsx`
  - `app/remodeling/[id]/detail-gallery.tsx`
  - `app/remodeling/[id]/layout.tsx`
- **검증 페이지**: 데스크탑 + 모바일

### Zone 4: 사진 확대 모달 / 라이트박스 (사용자)

- **위치**: `app/remodeling/[id]/detail-gallery.tsx` 내부 lightbox 모달 (LightboxColumn 포함)
- **트리거**: 사례 상세 페이지 메인 사진 클릭
- **검증**: BEFORE/AFTER 두 컬럼 동시 표시 (데스크탑), 단일 표시 (모바일), 화살표/썸네일/카운트, ESC/외부클릭 닫기

### Zone 5: 관리자 - 사례 (사진등록)

- **경로**: `/admin/remodeling`
- **대표 파일**:
  - `app/admin/remodeling/page.tsx`
  - `components/admin/image-edit-modal.tsx`
- **API**: `/api/admin/remodeling/*`, `/api/admin/upload`
- **DB**: `remodeling_cases`, `case_images`

### Zone 6: 관리자 - 팝업창

- **경로**: `/admin/announcements`
- **대표 파일**: `app/admin/announcements/page.tsx`
- **API**: `/api/admin/announcements`
- **DB**: `announcements`

### Zone 7: 관리자 - 메인창

- **경로**: `/admin/config`
- **대표 파일**: `app/admin/config/page.tsx`
- **API**: `/api/admin/config`
- **DB**: `site_config` (key-value)

## 영역 간 의존 관계

```
[Zone 7: 관리자 메인창]
   ↓ (config write)
[Zone 1: 메인페이지] ← (cases read) ← [Zone 5: 관리자 사례]
                                            ↓
[Zone 2: 사례 리스트] ← ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤
       ↓                                      │
[Zone 3: 사례 상세] ← ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤
       ↓
[Zone 4: 라이트박스]

[Zone 6: 관리자 팝업창]
   ↓ (announcements write)
[Zone 1: 메인페이지의 공지 팝업]
```

## 작업 진행 규칙

1. **한 번에 하나의 Zone만 수정**
2. PR/커밋 메시지에 영향받는 Zone 명시: `feat(zone-1): ...` 또는 `fix(zone-7): ...`
3. Zone 변경 시 다른 Zone에 영향이 가는 경우 (예: Zone 5 image-edit-modal 변경 시 Zone 1/2/3에 노출되는 이미지 영향), 영향받는 Zone도 회귀 테스트
4. 대표님 확정은 Zone 단위로: "Zone 1 OK → Zone 2 진행"
5. DB 마이그레이션은 `lib/db/migrations/` 디렉토리에 SQL 파일 1개로 관리 (별도 스크립트 금지)
6. `data/upstay.db` 변경 전 백업: `cp data/upstay.db data/upstay.db.backup-{YYYY-MM-DD}`

## 공용 모듈

다음 파일은 모든 Zone에서 사용되며 변경 시 전체 회귀 테스트 필요:

- `lib/home-data.ts` — Zone 1, 2, 3 공용
- `lib/text-style.ts` — Zone 1, 7 공용 (style JSON 파싱)
- `lib/admin-api.ts` — Zone 5, 6, 7 공용 (auth/headers)
- `lib/db/index.ts` — 모든 Zone 공용 (DB 연결 + 마이그레이션 러너)
- `components/header.tsx`, `components/footer.tsx` — 공개 페이지 공용
- `components/protected-image.tsx` — Zone 1, 2, 3, 4 공용
- `middleware.ts` — admin 인증 보호
