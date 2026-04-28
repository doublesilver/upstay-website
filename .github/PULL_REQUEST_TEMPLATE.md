## 작업 영역 (Zone)

영향받는 Zone에 체크 (다중 선택 가능, [WORK_ZONES.md](../WORK_ZONES.md) 참고):

- [ ] Zone 1: 메인페이지 (사용자)
- [ ] Zone 2: 사례 리스트 (사용자)
- [ ] Zone 3: 사례 상세 (사용자)
- [ ] Zone 4: 라이트박스 / 사진 확대 모달
- [ ] Zone 5: 관리자 - 사례 (사진등록)
- [ ] Zone 6: 관리자 - 팝업창
- [ ] Zone 7: 관리자 - 메인창
- [ ] 공용 모듈 (lib/, components/header, footer 등)

## 변경사항 요약

(어떤 요구사항을 어떻게 반영했는지 1~3줄)

## 변경 파일

(주요 변경 파일 + 라인)

## DB 마이그레이션

- [ ] 마이그레이션 파일 추가 (`lib/db/migrations/NNN_*.sql`)
- [ ] 추가 안 함

## 검증 체크리스트

### 기능 검증

- [ ] 의도한 변경이 정상 동작
- [ ] 영향받는 Zone의 다른 기능 회귀 없음
- [ ] 의존 Zone (예: Zone 5 변경 시 Zone 1/2/3) 회귀 없음

### 화면 검증

- [ ] PC (1280px+) 정상
- [ ] 모바일 (375px) 정상
- [ ] iOS Safari 실기기 (해당 시)

### 빌드/타입

- [ ] `npm run build` 성공
- [ ] `npx tsc --noEmit` 무에러
- [ ] `npm run lint` 무에러

## 스크린샷

(변경 전/후)
