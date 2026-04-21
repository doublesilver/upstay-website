CREATE INDEX IF NOT EXISTS idx_case_images_starred
  ON case_images(case_id, type, match_order)
  WHERE is_starred = 1;
