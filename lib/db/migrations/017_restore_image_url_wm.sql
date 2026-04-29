-- 워터마크 시스템 재활성화 (016에서 폐기 후 다시 사용 결정)
-- 클라이언트가 워터마크 사용 의사 확정 → DB 컬럼 복원
-- 멱등성: 016에서 DROP 안 된 환경(production volume)에서는 duplicate column 가드로 skip

ALTER TABLE case_images ADD COLUMN image_url_wm TEXT NOT NULL DEFAULT '';
