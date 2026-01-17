-- =============================================
-- 추가 프리 프로덕션 테이블
-- =============================================

-- 협찬 관리
CREATE TABLE IF NOT EXISTS sponsorships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- 협찬사 정보
  company_name TEXT NOT NULL,             -- 협찬사명
  contact_name TEXT,                      -- 담당자명
  contact_phone TEXT,                     -- 연락처
  contact_email TEXT,                     -- 이메일

  -- 협찬 내용
  category TEXT,                          -- 'product', 'service', 'location', 'food', 'vehicle', 'etc'
  description TEXT,                       -- 협찬 내용 설명
  value TEXT,                             -- 협찬 가치/금액

  -- 제안서
  proposal_sent_at TIMESTAMPTZ,           -- 제안서 발송일
  proposal_url TEXT,                      -- 제안서 파일 URL

  -- 상태
  status TEXT DEFAULT 'contacted',        -- 'contacted', 'negotiating', 'confirmed', 'rejected', 'completed'

  -- 계약 조건
  contract_terms TEXT,                    -- 계약 조건
  exposure_requirements TEXT,             -- 노출 조건

  notes TEXT,

  sequence INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 차량/이동 관리
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- 차량 정보
  vehicle_type TEXT NOT NULL,             -- 'car', 'van', 'truck', 'bus', 'special'
  name TEXT NOT NULL,                     -- 차량명/용도 (예: '장비차', '배우 이동차')
  plate_number TEXT,                      -- 차량 번호

  -- 렌탈 정보
  rental_company TEXT,                    -- 렌탈 업체
  rental_cost TEXT,                       -- 렌탈 비용
  rental_start DATE,                      -- 렌탈 시작일
  rental_end DATE,                        -- 렌탈 종료일

  -- 담당자
  driver_name TEXT,                       -- 운전자/로드매니저
  driver_phone TEXT,                      -- 연락처

  -- 상태
  status TEXT DEFAULT 'planned',          -- 'planned', 'reserved', 'in_use', 'returned'

  notes TEXT,

  sequence INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 촬영 스케줄 (씬 배치)
CREATE TABLE IF NOT EXISTS shooting_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- 날짜
  shoot_date DATE NOT NULL,               -- 촬영일
  day_number INTEGER,                     -- 촬영일차 (D-1, D-2...)

  -- 상태
  status TEXT DEFAULT 'planned',          -- 'planned', 'confirmed', 'completed', 'cancelled'

  -- 메모
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  UNIQUE(project_id, shoot_date)
);

-- 촬영 스케줄 - 씬 연결
CREATE TABLE IF NOT EXISTS shooting_schedule_scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES shooting_schedule(id) ON DELETE CASCADE,
  scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,

  -- 순서
  sequence INTEGER DEFAULT 0,

  -- 예상 시간
  estimated_start TIME,                   -- 예상 시작 시간
  estimated_duration INTEGER,             -- 예상 소요 시간 (분)

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(schedule_id, scene_id)
);

-- =============================================
-- 인덱스
-- =============================================
CREATE INDEX IF NOT EXISTS idx_sponsorships_project ON sponsorships(project_id);
CREATE INDEX IF NOT EXISTS idx_sponsorships_status ON sponsorships(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_project ON vehicles(project_id);
CREATE INDEX IF NOT EXISTS idx_shooting_schedule_project ON shooting_schedule(project_id);
CREATE INDEX IF NOT EXISTS idx_shooting_schedule_date ON shooting_schedule(shoot_date);
CREATE INDEX IF NOT EXISTS idx_shooting_schedule_scenes_schedule ON shooting_schedule_scenes(schedule_id);
CREATE INDEX IF NOT EXISTS idx_shooting_schedule_scenes_scene ON shooting_schedule_scenes(scene_id);

-- =============================================
-- RLS (Row Level Security)
-- =============================================
ALTER TABLE sponsorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shooting_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE shooting_schedule_scenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sponsorships_org_member" ON sponsorships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE p.id = sponsorships.project_id AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "vehicles_org_member" ON vehicles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE p.id = vehicles.project_id AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "shooting_schedule_org_member" ON shooting_schedule
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE p.id = shooting_schedule.project_id AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "shooting_schedule_scenes_org_member" ON shooting_schedule_scenes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM shooting_schedule ss
      JOIN projects p ON p.id = ss.project_id
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE ss.id = shooting_schedule_scenes.schedule_id AND om.user_id = auth.uid()
    )
  );

-- =============================================
-- Updated At 트리거
-- =============================================
CREATE TRIGGER update_sponsorships_updated_at BEFORE UPDATE ON sponsorships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shooting_schedule_updated_at BEFORE UPDATE ON shooting_schedule FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
