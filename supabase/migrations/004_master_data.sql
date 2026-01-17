-- =============================================
-- 마스터 데이터 테이블 (씬, 로케이션, 캐릭터)
-- =============================================

-- 로케이션 마스터 (씬보다 먼저 생성 - 참조됨)
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- 기본 정보
  name TEXT NOT NULL,                    -- 장소명 (예: '강남 카페')
  address TEXT,                          -- 주소

  -- 지도 좌표
  latitude DECIMAL(10, 8),               -- 위도
  longitude DECIMAL(11, 8),              -- 경도

  -- 담당자 정보
  contact_name TEXT,                     -- 담당자 이름
  contact_phone TEXT,                    -- 담당자 연락처
  contact_email TEXT,                    -- 담당자 이메일

  -- 장소 상세
  rental_fee TEXT,                       -- 대관료
  parking_available BOOLEAN DEFAULT TRUE, -- 주차 가능 여부
  power_available BOOLEAN DEFAULT TRUE,   -- 전력 사용 가능 여부

  -- 사전탐방 노트
  notes TEXT,                            -- 일반 메모
  lighting_notes TEXT,                   -- 조명 관련 (해 위치, 조명 위치)
  camera_notes TEXT,                     -- 촬영 관련 (앵글 가능 여부)
  art_notes TEXT,                        -- 미술 관련 (소품 배치)
  sound_notes TEXT,                      -- 음향 관련 (주변 소음)

  -- 이미지 (JSON 배열로 R2 키 저장)
  images JSONB DEFAULT '[]'::jsonb,

  -- 메타
  sequence INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 씬 마스터
CREATE TABLE IF NOT EXISTS scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- 씬 정보
  scene_number TEXT NOT NULL,            -- 씬 번호 (예: '1', '2', '2A')
  scene_name TEXT,                       -- 씬 이름 (예: '카페 내부')

  -- 시간/장소 설정
  time_of_day TEXT,                      -- 'D' (낮), 'N' (밤), 'M' (아침), 'E' (저녁)
  location_type TEXT,                    -- 'I' (실내), 'E' (실외)
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,

  -- 씬 상세
  description TEXT,                      -- 씬 설명
  page_count DECIMAL(4,2),               -- 페이지 수 (예: 1.5)
  estimated_duration INTEGER,            -- 예상 촬영 시간 (분)

  -- 메타
  sequence INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 캐릭터 마스터
CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- 캐릭터 정보
  name TEXT NOT NULL,                    -- 캐릭터 이름 (예: '민수')
  description TEXT,                      -- 캐릭터 설명

  -- 배우 연결 (추후 project_people 테이블 생성 후 FK 추가)
  actor_id UUID,

  -- 캐릭터 타입
  character_type TEXT DEFAULT 'main',    -- 'main' (주연), 'supporting' (조연), 'minor' (단역), 'extra' (엑스트라)

  -- 메타
  sequence INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 씬-캐릭터 연결 테이블 (다대다)
CREATE TABLE IF NOT EXISTS scene_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,

  -- 메모
  notes TEXT,                            -- 해당 씬에서의 역할/메모

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 중복 방지
  UNIQUE(scene_id, character_id)
);

-- =============================================
-- 인덱스
-- =============================================
CREATE INDEX IF NOT EXISTS idx_locations_project ON locations(project_id);
CREATE INDEX IF NOT EXISTS idx_scenes_project ON scenes(project_id);
CREATE INDEX IF NOT EXISTS idx_scenes_location ON scenes(location_id);
CREATE INDEX IF NOT EXISTS idx_characters_project ON characters(project_id);
-- CREATE INDEX IF NOT EXISTS idx_characters_actor ON characters(actor_id); -- 추후 활성화
CREATE INDEX IF NOT EXISTS idx_scene_characters_scene ON scene_characters(scene_id);
CREATE INDEX IF NOT EXISTS idx_scene_characters_character ON scene_characters(character_id);

-- =============================================
-- RLS (Row Level Security)
-- =============================================
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE scene_characters ENABLE ROW LEVEL SECURITY;

-- 조직 멤버만 접근 가능
CREATE POLICY "locations_org_member" ON locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE p.id = locations.project_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "scenes_org_member" ON scenes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE p.id = scenes.project_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "characters_org_member" ON characters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE p.id = characters.project_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "scene_characters_org_member" ON scene_characters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM scenes s
      JOIN projects p ON p.id = s.project_id
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE s.id = scene_characters.scene_id
      AND om.user_id = auth.uid()
    )
  );

-- =============================================
-- Updated At 트리거
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_locations_updated_at
    BEFORE UPDATE ON locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scenes_updated_at
    BEFORE UPDATE ON scenes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_characters_updated_at
    BEFORE UPDATE ON characters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
