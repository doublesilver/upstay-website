-- remodeling_cases.sort_order 정렬 시 SCAN + USE TEMP B-TREE 회피용 복합 인덱스.
-- 홈/관리자 페이지의 ORDER BY sort_order ASC, id ASC 쿼리를 인덱스 검색으로 전환.
CREATE INDEX IF NOT EXISTS idx_cases_sort ON remodeling_cases(sort_order ASC, id ASC);
