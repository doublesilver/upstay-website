# UAT — precomputeVariants에 thumb/medium 추가 (admin 사진 엑박 해소)

일시: 2026-05-30
PR: precompute-thumb-medium

## 배경
사용자 보고: 사진 업로드는 되는데 admin 사진 엑박.
원인: precomputeVariants가 `.webp`/`.avif`만 생성, `.thumb.webp`/`.medium.webp` 미생성.
admin은 R2에서 `.thumb.webp` 요청 → 새 업로드는 R2에 thumb 없음 → 엑박.

## 자동수정
- precomputeVariants에 .thumb.webp (480px) + .medium.webp (1280px) 추가
- 4종 사본 병렬 생성 (background fire-and-forget이라 응답 지연 0)

## 검증
- [x] tsc PASS
- [x] vitest 73/73 PASS

## 결과 요약

총 시나리오: 2
통과: 2
미통과: 0

## 후속 작업
- 누락된 신규 업로드(5/30 03:14~)에 대한 백필 (OCI에서 backfill 스크립트 실행)
