# Film Production OS - Technical Specification

## 1. Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + CSS Variables
- **UI Components**: Headless UI, Radix UI
- **State Management**: Zustand (lightweight, simple)
- **Forms**: React Hook Form + Zod validation
- **Tables**: TanStack Table (for Shot Plan table)
- **Date/Time**: date-fns
- **PDF Generation**: jsPDF / react-pdf
- **Excel Export**: SheetJS (xlsx)
- **Drag & Drop**: dnd-kit

### Backend
- **BaaS**: Supabase
  - PostgreSQL Database
  - Row Level Security (RLS)
  - Real-time subscriptions
  - Auth (Magic Link)
  - Storage (for exports)

### Mobile
- **PWA** (Progressive Web App) for MVP
- React Native (future consideration)

### Deployment
- **Hosting**: Vercel
- **CDN**: Vercel Edge Network
- **Environment**: Production, Staging, Development

---

## 2. Database Schema (Supabase)

### Core Principles
- Multi-tenancy through `organization_id`
- Soft deletes (`deleted_at`)
- Audit trails (`created_at`, `updated_at`, `created_by`, `updated_by`)
- Version control through snapshots

### Schema Design

```sql
-- =============================================
-- ORGANIZATIONS & AUTH
-- =============================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  timezone TEXT DEFAULT 'Asia/Seoul',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'ad', 'crew', 'cast')),
  permissions JSONB DEFAULT '{}',
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
  project_type TEXT DEFAULT 'film', -- film, series, commercial
  timezone TEXT DEFAULT 'Asia/Seoul',
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
-- SHOOTING DAYS (핵심 엔티티)
-- =============================================

CREATE TABLE shooting_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Basic Info
  day_number INTEGER, -- 촬영 회차
  shoot_date DATE NOT NULL,
  
  -- Header Info
  call_time TIME,
  shooting_time_start TIME,
  shooting_time_end TIME,
  base_location_id UUID REFERENCES locations(id),
  call_location_id UUID REFERENCES locations(id),
  weather TEXT,
  sunrise TIME,
  sunset TIME,
  
  -- Status & Version
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  version INTEGER DEFAULT 1,
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES auth.users(id),
  
  -- Change tracking
  change_note TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(project_id, shoot_date)
);

CREATE INDEX idx_shooting_days_project ON shooting_days(project_id);
CREATE INDEX idx_shooting_days_date ON shooting_days(shoot_date);

-- =============================================
-- SHOT PLAN (샷 플랜 테이블의 각 행)
-- =============================================

CREATE TABLE shot_plan_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shooting_day_id UUID REFERENCES shooting_days(id) ON DELETE CASCADE,
  
  -- 촬영순서 (자동 증가, 드래그로 변경 가능)
  sequence INTEGER NOT NULL,
  
  -- S# / CUT
  scene_number TEXT, -- "8", "8+9", "7A"
  cut_number TEXT, -- "1", "2A", nullable
  
  -- M/D/E/N (씬 성격)
  scene_time TEXT CHECK (scene_time IN ('M', 'D', 'E', 'N')), -- Morning/Day/Evening/Night
  
  -- I/E (실내/외)
  scene_location_type TEXT CHECK (scene_location_type IN ('I', 'E')), -- Interior/Exterior
  
  -- 시간
  start_time TIME,
  end_time TIME,
  
  -- 촬영장소
  location_id UUID REFERENCES locations(id),
  location_override TEXT, -- 장소 이름 직접 입력 가능
  
  -- 촬영내용 (가장 중요)
  content TEXT NOT NULL,
  
  -- 주요인물 (멀티 셀렉트)
  cast_ids UUID[], -- Array of character IDs
  
  -- 비고
  notes TEXT, -- 렌즈/샷/장비
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_shot_plan_day ON shot_plan_items(shooting_day_id);
CREATE INDEX idx_shot_plan_sequence ON shot_plan_items(shooting_day_id, sequence);

-- =============================================
-- SCHEDULE (전체일정)
-- =============================================

CREATE TABLE schedule_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shooting_day_id UUID REFERENCES shooting_days(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL CHECK (type IN ('CALL', 'MEAL', 'SHOOT', 'BREAK', 'WRAP', 'OTHER')),
  sequence INTEGER NOT NULL,
  
  start_time TIME NOT NULL,
  end_time TIME,
  
  title TEXT NOT NULL,
  description TEXT,
  location_id UUID REFERENCES locations(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_schedule_day ON schedule_items(shooting_day_id);

-- =============================================
-- CAST CALLS (배우 콜)
-- =============================================

CREATE TABLE cast_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shooting_day_id UUID REFERENCES shooting_days(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  
  call_time TIME NOT NULL,
  scenes TEXT[], -- Array of scene numbers
  notes TEXT, -- 준비물, 의상 등
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_cast_calls_day ON cast_calls(shooting_day_id);

-- =============================================
-- REGISTRY: CHARACTERS (배우/배역)
-- =============================================

CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  character_name TEXT NOT NULL, -- 배역명
  actor_name TEXT, -- 배우명
  actor_contact TEXT,
  role_type TEXT DEFAULT 'lead' CHECK (role_type IN ('lead', 'supporting', 'extra')),
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_characters_project ON characters(project_id);

-- =============================================
-- REGISTRY: LOCATIONS (로케이션)
-- =============================================

CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  address TEXT,
  location_type TEXT, -- studio, outdoor, indoor
  
  contact_name TEXT,
  contact_phone TEXT,
  
  coordinates POINT, -- PostGIS for map
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_locations_project ON locations(project_id);

-- =============================================
-- REGISTRY: SCENES (씬 레지스트리)
-- =============================================

CREATE TABLE scenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  scene_number TEXT NOT NULL,
  scene_name TEXT,
  description TEXT,
  location_id UUID REFERENCES locations(id),
  
  script_page_start DECIMAL(5,2),
  script_page_end DECIMAL(5,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(project_id, scene_number)
);

CREATE INDEX idx_scenes_project ON scenes(project_id);

-- =============================================
-- CONTACTS (스태프 연락망)
-- =============================================

CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shooting_day_id UUID REFERENCES shooting_days(id) ON DELETE CASCADE,
  
  role TEXT NOT NULL, -- 감독, 촬영감독, AD 등
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  
  sequence INTEGER, -- 표시 순서
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_contacts_day ON contacts(shooting_day_id);

-- =============================================
-- OPTIONAL DETAIL SECTIONS
-- =============================================

CREATE TABLE detail_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shooting_day_id UUID REFERENCES shooting_days(id) ON DELETE CASCADE,
  
  section_type TEXT NOT NULL CHECK (section_type IN ('camera', 'lighting', 'art', 'production', 'other')),
  title TEXT NOT NULL,
  content JSONB, -- Flexible structure
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- =============================================
-- VERSION HISTORY (변경 이력)
-- =============================================

CREATE TABLE shooting_day_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shooting_day_id UUID REFERENCES shooting_days(id) ON DELETE CASCADE,
  
  version INTEGER NOT NULL,
  snapshot JSONB NOT NULL, -- Full snapshot of shooting day
  change_summary TEXT,
  
  published_at TIMESTAMPTZ DEFAULT NOW(),
  published_by UUID REFERENCES auth.users(id),
  
  UNIQUE(shooting_day_id, version)
);

-- =============================================
-- ACKNOWLEDGMENTS (Ack 시스템)
-- =============================================

CREATE TABLE acknowledgments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shooting_day_version_id UUID REFERENCES shooting_day_versions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(shooting_day_version_id, user_id)
);

CREATE INDEX idx_acks_version ON acknowledgments(shooting_day_version_id);

-- =============================================
-- ACTIVITY LOG (피드용)
-- =============================================

CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  shooting_day_id UUID REFERENCES shooting_days(id) ON DELETE CASCADE,
  
  action_type TEXT NOT NULL, -- 'created', 'updated', 'published', 'acknowledged'
  action_summary TEXT NOT NULL,
  action_data JSONB,
  
  actor_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_project ON activity_logs(project_id, created_at DESC);
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE shooting_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE shot_plan_items ENABLE ROW LEVEL SECURITY;
-- ... (enable on all tables)

-- Example Policy: Users can only see shooting days in their projects
CREATE POLICY "Users can view shooting days in their projects"
  ON shooting_days
  FOR SELECT
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

-- Similar policies for INSERT, UPDATE, DELETE with role-based checks
```

---

## 3. Directory Structure

```
film-production-os/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth layouts
│   │   ├── login/
│   │   └── join/
│   ├── (console)/                # Main web app
│   │   ├── layout.tsx            # App shell with sidebar
│   │   ├── [org]/
│   │   │   ├── [project]/
│   │   │   │   ├── page.tsx      # Project Home
│   │   │   │   ├── shooting-days/
│   │   │   │   │   ├── page.tsx  # Shooting Day List
│   │   │   │   │   └── [dayId]/
│   │   │   │   │       └── page.tsx  # Day HQ (Builder)
│   │   │   │   ├── scenes/
│   │   │   │   ├── people/
│   │   │   │   ├── locations/
│   │   │   │   └── settings/
│   │   │   └── page.tsx          # Org home
│   │   └── new-project/
│   ├── (field)/                  # Mobile field mode
│   │   ├── layout.tsx
│   │   └── [org]/[project]/
│   │       ├── feed/
│   │       ├── day/[dayId]/
│   │       ├── diff/[versionId]/
│   │       └── directory/
│   ├── api/                      # API routes
│   │   ├── export/
│   │   │   ├── pdf/
│   │   │   └── excel/
│   │   └── webhooks/
│   └── globals.css
├── components/
│   ├── ui/                       # Base UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── dropdown.tsx
│   │   └── modal.tsx
│   ├── layout/                   # Layout components
│   │   ├── app-shell.tsx
│   │   ├── sidebar.tsx
│   │   ├── topbar.tsx
│   │   └── right-panel.tsx
│   ├── shooting-day/             # Day HQ components
│   │   ├── shot-plan-table.tsx   # 핵심 테이블
│   │   ├── header-editor.tsx
│   │   ├── schedule-section.tsx
│   │   ├── cast-calls-section.tsx
│   │   ├── contacts-section.tsx
│   │   └── detail-sections.tsx
│   ├── registry/                 # Registry components
│   │   ├── scene-list.tsx
│   │   ├── character-list.tsx
│   │   └── location-list.tsx
│   └── field/                    # Mobile components
│       ├── feed-card.tsx
│       ├── day-view.tsx
│       └── diff-view.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── types.ts              # Generated types
│   ├── hooks/
│   │   ├── use-shooting-day.ts
│   │   ├── use-shot-plan.ts
│   │   └── use-realtime.ts
│   ├── stores/
│   │   └── editor-store.ts       # Zustand store
│   ├── utils/
│   │   ├── time.ts
│   │   ├── export-pdf.ts
│   │   ├── export-excel.ts
│   │   └── formatting.ts
│   └── constants.ts
├── public/
├── styles/
│   └── threads-theme.css         # Threads-like design tokens
├── types/
│   └── database.types.ts
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── .env.local
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. Design System (Threads-inspired)

### Color Palette (Monochrome)
```css
:root {
  /* Backgrounds */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F7F7F7;
  --bg-tertiary: #FAFAFA;
  
  /* Text */
  --text-primary: #111111;
  --text-secondary: #666666;
  --text-tertiary: #999999;
  --text-inverse: #FFFFFF;
  
  /* Borders */
  --border-light: #E5E5E5;
  --border-medium: #D0D0D0;
  --border-dark: #B0B0B0;
  
  /* Status colors (minimal use) */
  --status-draft: #666666;
  --status-published: #111111;
  --status-error: #DC2626;
  --status-warning: #F59E0B;
  --status-success: #10B981;
  
  /* Shadows (거의 사용 안 함) */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 2px 4px rgba(0, 0, 0, 0.06);
}
```

### Typography
```css
:root {
  /* Font Family */
  --font-display: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-body: 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'SF Mono', 'Monaco', 'Courier New', monospace;
  
  /* Font Sizes */
  --text-xs: 11px;
  --text-sm: 12px;
  --text-base: 14px;
  --text-lg: 16px;
  --text-xl: 20px;
  --text-2xl: 24px;
  
  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
  
  /* Font Weights */
  --font-regular: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

### Spacing
```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
}
```

### Border Radius
```css
:root {
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 18px;
  --radius-full: 9999px;
}
```

---

## 5. Key Features Implementation

### 5.1 Shot Plan Table (핵심 컴포넌트)

**Technology**: TanStack Table v8
**Features**:
- Virtual scrolling for performance
- Inline editing with keyboard navigation
- Drag & drop row reordering (dnd-kit)
- Auto-complete for scenes, locations, characters
- Real-time collaboration (Supabase subscriptions)
- Undo/Redo with command history

**Key Interactions**:
```typescript
// Keyboard shortcuts
- Enter: Move down (same column)
- Tab: Move right
- Shift+Tab: Move left
- Cmd+Enter: Add new row
- Cmd+D: Duplicate row
- Cmd+Z: Undo
- Cmd+Shift+Z: Redo
```

### 5.2 Version Control & Diff

**Approach**: Snapshot-based versioning
- Every publish creates a new version snapshot
- Diff algorithm compares JSON snapshots
- Highlights changes in UI with color coding

### 5.3 Acknowledgment System

**Flow**:
1. Version published → Notifications sent
2. Users view Diff → Click "Acknowledge"
3. Real-time progress tracking
4. Reminder system for unacknowledged users

### 5.4 PDF/Excel Export

**PDF**: 
- Template-based generation (jsPDF)
- Matches print layout exactly
- Custom fonts for Korean support

**Excel**:
- SheetJS for structured data
- Formulas preserved
- Styling applied

### 5.5 Real-time Collaboration

**Supabase Realtime**:
- Subscribe to shooting_day changes
- Show "User X is editing" indicators
- Conflict resolution (last-write-wins)

---

## 6. MVP Scope (Phase 1)

### Must Have
✅ Authentication (Magic Link)
✅ Project creation
✅ Shooting Day List
✅ Day HQ with Shot Plan Table
✅ Basic Registry (Scenes, Characters, Locations)
✅ PDF Export
✅ Excel Export
✅ Version system (Draft → Published)

### Nice to Have (MVP+)
- Acknowledgment system
- Diff view
- Mobile Field Mode
- Real-time collaboration
- Activity feed

### Future Phases
- Advanced scheduling
- Budget tracking
- Script breakdown integration
- Mobile native app
- Multi-language support

---

## 7. Performance Considerations

- **Virtual scrolling** for large tables (100+ rows)
- **Optimistic updates** for better UX
- **Debounced auto-save** (500ms)
- **Lazy loading** of registry data
- **CDN caching** for static assets
- **Edge functions** for export generation

---

## 8. Security

- **RLS policies** on all tables
- **JWT validation** on API routes
- **Input sanitization** (Zod schemas)
- **Rate limiting** on exports
- **Audit logging** for all changes

---

## 9. Testing Strategy

- **Unit tests**: Vitest for utils
- **Component tests**: Testing Library
- **E2E tests**: Playwright (critical flows)
- **Manual QA**: Shooting day workflow

---

## 10. Deployment Pipeline

```
Development → Staging → Production
     ↓            ↓          ↓
  Vercel      Vercel     Vercel
(Preview)   (Staging)  (Production)
```

**CI/CD**:
- GitHub Actions for tests
- Auto-deploy on merge to main
- Database migrations via Supabase CLI

---

## Success Metrics

**MVP Success Criteria**:
1. User can create a shooting day in < 5 minutes
2. Shot plan table feels faster than Excel
3. PDF export matches industry standard
4. Zero data loss on auto-save
5. Mobile view is readable on field

**Technical KPIs**:
- Page load < 2s (p95)
- Time to Interactive < 3s
- Shot plan table rendering < 100ms
- Export generation < 5s

---

## Next Steps

1. ✅ Database schema finalization
2. Setup Next.js + Supabase project
3. Build design system components
4. Implement Shot Plan Table (핵심)
5. Build export functionality
6. User testing with AD/제작부
7. Iterate based on feedback
8. Launch MVP

