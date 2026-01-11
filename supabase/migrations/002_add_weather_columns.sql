-- =============================================
-- Add weather and location columns to shooting_days
-- Run this in Supabase SQL Editor
-- =============================================

-- 촬영장소 (직접 입력 텍스트)
ALTER TABLE shooting_days ADD COLUMN IF NOT EXISTS base_location TEXT;

-- 집합장소
ALTER TABLE shooting_days ADD COLUMN IF NOT EXISTS assembly_location TEXT;

-- 날씨 관련 컬럼들
ALTER TABLE shooting_days ADD COLUMN IF NOT EXISTS precipitation TEXT;
ALTER TABLE shooting_days ADD COLUMN IF NOT EXISTS temp_low TEXT;
ALTER TABLE shooting_days ADD COLUMN IF NOT EXISTS temp_high TEXT;

-- 기타사항
ALTER TABLE shooting_days ADD COLUMN IF NOT EXISTS notes TEXT;

-- sunrise/sunset을 TIME에서 TEXT로 변경 (한글 포맷 "5시 46분" 저장 위해)
ALTER TABLE shooting_days ALTER COLUMN sunrise TYPE TEXT;
ALTER TABLE shooting_days ALTER COLUMN sunset TYPE TEXT;
