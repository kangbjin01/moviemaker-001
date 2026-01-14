-- 프로젝트 공유 링크 기능을 위한 마이그레이션

-- projects 테이블에 공유 토큰 컬럼 추가
ALTER TABLE projects ADD COLUMN IF NOT EXISTS share_token UUID;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS share_enabled BOOLEAN DEFAULT false;

-- 인덱스 추가 (토큰으로 빠른 조회)
CREATE INDEX IF NOT EXISTS idx_projects_share_token ON projects(share_token) WHERE share_token IS NOT NULL;

-- 공유 토큰으로 프로젝트 조회하는 함수 (RLS 우회용)
CREATE OR REPLACE FUNCTION get_shared_project(p_share_token UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  organization_id UUID
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.name, p.slug, p.organization_id
  FROM projects p
  WHERE p.share_token = p_share_token
    AND p.share_enabled = true;
END;
$$ LANGUAGE plpgsql;

-- 공유된 프로젝트의 파일 목록 조회 함수 (RLS 우회용)
CREATE OR REPLACE FUNCTION get_shared_project_files(p_share_token UUID)
RETURNS TABLE (
  id UUID,
  original_name TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  department TEXT,
  doc_type TEXT,
  storage_path TEXT,
  created_at TIMESTAMPTZ
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pf.id,
    pf.original_name,
    pf.mime_type,
    pf.size_bytes,
    pf.department,
    pf.doc_type,
    pf.storage_path,
    pf.created_at
  FROM project_files pf
  JOIN projects p ON p.id = pf.project_id
  WHERE p.share_token = p_share_token
    AND p.share_enabled = true
    AND pf.deleted_at IS NULL
  ORDER BY pf.created_at DESC;
END;
$$ LANGUAGE plpgsql;
