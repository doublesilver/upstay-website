UPDATE remodeling_cases SET show_on_main = 0
WHERE id NOT IN (
  SELECT MAX(id) FROM remodeling_cases
  WHERE show_on_main IN (1, 2, 3)
  GROUP BY show_on_main
)
AND show_on_main IN (1, 2, 3);

CREATE UNIQUE INDEX IF NOT EXISTS idx_show_on_main_slot
ON remodeling_cases(show_on_main)
WHERE show_on_main > 0;
