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

## 교체 포인트

- 카카오톡 링크: `lib/site.ts`의 `KAKAO_URL` 값을 실제 채널 URL로 수정합니다.
- 사업자 정보: `lib/site.ts`의 `companyInfo` 값을 수정합니다.
- Before / After 이미지: `app/remodeling/page.tsx`의 `items` 배열에서 `placehold.co` URL을 실제 이미지 경로(`/public/...` 또는 외부 URL)로 교체합니다.
