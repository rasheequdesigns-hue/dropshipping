-- ============================================================
--  007_investor_view_count.sql
--  Add view_count to investor_access table
-- ============================================================

ALTER TABLE investor_access ADD COLUMN IF NOT EXISTS view_count int DEFAULT 0;
