# Film Production OS - Getting Started Guide

영화 프로덕션 OS SaaS 개발을 위한 시작 가이드입니다.

## 📋 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [기술 스택](#기술-스택)
3. [프로젝트 설정](#프로젝트-설정)
4. [디렉토리 구조](#디렉토리-구조)
5. [개발 워크플로우](#개발-워크플로우)
6. [MVP 개발 로드맵](#mvp-개발-로드맵)

---

## 프로젝트 개요

**Film Production OS**는 영화 제작 전 과정(프리, 현장, 포스트)을 관리하는 SaaS 플랫폼입니다.

### MVP 목표
- ✅ 일일촬영계획표 생성 및 편집
- ✅ 실시간 협업
- ✅ PDF/Excel 내보내기
- ✅ 버전 관리 (Draft → Published)
- ✅ 모바일 Field Mode

### 디자인 철학
- **Threads-inspired**: 모던, 미니멀, 흑백 느낌
- **테이블 중심**: Shot Plan Table이 핵심
- **엑셀보다 빠르게**: 키보드 중심 UX
- **출력 자동화**: 데이터 → PDF/Excel 자동 생성

---

## 기술 스택

### Frontend
```
Next.js 14 (App Router)
TypeScript
Tailwind CSS
TanStack Table (Shot Plan)
dnd-kit (Drag & Drop)
Zustand (State)
React Hook Form + Zod
```

### Backend
```
Supabase (PostgreSQL)
- Database
- Authentication (Magic Link)
- Real-time subscriptions
- Row Level Security (RLS)
```

### Export
```
jsPDF (PDF generation)
SheetJS (Excel generation)
```

---

## 프로젝트 설정

### 1. Supabase 프로젝트 생성

```bash
# Supabase CLI 설치
npm install -g supabase

# 프로젝트 초기화
supabase init

# 로컬 개발 시작
supabase start
```

### 2. 환경 변수 설정

`.env.local` 파일 생성:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. 데이터베이스 마이그레이션

```bash
# TECHNICAL_SPEC.md의 SQL 스키마를 복사
# supabase/migrations/ 폴더에 저장

supabase db push
```

### 4. 패키지 설치 및 개발 서버 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 열기

---

## 디렉토리 구조

```
film-production-os/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 인증 화면
│   │   ├── login/
│   │   └── join/
│   ├── (console)/                # 메인 웹 앱 (데스크톱)
│   │   ├── layout.tsx            # App Shell
│   │   ├── [org]/
│   │   │   └── [project]/
│   │   │       ├── page.tsx                    # Project Home
│   │   │       ├── shooting-days/
│   │   │       │   ├── page.tsx                # Day List
│   │   │       │   └── [dayId]/
│   │   │       │       └── page.tsx            # Day HQ (Builder)
│   │   │       ├── scenes/                     # 씬 레지스트리
│   │   │       ├── people/                     # 인물 레지스트리
│   │   │       └── locations/                  # 로케이션 레지스트리
│   │   └── new-project/
│   ├── (field)/                  # 모바일 Field Mode
│   │   └── [org]/[project]/
│   │       ├── feed/             # 활동 피드
│   │       ├── day/[dayId]/      # Day View
│   │       └── diff/             # Diff View
│   ├── api/
│   │   └── export/               # PDF/Excel 생성 API
│   └── globals.css
├── components/
│   ├── ui/                       # 기본 UI 컴포넌트
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── badge.tsx
│   ├── layout/                   # 레이아웃 컴포넌트
│   │   ├── app-shell.tsx
│   │   ├── sidebar.tsx
│   │   ├── topbar.tsx
│   │   └── right-panel.tsx
│   ├── shooting-day/             # Day HQ 컴포넌트
│   │   ├── shot-plan-table.tsx   # 🎯 핵심 컴포넌트
│   │   ├── header-editor.tsx
│   │   ├── schedule-section.tsx
│   │   ├── cast-calls-section.tsx
│   │   └── contacts-section.tsx
│   └── field/                    # 모바일 컴포넌트
│       ├── feed-card.tsx
│       └── day-view.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # 클라이언트 측 Supabase
│   │   ├── server.ts             # 서버 측 Supabase
│   │   └── types.ts              # 타입 정의
│   ├── hooks/
│   │   ├── use-shooting-day.ts   # 촬영일 데이터 훅
│   │   └── use-shot-plan.ts      # Shot Plan 훅
│   ├── stores/
│   │   └── editor-store.ts       # Zustand store
│   └── utils/
│       ├── export-pdf.ts         # PDF 생성
│       └── export-excel.ts       # Excel 생성
├── types/
│   └── database.types.ts         # Supabase 생성 타입
├── supabase/
│   ├── migrations/               # DB 마이그레이션
│   └── seed.sql                  # 시드 데이터
└── public/
```

---

## 개발 워크플로우

### 1단계: 데이터베이스 스키마 구현

```bash
# TECHNICAL_SPEC.md 참고
# supabase/migrations/에 SQL 파일 작성

supabase db push
supabase gen types typescript --project-id <your-project-id> > types/database.types.ts
```

### 2단계: 기본 UI 컴포넌트 구현

```
components/ui/
├── button.tsx          # 버튼
├── input.tsx           # 입력 필드
├── card.tsx            # 카드
├── badge.tsx           # 배지
├── dropdown.tsx        # 드롭다운
└── modal.tsx           # 모달
```

**디자인 가이드**: `globals.css` 참고

### 3단계: App Shell 구현

```
app/(console)/layout.tsx
├── Topbar
│   ├── Project Name
│   ├── Global Search
│   └── User Menu
├── Sidebar
│   ├── Project Switcher
│   └── Navigation
└── Main Content Area
```

### 4단계: Shot Plan Table 구현 (🎯 핵심)

```
components/shooting-day/shot-plan-table.tsx
```

**참고 문서**:
- `SHOT_PLAN_TABLE_SPEC.md` - 상세 설계
- `shot-plan-table-component.tsx` - 구현 예시

**핵심 기능**:
1. ✅ 드래그 앤 드롭 재정렬
2. ✅ 인라인 편집 (키보드 내비게이션)
3. ✅ 자동 저장 (500ms debounce)
4. ✅ 시간 자동 계산
5. ✅ 자동완성 (씬, 장소, 인물)

### 5단계: Export 기능 구현

```typescript
// lib/utils/export-pdf.ts
export const generatePDF = async (shootingDay: ShootingDay) => {
  // jsPDF + jspdf-autotable
  // 한글 폰트 임베딩 필수
};

// lib/utils/export-excel.ts
export const generateExcel = (shootingDay: ShootingDay) => {
  // SheetJS (xlsx)
  // 컬럼 폭, 스타일 적용
};
```

### 6단계: 버전 관리 구현

```
1. Draft 상태에서 편집
2. "Publish" 클릭 → snapshot 생성
3. Version 번호 증가 (v1, v2, ...)
4. 변경 사항 Diff 표시
5. 사용자 Ack 시스템
```

---

## MVP 개발 로드맵

### Week 1-2: Foundation
- [x] 프로젝트 설정
- [ ] Supabase 스키마 구현
- [ ] 기본 UI 컴포넌트
- [ ] App Shell & 내비게이션
- [ ] 인증 (Magic Link)

### Week 3-4: Core Features
- [ ] **Shot Plan Table** (핵심!)
  - [ ] 테이블 렌더링
  - [ ] 인라인 편집
  - [ ] 드래그 앤 드롭
  - [ ] 키보드 내비게이션
  - [ ] 자동완성
- [ ] Header Editor (집합시간, 촬영시간 등)
- [ ] Schedule Section
- [ ] Cast Calls Section
- [ ] Contacts Section

### Week 5: Export & Polish
- [ ] PDF 생성
- [ ] Excel 생성
- [ ] 버전 관리 (Draft → Published)
- [ ] 변경 이력 (Diff)
- [ ] UI 폴리시

### Week 6: Testing & Launch
- [ ] 사용자 테스트 (AD, 제작부)
- [ ] 버그 수정
- [ ] 성능 최적화
- [ ] 문서화
- [ ] **MVP 런칭** 🚀

---

## 개발 팁

### 1. Shot Plan Table 개발 시

```typescript
// 항상 debounce 사용
const debouncedSave = debounce(async (data) => {
  await supabase.from('shot_plan_items').upsert(data);
}, 500);

// 낙관적 업데이트 (Optimistic Update)
setItems(prevItems => 
  prevItems.map(item => 
    item.id === rowId ? { ...item, [column]: value } : item
  )
);
debouncedSave(items);
```

### 2. 키보드 내비게이션

```typescript
// Enter: 아래로
// Tab: 오른쪽
// Shift+Tab: 왼쪽
// Cmd+Enter: 새 행
// Escape: 편집 취소

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    moveFocus('down');
  } else if (e.key === 'Tab') {
    e.preventDefault();
    moveFocus(e.shiftKey ? 'left' : 'right');
  }
};
```

### 3. Real-time 구독

```typescript
const channel = supabase
  .channel('shot-plan-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'shot_plan_items',
      filter: `shooting_day_id=eq.${dayId}`,
    },
    (payload) => {
      // 다른 사용자의 변경사항 반영
      handleRemoteChange(payload);
    }
  )
  .subscribe();
```

### 4. PDF 한글 폰트

```typescript
import { jsPDF } from 'jspdf';

// 한글 폰트 등록 (필수!)
doc.addFileToVFS('NanumGothic.ttf', nanumGothicFont);
doc.addFont('NanumGothic.ttf', 'NanumGothic', 'normal');
doc.setFont('NanumGothic');
```

---

## 참고 자료

### 문서
- `TECHNICAL_SPEC.md` - 전체 기술 스펙
- `SHOT_PLAN_TABLE_SPEC.md` - Shot Plan Table 상세 설계
- `shot-plan-table-component.tsx` - 구현 예시

### 라이브러리 문서
- [Next.js 14](https://nextjs.org/docs)
- [Supabase](https://supabase.com/docs)
- [TanStack Table](https://tanstack.com/table/latest)
- [dnd-kit](https://docs.dndkit.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### 디자인 참고
- [Threads](https://www.threads.net/) - 미니멀 디자인
- [Linear](https://linear.app/) - 키보드 중심 UX
- [Notion](https://notion.so/) - 테이블 편집

---

## 다음 단계

1. ✅ 문서 읽기 완료
2. 🔨 개발 환경 설정
3. 🎯 Shot Plan Table 구현 시작
4. 🚀 MVP 런칭

**Questions?** 프로젝트 진행 중 궁금한 점이 있으면 TECHNICAL_SPEC.md와 SHOT_PLAN_TABLE_SPEC.md를 먼저 참고하세요!
