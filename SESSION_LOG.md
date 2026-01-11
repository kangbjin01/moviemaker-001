# Film Production OS - 개발 세션 로그

## 프로젝트 정보
- **프로젝트명**: Film Production OS (일일촬영계획표 SaaS)
- **저장소**: https://github.com/kangbjin01/moviemaker-001
- **기술 스택**: Next.js 14, TypeScript, Tailwind CSS, Supabase, shadcn/ui

---

## 세션 1-3 (2026-01-11)

### 완료된 작업

#### 1. 프로젝트 초기 설정
- Next.js 14 + TypeScript + Tailwind CSS 프로젝트 생성
- shadcn/ui 컴포넌트 라이브러리 설정
- Threads 스타일 모노크롬 디자인 테마

#### 2. Supabase 연동
- **URL**: https://mzpcugjqsvqcymthwurd.supabase.co
- 인증 시스템 (이메일/비밀번호)
- 데이터베이스 스키마 (9개 테이블)
- RLS 정책 설정 및 수정

#### 3. UI 컴포넌트
- Button, Input, Card, Badge, Textarea
- AppShell, Sidebar, Topbar (레이아웃)
- Shot Plan Table (핵심 기능)

#### 4. Shot Plan Table 기능
- 드래그 앤 드롭 (dnd-kit)
- 인라인 편집
- M/D/E/N, I/E 드롭다운 (Portal 사용)
- 한글 입력 지원 (blur-to-save 패턴)

#### 5. 기본 정보 섹션 (한글화)
- 촬영일시, 집합시간, 일기예보, 최저/최고온도
- 촬영장소, 집합장소, 강수확률, 일출/일몰시간
- 촬영시간, 종료시간, 기타사항

#### 6. 테이블 컬럼 (한글화)
```
촬영순서 | S# | CUT | M/D/E/N | I/E | 촬영시간(시작/끝) | 촬영장소 | 촬영내용 | 주요인물 | 비고
```

#### 7. Git 연동
- 저장소: https://github.com/kangbjin01/moviemaker-001
- 사용자: kangbjin01 (bjkang060101@naver.com)

### 해결한 이슈들
1. "Database error saving new user" - trigger 함수 SECURITY DEFINER 설정
2. "Email not confirmed" - Supabase에서 이메일 확인 비활성화
3. "infinite recursion in RLS policy" - organizations 테이블 정책 단순화
4. "unsupported type passed to use()" - useParams() 훅으로 변경
5. 한글 입력 지연 - EditableCell (로컬 상태 + blur 저장)
6. 드롭다운 가림 현상 - React Portal 사용

---

## 다음 작업 (예정)
- [ ] PDF 내보내기 기능
- [ ] Excel 내보내기 기능
- [ ] 실시간 협업
- [ ] 버전 히스토리
- [ ] 출연진 콜시트 섹션
- [ ] 연락처 섹션
- [ ] 모바일 필드 모드

---

## 주요 파일 경로

### 페이지
- `src/app/(auth)/login/page.tsx` - 로그인 페이지
- `src/app/onboarding/page.tsx` - 온보딩
- `src/app/(console)/[org]/[project]/shooting-days/page.tsx` - 촬영일 목록
- `src/app/(console)/[org]/[project]/shooting-days/[dayId]/page.tsx` - 촬영일 상세 (기본정보 + 표)

### 컴포넌트
- `src/components/shooting-day/shot-plan-table.tsx` - Shot Plan 테이블 (핵심)
- `src/components/ui/` - UI 컴포넌트들
- `src/components/layout/` - 레이아웃 컴포넌트들

### Supabase
- `src/lib/supabase/client.ts` - 클라이언트
- `src/lib/supabase/server.ts` - 서버
- `src/lib/hooks/use-shooting-day.ts` - 촬영일 데이터 훅
- `supabase/migrations/001_initial_schema.sql` - DB 스키마

### 설정
- `.env.local` - 환경변수 (Supabase 키)
- `tailwind.config.ts` - Tailwind 설정
- `components.json` - shadcn/ui 설정

---

## 개발 서버 실행
```bash
cd "D:\ai program\moviemaker-01"
npm run dev
```
기본 포트: http://localhost:3000 (사용 중이면 3001, 3002...)

---

## 세션 재개 방법
Claude Code에서 다음과 같이 말하면 됩니다:
> "D:\ai program\moviemaker-01 프로젝트 이어서 작업해줘. SESSION_LOG.md 파일 읽어서 진행상황 파악하고 진행해"
