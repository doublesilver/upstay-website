-- rollback:
-- SQLite에서는 컬럼 삭제가 직접 지원되지 않아 `case_images` 재생성이 필요합니다.
-- CREATE TABLE case_images_backup AS SELECT id, case_id, type, match_order, image_url, image_url_wm, created_at FROM case_images;
-- DROP TABLE case_images;
-- CREATE TABLE case_images (... is_starred 없이 재생성 ...);
-- INSERT INTO case_images (...) SELECT ... FROM case_images_backup;
-- DROP TABLE case_images_backup;

ALTER TABLE case_images ADD COLUMN is_starred INTEGER NOT NULL DEFAULT 0;

UPDATE case_images
SET is_starred = 1
WHERE match_order = 0;

WITH ranked AS (
  SELECT
    id,
    case_id,
    type,
    ROW_NUMBER() OVER (
      PARTITION BY case_id, type
      ORDER BY match_order ASC, id ASC
    ) AS rn
  FROM case_images
),
groups_without_star AS (
  SELECT case_id, type
  FROM case_images
  GROUP BY case_id, type
  HAVING SUM(is_starred) = 0
)
UPDATE case_images
SET is_starred = 1
WHERE id IN (
  SELECT ranked.id
  FROM ranked
  INNER JOIN groups_without_star
    ON groups_without_star.case_id = ranked.case_id
   AND groups_without_star.type = ranked.type
  WHERE ranked.rn <= 4
);
