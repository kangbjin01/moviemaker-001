# Film Production OS - Work Log

## Project Overview
- **Name**: Film Production OS
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Design**: Threads-inspired (Modern, Minimal, Black & White)
- **UI Library**: shadcn/ui + Radix UI

---

## Session 1 - 2026-01-11

### Completed Tasks
- [x] Project specification documents reviewed
- [x] Next.js 14 project initialized with TypeScript
- [x] Tailwind CSS configured with Threads-like design tokens
- [x] Supabase client configuration created
- [x] Base UI components built (Button, Input, Card, Badge, Textarea)
- [x] App Shell layout implemented (Sidebar, Topbar)
- [x] Authentication pages created (Login with Magic Link)
- [x] Shot Plan Table component built (core feature)
- [x] Shooting Day detail page created

### Tech Stack Summary
| Category | Technology |
|----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + CSS Variables |
| UI Components | shadcn/ui, Radix UI |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Drag & Drop | dnd-kit |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Magic Link |
| PDF Export | jsPDF |
| Excel Export | SheetJS |
| Icons | Lucide React |

### Design Principles
- Threads-inspired monochrome design
- Keyboard-first UX (faster than Excel)
- Auto-generated exports (PDF/Excel)
- Real-time collaboration

---

## Project Structure

```
src/
├── app/
│   ├── globals.css              # Global styles with CSS variables
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page
│   ├── (auth)/
│   │   ├── layout.tsx           # Auth layout (centered)
│   │   └── login/page.tsx       # Login page (Magic Link)
│   └── (console)/
│       ├── layout.tsx           # Console layout
│       └── [org]/[project]/
│           ├── page.tsx         # Project dashboard
│           └── shooting-days/
│               ├── page.tsx     # Shooting days list
│               └── [dayId]/page.tsx  # Day HQ (Shot Plan Table)
├── components/
│   ├── ui/                      # Base UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   └── index.ts
│   ├── layout/                  # Layout components
│   │   ├── app-shell.tsx
│   │   ├── sidebar.tsx
│   │   ├── topbar.tsx
│   │   └── index.ts
│   └── shooting-day/            # Shooting day components
│       ├── shot-plan-table.tsx  # Core table component
│       └── index.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Browser client
│   │   └── server.ts            # Server client
│   └── utils/
│       └── cn.ts                # Class name utility
└── types/
    └── database.types.ts        # Supabase types
```

---

## Progress Log

### 2026-01-11 (Session 1)

**Initial Project Setup**
1. Created package.json with all dependencies
2. Configured Next.js, TypeScript, Tailwind CSS
3. Set up shadcn/ui compatible structure

**UI Components Created**
- Button (with variants: default, destructive, outline, secondary, ghost, link)
- Input
- Textarea
- Card (with CardHeader, CardContent, CardFooter, CardTitle, CardDescription)
- Badge (with variants for status and scene time: M/D/E/N)

**Layout Components Created**
- AppShell (main layout wrapper)
- Sidebar (navigation with project selector)
- Topbar (search, notifications, user menu)

**Pages Created**
- Landing page (/)
- Login page (/login)
- Project dashboard (/[org]/[project])
- Shooting days list (/[org]/[project]/shooting-days)
- Shooting day detail (/[org]/[project]/shooting-days/[dayId])

**Shot Plan Table Features**
- Drag & drop row reordering (dnd-kit)
- Inline editing for all columns
- Single-key input for M/D/E/N and I/E columns
- Time input with native time picker
- Auto sequence numbering
- Total shots and duration calculation

---

## Next Steps

### Immediate
- [x] Test build and fix any errors (SUCCESS)
- [x] Connect to Supabase database (DONE)
- [x] Implement actual authentication flow (DONE)
- [ ] Add PDF export functionality
- [ ] Add Excel export functionality

### Later
- [ ] Real-time collaboration
- [ ] Version history and diff view
- [ ] Cast calls section
- [ ] Contacts section
- [ ] Mobile field mode

---

## Session 2 - 2026-01-11 (Supabase Integration)

### Completed
- [x] Created `.env.local` with Supabase credentials
- [x] Created database schema (SQL migration)
  - profiles, organizations, organization_members
  - projects, locations, characters, scenes
  - shooting_days, shot_plan_items
- [x] Setup Row Level Security (RLS) policies
- [x] Connected authentication flow (Magic Link)
- [x] Created onboarding flow for new users
- [x] Connected Shot Plan Table to database
- [x] Connected Shooting Days list to database

### New Files Created
- `src/middleware.ts` - Supabase auth middleware
- `src/lib/supabase/middleware.ts` - Session handling
- `src/lib/supabase/actions.ts` - Server actions for auth
- `src/app/auth/callback/route.ts` - Auth callback handler
- `src/app/onboarding/page.tsx` - New user onboarding
- `src/lib/hooks/use-shooting-day.ts` - Data hook for shooting days
- `src/lib/utils/debounce.ts` - Debounce utility
- `supabase/migrations/001_initial_schema.sql` - Database schema

### Database Tables Created
| Table | Purpose |
|-------|---------|
| profiles | User profiles (extends auth.users) |
| organizations | Production companies/teams |
| organization_members | Team membership |
| projects | Film projects |
| locations | Location registry |
| characters | Character/actor registry |
| scenes | Scene registry |
| shooting_days | Daily shooting schedules |
| shot_plan_items | Shot plan table rows |

---

---

## Session 3 - 2026-01-11 (UX Fixes)

### Completed
- [x] Changed auth from Magic Link to Email/Password signup
- [x] Fixed Korean input lag in Shot Plan Table (EditableCell with local state)
- [x] Added visible dropdown for M/D/E/N and I/E selection (DropdownSelect)
- [x] Fixed dropdown being clipped by table overflow (React Portal)
- [x] Fixed RLS policies for organizations table (infinite recursion)
- [x] Fixed `useParams()` usage for Next.js 14 compatibility

### Key Code Changes
- `shot-plan-table.tsx`: EditableCell (blur-to-save), DropdownSelect (Portal)
- `login/page.tsx`: Email/Password auth instead of Magic Link
- Portal implementation for dropdown to escape table overflow

---

## Notes
- Core feature is the Shot Plan Table (일일촬영계획표)
- Must be faster than Excel for data entry
- Korean language support required for PDF export
- Threads-inspired monochrome design for modern look
