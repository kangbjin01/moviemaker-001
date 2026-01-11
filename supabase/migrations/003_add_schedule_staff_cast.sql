-- =============================================
-- Add Schedule, Staff, Equipment, Cast tables
-- Run this in Supabase SQL Editor
-- =============================================

-- =============================================
-- PROJECT PEOPLE (프로젝트 인원 마스터)
-- 프로젝트별로 스태프/배우 정보를 관리
-- =============================================
CREATE TABLE IF NOT EXISTS project_people (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT, -- 역할 (연출, 조연출, 촬영감독, 배우 등)
  department TEXT, -- 부서 (연출부, 촬영부, 조명부, 미술부, 제작부, 캐스트 등)
  phone TEXT,
  email TEXT,
  notes TEXT,
  is_cast BOOLEAN DEFAULT FALSE, -- 배우 여부
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- =============================================
-- SHOOTING DAY SCHEDULE (전체일정)
-- =============================================
CREATE TABLE IF NOT EXISTS shooting_day_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shooting_day_id UUID REFERENCES shooting_days(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  time TEXT, -- 시간 (예: "6:00", "9:00 AM")
  title TEXT NOT NULL, -- 일정명
  description TEXT, -- 내용
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- =============================================
-- SHOOTING DAY STAFF (스태프 리스트)
-- =============================================
CREATE TABLE IF NOT EXISTS shooting_day_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shooting_day_id UUID REFERENCES shooting_days(id) ON DELETE CASCADE,
  person_id UUID REFERENCES project_people(id), -- 프로젝트 인원에서 불러오기
  role TEXT NOT NULL, -- 역할 (연출, 조연출 등)
  name TEXT NOT NULL,
  phone TEXT,
  sequence INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- =============================================
-- SHOOTING DAY EQUIPMENT (장비 리스트)
-- 부서별 장비 목록
-- =============================================
CREATE TABLE IF NOT EXISTS shooting_day_equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shooting_day_id UUID REFERENCES shooting_days(id) ON DELETE CASCADE,
  department TEXT NOT NULL, -- 부서 (연출, 조연출, 촬영, 조명, 음향, 미술, 의상, 제작, 기타)
  content TEXT, -- 장비/물품 내용
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- =============================================
-- SHOOTING DAY CAST (캐스트 콜시트)
-- =============================================
CREATE TABLE IF NOT EXISTS shooting_day_cast (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shooting_day_id UUID REFERENCES shooting_days(id) ON DELETE CASCADE,
  person_id UUID REFERENCES project_people(id), -- 프로젝트 인원에서 불러오기
  character_name TEXT NOT NULL, -- 배역
  actor_name TEXT NOT NULL, -- 연기자
  call_time TEXT, -- 집합시간
  call_location TEXT, -- 집합위치
  scenes TEXT, -- 등장씬
  costume_props TEXT, -- 의상/소품
  phone TEXT,
  sequence INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_project_people_project ON project_people(project_id);
CREATE INDEX IF NOT EXISTS idx_shooting_day_schedules_day ON shooting_day_schedules(shooting_day_id);
CREATE INDEX IF NOT EXISTS idx_shooting_day_staff_day ON shooting_day_staff(shooting_day_id);
CREATE INDEX IF NOT EXISTS idx_shooting_day_equipment_day ON shooting_day_equipment(shooting_day_id);
CREATE INDEX IF NOT EXISTS idx_shooting_day_cast_day ON shooting_day_cast(shooting_day_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE project_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE shooting_day_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE shooting_day_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE shooting_day_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE shooting_day_cast ENABLE ROW LEVEL SECURITY;

-- Project People: 프로젝트 멤버만 접근
CREATE POLICY "Project members can manage people" ON project_people FOR ALL
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN organization_members om ON om.organization_id = p.organization_id
    WHERE om.user_id = auth.uid()
  ));

-- Shooting Day Schedules
CREATE POLICY "Project members can manage schedules" ON shooting_day_schedules FOR ALL
  USING (shooting_day_id IN (
    SELECT sd.id FROM shooting_days sd
    JOIN projects p ON p.id = sd.project_id
    JOIN organization_members om ON om.organization_id = p.organization_id
    WHERE om.user_id = auth.uid()
  ));

-- Shooting Day Staff
CREATE POLICY "Project members can manage staff" ON shooting_day_staff FOR ALL
  USING (shooting_day_id IN (
    SELECT sd.id FROM shooting_days sd
    JOIN projects p ON p.id = sd.project_id
    JOIN organization_members om ON om.organization_id = p.organization_id
    WHERE om.user_id = auth.uid()
  ));

-- Shooting Day Equipment
CREATE POLICY "Project members can manage equipment" ON shooting_day_equipment FOR ALL
  USING (shooting_day_id IN (
    SELECT sd.id FROM shooting_days sd
    JOIN projects p ON p.id = sd.project_id
    JOIN organization_members om ON om.organization_id = p.organization_id
    WHERE om.user_id = auth.uid()
  ));

-- Shooting Day Cast
CREATE POLICY "Project members can manage cast" ON shooting_day_cast FOR ALL
  USING (shooting_day_id IN (
    SELECT sd.id FROM shooting_days sd
    JOIN projects p ON p.id = sd.project_id
    JOIN organization_members om ON om.organization_id = p.organization_id
    WHERE om.user_id = auth.uid()
  ));

-- =============================================
-- TRIGGERS
-- =============================================
CREATE TRIGGER update_project_people_updated_at BEFORE UPDATE ON project_people FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_shooting_day_schedules_updated_at BEFORE UPDATE ON shooting_day_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_shooting_day_staff_updated_at BEFORE UPDATE ON shooting_day_staff FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_shooting_day_equipment_updated_at BEFORE UPDATE ON shooting_day_equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_shooting_day_cast_updated_at BEFORE UPDATE ON shooting_day_cast FOR EACH ROW EXECUTE FUNCTION update_updated_at();
