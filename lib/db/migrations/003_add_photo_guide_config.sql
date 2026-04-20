-- rollback:
-- DELETE FROM site_config WHERE key IN (
--   'photo_guide_title',
--   'photo_guide_caption',
--   'photo_guide_style',
--   'photo_guide_visible'
-- );

INSERT OR IGNORE INTO site_config (key, value) VALUES ('photo_guide_title', '리모델링 사례보기');
INSERT OR IGNORE INTO site_config (key, value) VALUES ('photo_guide_caption', 'Before → After');
INSERT OR IGNORE INTO site_config (key, value) VALUES ('photo_guide_style', '{}');
INSERT OR IGNORE INTO site_config (key, value) VALUES ('photo_guide_visible', '1');
