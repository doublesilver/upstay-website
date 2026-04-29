-- announcements 테이블의 ** 마크다운을 fontWeight 스타일로 마이그레이션
-- v3.10에서 마크다운 → fontWeight JSON 컬럼으로 전환됨
-- 기존 ** 포함 row를 자동으로 굵게 style로 변환 후 ** 제거

UPDATE announcements
SET title_style = '{"fontWeight":"bold"}'
WHERE title LIKE '%**%' AND (title_style = '{}' OR title_style = '');

UPDATE announcements
SET content_style = '{"fontWeight":"bold"}'
WHERE content LIKE '%**%' AND (content_style = '{}' OR content_style = '');

UPDATE announcements
SET title = REPLACE(title, '**', ''),
    content = REPLACE(content, '**', '');
