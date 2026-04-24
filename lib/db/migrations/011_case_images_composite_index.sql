CREATE INDEX IF NOT EXISTS idx_case_images_case_slot
  ON case_images(case_id, slot_position)
  WHERE slot_position > 0;
