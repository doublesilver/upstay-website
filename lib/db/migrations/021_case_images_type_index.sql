-- case_images(case_id, type, match_order) 일반 복합 인덱스.
-- 기존 인덱스는 partial(is_starred=1, slot_position>0) 전용이라
-- 일반 SELECT/UPDATE에서 full scan 발생. 케이스 수 증가 시 회귀 방지.
CREATE INDEX IF NOT EXISTS idx_case_images_case_type_order
  ON case_images(case_id ASC, type ASC, match_order ASC);
