ALTER TABLE case_images ADD COLUMN slot_position INTEGER NOT NULL DEFAULT 0;

UPDATE case_images
SET slot_position = (
  SELECT COUNT(*)
  FROM case_images AS b
  WHERE b.case_id = case_images.case_id
    AND b.type = case_images.type
    AND b.is_starred = 1
    AND (b.match_order < case_images.match_order OR (b.match_order = case_images.match_order AND b.id < case_images.id))
) + 1
WHERE is_starred = 1
  AND (
    SELECT COUNT(*)
    FROM case_images AS b
    WHERE b.case_id = case_images.case_id
      AND b.type = case_images.type
      AND b.is_starred = 1
      AND (b.match_order < case_images.match_order OR (b.match_order = case_images.match_order AND b.id < case_images.id))
  ) < 4;

CREATE UNIQUE INDEX IF NOT EXISTS idx_slot_unique
  ON case_images(case_id, type, slot_position)
  WHERE slot_position > 0;
