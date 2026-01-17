-- =============================================
-- 프리 프로덕션 테이블
-- =============================================

-- 시나리오 (대본)
CREATE TABLE IF NOT EXISTS scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  title TEXT NOT NULL,                    -- 시나리오 제목
  version TEXT DEFAULT '1.0',             -- 버전 (예: '1.0', '2차 수정')
  content TEXT,                           -- 시나리오 본문 (마크다운/텍스트)

  -- 메타 정보
  writer TEXT,                            -- 작가
  genre TEXT,                             -- 장르
  logline TEXT,                           -- 로그라인 (한 줄 요약)
  synopsis TEXT,                          -- 시놉시스

  -- 파일 (선택적)
  file_url TEXT,                          -- 업로드된 파일 URL
  file_name TEXT,                         -- 원본 파일명

  -- 상태
  status TEXT DEFAULT 'draft',            -- 'draft', 'review', 'approved', 'locked'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 콘티/샷 리스트 (씬별 샷 구성)
CREATE TABLE IF NOT EXISTS shots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE,

  shot_number TEXT NOT NULL,              -- 샷 번호 (예: '1', '2A')
  shot_type TEXT,                         -- 샷 타입: 'WS', 'MS', 'CU', 'ECU', 'OTS' 등
  shot_size TEXT,                         -- 샷 사이즈 상세
  camera_movement TEXT,                   -- 카메라 무브: 'FIX', 'PAN', 'TILT', 'DOLLY', 'CRANE' 등
  camera_angle TEXT,                      -- 카메라 앵글: 'EYE', 'HIGH', 'LOW', 'DUTCH' 등

  description TEXT,                       -- 샷 설명
  dialogue TEXT,                          -- 대사
  action TEXT,                            -- 액션/동작

  -- 콘티 이미지
  storyboard_url TEXT,                    -- 콘티 이미지 URL
  reference_url TEXT,                     -- 레퍼런스 이미지 URL

  duration_seconds INTEGER,               -- 예상 길이 (초)

  sequence INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 장비 리스트
CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  category TEXT NOT NULL,                 -- 'camera', 'lens', 'lighting', 'grip', 'sound', 'etc'
  name TEXT NOT NULL,                     -- 장비명
  quantity INTEGER DEFAULT 1,             -- 수량

  -- 상세
  specification TEXT,                     -- 스펙/모델명
  rental_company TEXT,                    -- 렌탈 업체
  rental_cost TEXT,                       -- 렌탈 비용

  -- 담당
  department TEXT,                        -- 담당 부서: '촬영', '조명', '음향' 등
  responsible_person TEXT,                -- 담당자

  -- 상태
  status TEXT DEFAULT 'planned',          -- 'planned', 'reserved', 'rented', 'returned'

  notes TEXT,

  sequence INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 소품
CREATE TABLE IF NOT EXISTS props (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scene_id UUID REFERENCES scenes(id) ON DELETE SET NULL,

  name TEXT NOT NULL,                     -- 소품명
  description TEXT,                       -- 설명
  quantity INTEGER DEFAULT 1,             -- 수량

  -- 조달 방법
  source TEXT DEFAULT 'purchase',         -- 'purchase', 'rental', 'make', 'borrow', 'sponsorship'
  cost TEXT,                              -- 비용
  supplier TEXT,                          -- 공급처

  -- 상태
  status TEXT DEFAULT 'needed',           -- 'needed', 'acquired', 'ready'

  -- 이미지
  image_url TEXT,
  reference_url TEXT,

  notes TEXT,

  sequence INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 의상
CREATE TABLE IF NOT EXISTS wardrobe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
  scene_id UUID REFERENCES scenes(id) ON DELETE SET NULL,

  name TEXT NOT NULL,                     -- 의상명
  description TEXT,                       -- 설명

  -- 조달 방법
  source TEXT DEFAULT 'purchase',         -- 'purchase', 'rental', 'make', 'borrow', 'sponsorship'
  cost TEXT,                              -- 비용
  supplier TEXT,                          -- 공급처

  -- 상태
  status TEXT DEFAULT 'needed',           -- 'needed', 'acquired', 'fitted', 'ready'

  -- 사이즈
  size TEXT,

  -- 이미지
  image_url TEXT,
  reference_url TEXT,

  notes TEXT,

  sequence INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- =============================================
-- 인덱스
-- =============================================
CREATE INDEX IF NOT EXISTS idx_scenarios_project ON scenarios(project_id);
CREATE INDEX IF NOT EXISTS idx_shots_project ON shots(project_id);
CREATE INDEX IF NOT EXISTS idx_shots_scene ON shots(scene_id);
CREATE INDEX IF NOT EXISTS idx_equipment_project ON equipment(project_id);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category);
CREATE INDEX IF NOT EXISTS idx_props_project ON props(project_id);
CREATE INDEX IF NOT EXISTS idx_props_scene ON props(scene_id);
CREATE INDEX IF NOT EXISTS idx_wardrobe_project ON wardrobe(project_id);
CREATE INDEX IF NOT EXISTS idx_wardrobe_character ON wardrobe(character_id);
CREATE INDEX IF NOT EXISTS idx_wardrobe_scene ON wardrobe(scene_id);

-- =============================================
-- RLS (Row Level Security)
-- =============================================
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE shots ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE props ENABLE ROW LEVEL SECURITY;
ALTER TABLE wardrobe ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scenarios_org_member" ON scenarios
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE p.id = scenarios.project_id AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "shots_org_member" ON shots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE p.id = shots.project_id AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "equipment_org_member" ON equipment
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE p.id = equipment.project_id AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "props_org_member" ON props
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE p.id = props.project_id AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "wardrobe_org_member" ON wardrobe
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE p.id = wardrobe.project_id AND om.user_id = auth.uid()
    )
  );

-- =============================================
-- Updated At 트리거
-- =============================================
CREATE TRIGGER update_scenarios_updated_at BEFORE UPDATE ON scenarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shots_updated_at BEFORE UPDATE ON shots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_props_updated_at BEFORE UPDATE ON props FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wardrobe_updated_at BEFORE UPDATE ON wardrobe FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
