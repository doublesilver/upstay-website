-- image_url_wm 컬럼 제거 (워터마크 시스템 폐기)
-- 사용자 페이지/admin 어디서도 사용 안 함 (v3.10에서 표시 비활성)
-- SQLite 3.35+ 에서 ALTER TABLE DROP COLUMN 지원

ALTER TABLE case_images DROP COLUMN image_url_wm;
