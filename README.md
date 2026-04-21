# UPSTAY Website

업스테이(UPSTAY) 모바일 우선 마케팅 MVP 사이트입니다.

## 기술 스택

- Next.js 15 (App Router, TypeScript)
- Tailwind CSS v4
- Pretendard (CDN)

## 페이지 구성

- `/` — 메인 (히어로 + 리모델링 / 건물관리 / 임대관리 메뉴 카드)
- `/remodeling` — Before / After 전후 비교
- `/building-management` — 건물관리 항목
- `/rental-management` — 임대관리 항목

## 실행

## 환경변수 설정

```bash
cp .env.example .env.local
```

`.env.local`에 아래 키를 설정한 뒤 실행합니다.

```env
ADMIN_ID=
ADMIN_PW=
JWT_SECRET=
```

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`에 접속합니다.

## 빌드

```bash
npm run build
```

## Vercel 배포

```bash
vercel deploy
```

1. Git 저장소에 푸시합니다.
2. Vercel에서 Import 합니다.
3. Deploy 합니다.

## 테스트

```bash
npm test        # 단발 실행
npm run test:watch
```

`tests/` 디렉토리에 있는 Vitest 단위 테스트를 실행합니다. 현재 커버 범위:

- 사진 순서 변경 2단계 UPDATE 패턴 (UNIQUE 제약 회피)
- 별표 4개 서버 제한 로직
- 메인 노출 필터 (별표·이미지 존재 조건)

## 백업

Railway Volume의 `/app/data` (SQLite DB + 업로드 이미지)를 맥북으로 내려받습니다.

```bash
npm run backup
# 기본 저장 위치: ~/upstay-backups/upstay-YYYYMMDD-HHMMSS.tar.gz
# 환경변수로 경로 변경: UPSTAY_BACKUP_DIR=/path npm run backup
# 기본 14개 유지, 오래된 것은 자동 삭제
```

### 자동 백업 (macOS launchd)

매일 03:00 자동 실행 설정:

```bash
cp scripts/com.upstay.backup.plist.example ~/Library/LaunchAgents/com.upstay.backup.plist
sed -i '' "s|USER_HOME|$HOME|g; s|PROJECT_PATH|$(pwd)|g" ~/Library/LaunchAgents/com.upstay.backup.plist
launchctl load ~/Library/LaunchAgents/com.upstay.backup.plist
```

해제: `launchctl unload ~/Library/LaunchAgents/com.upstay.backup.plist`

### 백업 복원

```bash
tar xzf ~/upstay-backups/upstay-YYYYMMDD-HHMMSS.tar.gz
# data/ 디렉토리가 추출됨. Railway Volume에 업로드 필요 시 railway ssh로 역전송.
```

## 교체 포인트

- 카카오톡 링크: `lib/site.ts`의 `KAKAO_URL` 값을 실제 채널 URL로 수정합니다.
- 사업자 정보: `lib/site.ts`의 `companyInfo` 값을 수정합니다.
- Before / After 이미지: `app/remodeling/page.tsx`의 `items` 배열에서 `placehold.co` URL을 실제 이미지 경로(`/public/...` 또는 외부 URL)로 교체합니다.

### 로고·워터마크 이미지 교체

클라이언트가 전달한 Adobe Illustrator (AI) 파일을 아래 경로에 SVG로 덮어쓰면 즉시 반영됩니다.

- `public/logo.svg` — 헤더·관리자 로그인 화면 로고
- `public/watermark.svg` — 사진 편집 모달에서 적용되는 워터마크

#### AI → SVG 변환 방법

Adobe Illustrator에서 `File → Export → Export As...` → 포맷 `SVG (svg)` 선택 → 저장.
또는 `File → Export → Export for Screens...` 로 배율/포맷을 지정해 내보낼 수도 있습니다.

SVG로 교체하면 관리자 페이지 `메인창 → 헤더 로고` 섹션에서 노출 토글·가로 크기·세로 오프셋을 세밀하게 조정할 수 있습니다.
