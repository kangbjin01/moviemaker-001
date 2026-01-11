-- =============================================
-- Film Production OS - Initial Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES (extends auth.users)
-- =============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ORGANIZATIONS
-- =============================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- =============================================
-- ORGANIZATION MEMBERS
-- =============================================
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- =============================================
-- PROJECTS
-- =============================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  project_type TEXT DEFAULT 'film',
  start_date DATE,
  end_date DATE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,
  UNIQUE(organization_id, slug)
);

-- =============================================
-- LOCATIONS (Registry)
-- =============================================
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  location_type TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- =============================================
-- CHARACTERS (Registry)
-- =============================================
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  character_name TEXT NOT NULL,
  actor_name TEXT,
  actor_contact TEXT,
  role_type TEXT DEFAULT 'lead' CHECK (role_type IN ('lead', 'supporting', 'extra')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- =============================================
-- SCENES (Registry)
-- =============================================
CREATE TABLE scenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  scene_number TEXT NOT NULL,
  scene_name TEXT,
  description TEXT,
  location_id UUID REFERENCES locations(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(project_id, scene_number)
);

-- =============================================
-- SHOOTING DAYS
-- =============================================
CREATE TABLE shooting_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  day_number INTEGER,
  shoot_date DATE NOT NULL,
  call_time TIME,
  shooting_time_start TIME,
  shooting_time_end TIME,
  base_location_id UUID REFERENCES locations(id),
  weather TEXT,
  sunrise TIME,
  sunset TIME,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  version INTEGER DEFAULT 1,
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES auth.users(id),
  change_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,
  UNIQUE(project_id, shoot_date)
);

-- =============================================
-- SHOT PLAN ITEMS (Core Table)
-- =============================================
CREATE TABLE shot_plan_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shooting_day_id UUID REFERENCES shooting_days(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  scene_number TEXT,
  cut_number TEXT,
  scene_time TEXT CHECK (scene_time IN ('M', 'D', 'E', 'N')),
  scene_location_type TEXT CHECK (scene_location_type IN ('I', 'E')),
  start_time TIME,
  end_time TIME,
  location_id UUID REFERENCES locations(id),
  location_override TEXT,
  content TEXT NOT NULL,
  cast_ids UUID[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_projects_org ON projects(organization_id);
CREATE INDEX idx_locations_project ON locations(project_id);
CREATE INDEX idx_characters_project ON characters(project_id);
CREATE INDEX idx_scenes_project ON scenes(project_id);
CREATE INDEX idx_shooting_days_project ON shooting_days(project_id);
CREATE INDEX idx_shooting_days_date ON shooting_days(shoot_date);
CREATE INDEX idx_shot_plan_day ON shot_plan_items(shooting_day_id);
CREATE INDEX idx_shot_plan_sequence ON shot_plan_items(shooting_day_id, sequence);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON characters FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_scenes_updated_at BEFORE UPDATE ON scenes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_shooting_days_updated_at BEFORE UPDATE ON shooting_days FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_shot_plan_items_updated_at BEFORE UPDATE ON shot_plan_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shooting_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE shot_plan_items ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Organizations: members can view
CREATE POLICY "Members can view organizations" ON organizations FOR SELECT
  USING (id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can create organizations" ON organizations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Owners can update organizations" ON organizations FOR UPDATE
  USING (owner_id = auth.uid());

-- Organization Members
CREATE POLICY "Members can view org members" ON organization_members FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Owners can manage members" ON organization_members FOR ALL
  USING (organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()));

-- Projects: org members can view/edit
CREATE POLICY "Org members can view projects" ON projects FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Org members can create projects" ON projects FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Org members can update projects" ON projects FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- Locations, Characters, Scenes: project access
CREATE POLICY "Project members can manage locations" ON locations FOR ALL
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN organization_members om ON om.organization_id = p.organization_id
    WHERE om.user_id = auth.uid()
  ));

CREATE POLICY "Project members can manage characters" ON characters FOR ALL
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN organization_members om ON om.organization_id = p.organization_id
    WHERE om.user_id = auth.uid()
  ));

CREATE POLICY "Project members can manage scenes" ON scenes FOR ALL
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN organization_members om ON om.organization_id = p.organization_id
    WHERE om.user_id = auth.uid()
  ));

-- Shooting Days
CREATE POLICY "Project members can manage shooting days" ON shooting_days FOR ALL
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN organization_members om ON om.organization_id = p.organization_id
    WHERE om.user_id = auth.uid()
  ));

-- Shot Plan Items
CREATE POLICY "Project members can manage shot plans" ON shot_plan_items FOR ALL
  USING (shooting_day_id IN (
    SELECT sd.id FROM shooting_days sd
    JOIN projects p ON p.id = sd.project_id
    JOIN organization_members om ON om.organization_id = p.organization_id
    WHERE om.user_id = auth.uid()
  ));

-- =============================================
-- DONE!
-- =============================================
