-- category5 스타일 키 추가 + category4 기존 style 값을 title/desc style로 복제
INSERT OR IGNORE INTO site_config (key, value) VALUES
  ('service_category5_title_style', '{}'),
  ('service_category5_desc_style', '{}'),
  ('service_category5_caption_style', '{}');

-- category4_style 기존 값을 title/desc style로 복제 (이미 기본값이 아닌 경우만)
UPDATE site_config
SET value = (SELECT value FROM site_config WHERE key = 'service_category4_style')
WHERE key = 'service_category4_title_style'
  AND (SELECT value FROM site_config WHERE key = 'service_category4_title_style') = '{}'
  AND (SELECT value FROM site_config WHERE key = 'service_category4_style') != '{}';

UPDATE site_config
SET value = (SELECT value FROM site_config WHERE key = 'service_category4_style')
WHERE key = 'service_category4_desc_style'
  AND (SELECT value FROM site_config WHERE key = 'service_category4_desc_style') = '{}'
  AND (SELECT value FROM site_config WHERE key = 'service_category4_style') != '{}';
