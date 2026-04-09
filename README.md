# upstay website

업스테이의 모바일 우선 소개형 홈페이지 MVP입니다.  
리모델링, 건물관리, 임대관리 서비스를 짧고 정돈된 구조로 보여주며, `"/"` 메인 페이지와 `"/remodeling"` 상세 페이지로 구성되어 있습니다.

## 프로젝트 개요

- Next.js App Router 기반의 TypeScript 프로젝트
- Tailwind CSS를 사용한 모바일 우선 UI
- 짧은 스크롤 안에서 핵심 서비스가 보이도록 설계
- 카카오톡 문의 링크를 환경변수로 분리
- Vercel 배포 기준으로 바로 연결 가능한 구조

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속합니다.

## 환경변수 설정

프로젝트 루트에 `.env.local` 파일을 만들고 아래 값을 넣습니다.

```env
NEXT_PUBLIC_KAKAO_URL=https://open.kakao.com/...
```

값이 없으면 앱은 정상 동작하며, `카카오톡 문의` 버튼은 비활성 상태로 보입니다.

## 카카오톡 링크 변경 방법

- `.env.local`의 `NEXT_PUBLIC_KAKAO_URL` 값을 변경합니다.
- Vercel에서는 Project Settings > Environment Variables에서 같은 키를 등록합니다.

## Vercel 배포 방법

```bash
npm run build
```

1. Git 저장소에 프로젝트를 푸시합니다.
2. Vercel에서 저장소를 Import 합니다.
3. Environment Variables에 `NEXT_PUBLIC_KAKAO_URL`을 등록합니다.
4. Deploy를 실행합니다.

## 추후 이미지/문구 교체 포인트

- 리모델링 전후 콘텐츠: `lib/content.ts`
- 사이트 기본 정보와 메뉴: `lib/site.ts`
- 공통 헤더: `components/header.tsx`
- 카카오톡 버튼 동작: `components/kakao-button.tsx`
- Before / After 프레임: `components/before-after-card.tsx`
- 페이지 문구:
  - 메인 페이지: `app/page.tsx`
  - 리모델링 상세 페이지: `app/remodeling/page.tsx`

## 파일 구조

```text
app/
components/
lib/
public/
README.md
```
