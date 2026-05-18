-- remodeling_cases에 is_draft 컬럼 추가
-- 박스의 3단계 상태(새박스 → 메인 → 그 외) 중 "새박스" 상태를 표현.
-- 1 = 새박스(최상단), 0 = 저장됨(메인 또는 그 외)
-- 기존 데이터는 모두 0(그 외)으로 시작 — 정상 운영 데이터는 이미 저장된 상태로 간주.
ALTER TABLE remodeling_cases ADD COLUMN is_draft INTEGER NOT NULL DEFAULT 0;
