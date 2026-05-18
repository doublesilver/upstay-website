-- case_images에 edit_settings JSON 컬럼 추가
-- 사진 편집 슬라이더 보정값(선명도, 밝기, 워터마크 위치/투명도 등) 영속화.
-- 기존엔 localStorage에만 저장돼 디바이스/브라우저 변경 시 슬라이더 값이 초기화되어 보였음.
-- NULL = 보정값을 한 번도 설정한 적 없는 상태.
ALTER TABLE case_images ADD COLUMN edit_settings TEXT;
