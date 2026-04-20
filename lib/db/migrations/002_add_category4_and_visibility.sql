-- rollback:
-- DELETE FROM site_config WHERE key IN (
--   'service_category4_title',
--   'service_category4_desc',
--   'service_category4_caption',
--   'service_category4_style',
--   'service_remodeling_visible',
--   'service_building_visible',
--   'service_rental_visible',
--   'service_category4_visible'
-- );

INSERT OR IGNORE INTO site_config (key, value) VALUES ('service_category4_title', '');
INSERT OR IGNORE INTO site_config (key, value) VALUES ('service_category4_desc', '');
INSERT OR IGNORE INTO site_config (key, value) VALUES ('service_category4_caption', '');
INSERT OR IGNORE INTO site_config (key, value) VALUES ('service_category4_style', '{}');
INSERT OR IGNORE INTO site_config (key, value) VALUES ('service_remodeling_visible', '1');
INSERT OR IGNORE INTO site_config (key, value) VALUES ('service_building_visible', '1');
INSERT OR IGNORE INTO site_config (key, value) VALUES ('service_rental_visible', '1');
INSERT OR IGNORE INTO site_config (key, value) VALUES ('service_category4_visible', '1');
