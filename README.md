# UPSTAY Website

업스테이(UPSTAY) 모바일 우선 마케팅 MVP 사이트입니다.

## 기술 스택

- Next.js 15 (App Router, TypeScript)
- Tailwind CSS v4
- Pretendard (CDN)
- better-sqlite3 (로컬 데이터베이스)
- sharp (이미지 처리)
- jose (JWT 토큰)

## 페이지 구성

- `/` — 메인 (히어로 + 리모델링 / 건물관리 / 임대관리 메뉴 카드)
- `/remodeling` — Before / After 전후 비교
- `/building-management` — 건물관리 항목
- `/rental-management` — 임대관리 항목
- `/admin` — 관리자 로그인
- `/admin/remodeling` — 관리자 사진등록 (인증 필요)
- `/admin/announcements` — 관리자 팝업창 (인증 필요)
- `/admin/config` — 관리자 메인창 (인증 필요)

## 설치 및 실행

### 환경변수 설정

```bash
cp .env.example .env.local
```

`.env.local`에 아래 필수 키를 설정합니다.

```env
# 필수
ADMIN_ID=admin
ADMIN_PW=0426
JWT_SECRET=your-32-character-secret-key-here

# 선택 (기본값 제공)
DATA_DIR=./data
SEED_DEMO=1
```

**주의:** `ADMIN_PW=0426`은 약한 비밀번호입니다. 프로덕션에서는 강한 비밀번호 (최소 12자, 영문 대문자+소문자+숫자+특수문자)를 사용하세요.

**JWT_SECRET 생성:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 설치 및 개발 서버

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`에 접속합니다.

## 빌드 및 배포

### 로컬 빌드

```bash
npm run build
npm start
```

### Railway 배포

1. **Git 푸시:**

   ```bash
   git push origin main
   ```

2. **Railway 설정:**
   - [Railway](https://railway.app)에서 프로젝트 생성
   - GitHub 저장소 연결 (자동 배포)
   - **Environment Variables** 설정:
     - `ADMIN_ID`
     - `ADMIN_PW`
     - `JWT_SECRET` (32자 이상, 무작위)
   - **Volume 마운트**: `/app/data` (SQLite DB + 업로드 이미지 저장소)

3. **배포 완료:**
   Railway가 자동으로 빌드 후 배포합니다.

## 보안 가이드

### 인증 및 세션

- **HttpOnly 쿠키** 기반 JWT 인증
- JWT 만료 시간: **8시간**
- 로그아웃 시 쿠키 자동 삭제

### Rate Limiting

- API 엔드포인트에 middleware rate limit 적용
- 제한: **10회/15분** (IP 기준)

### HTTP 보안 헤더

- `Content-Security-Policy` (CSP): 인라인 스크립트 차단
- `X-Frame-Options: DENY`: 클릭재킹 방지
- `X-Content-Type-Options: nosniff`: MIME 스니핑 방지

### 암호 정책

현재 기본 비밀번호 `0426`은 **약한 비밀번호**입니다. 프로덕션 배포 시:

- 최소 12자 이상
- 영문 대문자, 소문자, 숫자, 특수문자 포함
- 정기적 변경 (분기)

## 데이터베이스 및 마이그레이션

### 마이그레이션 파일 구조

```
lib/db/migrations/
├── 001_add_star_field.sql
├── 002_add_category4_and_visibility.sql
├── 003_add_photo_guide_config.sql
├── 004_add_dismiss_duration.sql
├── 005_split_category4_style.sql
├── 006_show_on_main_unique.sql
└── 007_starred_partial_index.sql
```

각 마이그레이션 파일은:

- 번호순으로 순차 실행 (멱등성 보장)
- `IF NOT EXISTS` 또는 `IF NOT TABLE` 조건 포함
- 트랜잭션 안전

### 마이그레이션 자동 적용

앱 시작 시 마이그레이션이 자동으로 실행됩니다 (`lib/db/init.ts`).

### 새 마이그레이션 추가

1. `lib/db/migrations/008_feature_name.sql` 파일 생성
2. SQL 작성 (멱등성 확인):
   ```sql
   CREATE TABLE IF NOT EXISTS new_table (
     id INTEGER PRIMARY KEY,
     ...
   );
   ```
3. 앱 재시작하면 자동 적용

## 테스트

```bash
npm test        # 단발 실행
npm run test:watch  # 감시 모드
```

총 **30 tests / 9 test files** 통과 중:

- 사진 순서 변경 2단계 UPDATE 패턴 (UNIQUE 제약 회피)
- 별표 4개 서버 제한 로직 (라우트 핸들러 호출 포함)
- 메인 노출 필터 (별표·이미지 존재 조건)
- `/api/uploads` path traversal 차단
- `/api/admin/upload` magic number 검증
- `verifyToken` 만료·조작·Bearer/쿠키 검증
- reorder 트랜잭션 원자성
- 마이그레이션 멱등성 + 인덱스 존재 검증

## 백업

### 수동 백업

Railway Volume의 `/app/data` (SQLite DB + 업로드 이미지)를 로컬로 내려받습니다.

```bash
npm run backup
# 기본 저장 위치: ~/upstay-backups/upstay-YYYYMMDD-HHMMSS.tar.gz
# 환경변수로 경로 변경: UPSTAY_BACKUP_DIR=/path npm run backup
# 기본 14개 유지, 오래된 것은 자동 삭제
```

### 자동 백업 (macOS launchd)

매일 03:00에 자동 실행 설정:

```bash
cp scripts/com.upstay.backup.plist.example ~/Library/LaunchAgents/com.upstay.backup.plist
sed -i '' "s|USER_HOME|$HOME|g; s|PROJECT_PATH|$(pwd)|g" ~/Library/LaunchAgents/com.upstay.backup.plist
launchctl load ~/Library/LaunchAgents/com.upstay.backup.plist
```

해제:

```bash
launchctl unload ~/Library/LaunchAgents/com.upstay.backup.plist
```

### 백업 복원

```bash
tar xzf ~/upstay-backups/upstay-YYYYMMDD-HHMMSS.tar.gz
# data/ 디렉토리가 추출됨.
# Railway에 업로드 필요 시: railway ssh로 역전송
```

## 교체 포인트

### 카카오톡 / 연락처

`lib/site.ts`의 `KAKAO_URL` 값을 실제 채널 URL로 수정합니다.

```typescript
// lib/site.ts
export const KAKAO_URL = "https://open.kakao.com/o/...";
```

### 사업자 정보

`lib/site.ts`의 `companyInfo` 값을 수정합니다.

```typescript
export const companyInfo = {
  name: "회사명",
  phone: "02-xxxx-xxxx",
  address: "주소",
};
```

### Before / After 이미지

`app/remodeling/page.tsx`의 `items` 배열에서 이미지 URL을 교체합니다.

```typescript
// app/remodeling/page.tsx
const items = [
  {
    id: 1,
    category: "리모델링",
    before: "/public/before-1.jpg", // 또는 외부 URL
    after: "/public/after-1.jpg",
  },
  // ...
];
```

### 로고·워터마크 이미지 교체

클라이언트가 전달한 Adobe Illustrator (AI) 파일을 아래 경로에 SVG로 덮어씁니다. 즉시 반영됩니다.

- **`public/logo.svg`** — 헤더·관리자 로그인 화면 로고
- **`public/watermark.svg`** — 사진 편집 모달에서 적용되는 워터마크

#### AI → SVG 변환 방법

Adobe Illustrator에서:

1. `File → Export → Export As...`
2. 포맷 선택: `SVG (svg)`
3. 저장

또는 `File → Export → Export for Screens...`로 배율/포맷을 지정해 내보낼 수 있습니다.

SVG로 교체하면 관리자 페이지 `메인창 → 헤더 로고` 섹션에서:

- 노출 토글
- 가로 크기 조정
- 세로 오프셋 조정

을 세밀하게 할 수 있습니다.

## 구조

```
upstay-website/
├── app/                       # Next.js App Router
│   ├── (main)/               # 공개 페이지
│   ├── admin/                # 관리자 페이지
│   └── api/                  # API 라우트
├── lib/
│   ├── db/                   # SQLite 초기화 및 마이그레이션
│   ├── auth.ts              # JWT 인증 로직
│   └── site.ts              # 사이트 설정 (카카오톡, 사업자정보)
├── public/                   # 정적 자산
│   ├── logo.svg             # 헤더·로그인 로고
│   └── watermark.svg        # 사진 워터마크
├── scripts/                  # 유틸 스크립트 (백업)
├── tests/                    # Vitest 단위 테스트
├── .env.example             # 환경변수 템플릿
├── package.json
└── README.md
```

## 환경 요구사항

- Node.js 20 이상
- npm 10 이상
- SQLite 3 (better-sqlite3 포함)

## 라이선스

프라이빗 프로젝트 (비공개)
