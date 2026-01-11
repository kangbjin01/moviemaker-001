# Film Production OS - 개발 현황

## 프로젝트 개요
- **프로젝트명**: Film Production OS (일일촬영계획표 관리 시스템)
- **기술스택**: Next.js 14, TypeScript, Tailwind CSS, Supabase, shadcn/ui
- **디자인**: Threads-inspired 모노크롬 디자인
- **GitHub**: https://github.com/kangbjin01/moviemaker-001

## 폴더 구조
```
src/
├── app/
│   ├── (console)/[org]/[project]/
│   │   ├── page.tsx                    # 프로젝트 홈
│   │   ├── shooting-days/
│   │   │   ├── page.tsx                # 촬영일정 목록
│   │   │   └── [dayId]/page.tsx        # 일일촬영계획표 상세
│   │   ├── people/page.tsx             # 피플 관리
│   │   ├── scenes/                     # 씬 관리 (미구현)
│   │   └── locations/                  # 로케이션 관리 (미구현)
│   └── login/page.tsx                  # 로그인
├── components/
│   ├── layout/
│   │   ├── app-shell.tsx               # 레이아웃 쉘
│   │   └── sidebar.tsx                 # 사이드바 (한국어)
│   ├── shooting-day/
│   │   ├── index.ts                    # export 모음
│   │   ├── shot-plan-table.tsx         # 촬영계획 테이블
│   │   ├── schedule-section.tsx        # 전체일정 섹션
│   │   ├── staff-equipment-section.tsx # 스태프/장비 섹션 (피플 불러오기 기능)
│   │   └── cast-section.tsx            # 캐스트 섹션 (피플 불러오기 기능)
│   └── ui/
│       ├── tabs.tsx                    # 탭 네비게이션
│       ├── address-input.tsx           # 다음 주소검색 API
│       └── ... (shadcn/ui 컴포넌트들)
├── lib/
│   ├── hooks/
│   │   ├── use-shooting-day.ts         # 촬영일 데이터 훅
│   │   ├── use-shooting-day-details.ts # 일정/스태프/장비/캐스트 훅
│   │   └── use-project-people.ts       # 프로젝트 피플 훅
│   ├── pdf/
│   │   ├── shooting-day-pdf.tsx        # PDF 템플릿 컴포넌트
│   │   └── generate-pdf.tsx            # PDF 생성 로직
│   ├── excel/
│   │   └── generate-excel.ts           # Excel 생성 로직
│   ├── supabase/
│   │   ├── client.ts                   # Supabase 클라이언트
│   │   └── server.ts                   # Supabase 서버
│   └── utils/
│       ├── weather.ts                  # 날씨 API (Open-Meteo)
│       ├── debounce.ts                 # 디바운스 유틸
│       └── cn.ts                       # className 유틸
└── supabase/
    └── migrations/
        ├── 001_initial.sql             # 초기 스키마
        ├── 002_add_weather_columns.sql # 날씨 컬럼 추가
        └── 003_add_schedule_staff_cast.sql # 일정/스태프/캐스트 테이블
```

## 데이터베이스 테이블

### 기본 테이블 (001_initial.sql)
- `organizations` - 조직
- `organization_members` - 조직 멤버
- `projects` - 프로젝트
- `shooting_days` - 촬영일
- `shot_plan_items` - 촬영계획 아이템

### 날씨 컬럼 추가 (002_add_weather_columns.sql)
- `shooting_days` 테이블에 추가:
  - `base_location` (촬영장소 텍스트)
  - `assembly_location` (집합장소)
  - `precipitation` (강수확률)
  - `temp_low` (최저온도)
  - `temp_high` (최고온도)
  - `notes` (기타사항)

### 일정/스태프/캐스트 테이블 (003_add_schedule_staff_cast.sql)
- `project_people` - 프로젝트 인원 마스터 (스태프/캐스트 통합)
- `shooting_day_schedules` - 전체일정
- `shooting_day_staff` - 스태프 리스트
- `shooting_day_equipment` - 부서별 장비
- `shooting_day_cast` - 캐스트 콜시트

## 완성된 기능

### 1. 일일촬영계획표 (Shooting Day)
- **기본정보 탭**
  - 촬영일시, 집합시간, 일기예보, 최저/최고온도
  - 촬영장소 (다음 주소검색 API), 집합장소
  - 강수확률, 일출/일몰시간
  - 촬영시간 시작/종료, 기타사항
  - 날씨 자동조회 (Open-Meteo API)

- **촬영계획 탭**
  - 촬영계획 테이블 (촬영순서, S#, CUT, M/D/E/N, I/E, 시간, 장소, 내용, 주요인물, 비고)
  - 드래그앤드롭으로 순서 변경
  - 행 추가/삭제 (상단 버튼, 하단 버튼, Ctrl+Enter 단축키)
  - 주요인물 필드: 캐스트 드롭다운 선택 + 직접 입력 가능
  - 하단 여유 공간으로 드롭다운 잘림 방지

- **전체일정 탭**
  - 시간, 일정명, 내용 입력
  - 행 추가/삭제

- **스태프/장비 탭**
  - 스태프 리스트 (역할, 이름, 연락처)
  - **피플에서 불러오기** 기능
  - 부서별 장비 입력 (연출, 조연출, 촬영, 조명, 음향, 미술, 의상, 제작, 기타)

- **캐스트 탭**
  - 캐스트 리스트 (배역, 연기자, 집합시간, 집합위치, 등장씬, 의상/소품, 연락처)
  - **피플에서 불러오기** 기능

### 2. 피플 관리 (People)
- 전체/스태프/캐스트 탭 필터링
- 부서별 그룹화
- **부서 선택 드롭다운**
- **역할 선택 드롭다운** (부서별 역할 목록)
  - 연출부: 감독, 연출, 조감독, 세컨, 써드, 스크립터, 현장스틸
  - 촬영부: 촬영감독, A카메라, B카메라, 포커스풀러, DIT, 짐벌, 드론, 스테디캠
  - 조명부: 조명감독, 조명팀장, 조명, 조명보조, 발전차
  - 음향부: 음향감독, 붐오퍼레이터, 동시녹음, 음향보조
  - 미술부: 미술감독, 미술팀장, 세트, 소품, 소품보조, 특수소품
  - 의상부: 의상감독, 의상팀장, 의상, 의상보조
  - 분장부: 분장감독, 분장, 헤어, 특수분장
  - 제작부: 프로듀서, 라인프로듀서, 제작부장, 제작, 제작보조, 회계, 차량, 로케매니저
  - 캐스트: 주연, 조연, 단역, 엑스트라, 스턴트
  - 기타: 스틸, VFX, 메이킹, 케이터링, 기타
- 이름, 연락처, 이메일, 비고 입력
- 검색 기능

### 3. 사이드바 네비게이션
- 대시보드, 피플, 일일촬영계획표, 설정 (한국어)

### 4. PDF 내보내기
- **PDF 생성 기능** (@react-pdf/renderer)
  - 가로 방향 A4 레이아웃
  - 잉크 절약형 디자인 (최소한의 테두리, 회색 톤 사용)
  - Pretendard 폰트 적용 (한글 지원)
  - 포함 섹션:
    - 헤더 (프로젝트명, 회차, 날짜) - 가운데 정렬
    - 기본정보 (시간, 장소, 날씨)
    - 촬영계획 테이블 (10개 컬럼)
    - 하단 3단 레이아웃 (전체일정, 스태프, 장비)
    - 캐스트 리스트 (별도 페이지)
  - 파일명 형식: `{프로젝트명}_{회차}회차_일일촬영계획표_{날짜}.pdf`

### 5. Excel 내보내기
- **Excel 생성 기능** (xlsx)
  - 기존 템플릿 파일을 활용한 데이터 채우기 방식
  - 템플릿 구조 그대로 유지하면서 데이터만 업데이트
  - 포함 정보:
    - 프로젝트명, 회차, 촬영일시
    - 촬영장소, Shooting Time
    - 촬영 씬 테이블 (촬영순서, S#, CUT, M/D/E/N, I/E, 시간, 장소, 내용, 주요인물)
  - 파일명 형식: `{프로젝트명}_{회차}회차_일일촬영계획표_{날짜}.xlsx`
  - 템플릿 파일: `public/template.xlsx`

## 미구현 기능
- [ ] 씬 관리 페이지
- [ ] 로케이션 관리 페이지
- [ ] 촬영일정 배포 기능 (이메일/SMS 등)
- [ ] 드래그앤드롭 순서 변경
- [ ] 대시보드 개선

## 환경 설정
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 실행 방법
```bash
npm run dev
# http://localhost:3000
```

## 마이그레이션 실행
Supabase SQL Editor에서 순서대로 실행:
1. `supabase/migrations/001_initial.sql`
2. `supabase/migrations/002_add_weather_columns.sql`
3. `supabase/migrations/003_add_schedule_staff_cast.sql`

## 최근 작업 이력

### 2026-01-11 (오후)
- PDF 내보내기 기능 구현
  - @react-pdf/renderer 라이브러리 설치
  - `src/lib/pdf/shooting-day-pdf.tsx` PDF 템플릿 컴포넌트 생성
  - `src/lib/pdf/generate-pdf.tsx` PDF 생성 및 다운로드 로직 구현
  - 일일촬영계획표 상세 페이지에 PDF 내보내기 버튼 연결
  - 잉크 절약형 가로 A4 레이아웃 디자인 적용
  - Pretendard 폰트 적용 (한글 지원)
  - PDF 제목에 프로젝트명 + 회차 표시 (가운데 정렬)
  - 집합시간, 촬영시간을 기본정보 섹션으로 이동
  - 기본정보 배치 최적화 (시간정보 → 장소정보 → 날씨정보 순서)
- Excel 내보내기 기능 구현
  - xlsx 라이브러리 사용
  - `src/lib/excel/generate-excel.ts` Excel 생성 로직 구현
  - 여러 시트로 구성 (촬영계획, 전체일정, 스태프, 장비, 캐스트)
  - 일일촬영계획표 상세 페이지에 Excel 내보내기 버튼 연결
- 탭 구조 개선 (실사용 피드백 반영)
  - 기본정보와 촬영계획을 별도 탭으로 분리
  - 탭 구조: 기본정보 → 촬영계획 → 전체일정 → 스태프/장비 → 캐스트 (5개)
- 촬영계획 테이블 UX 개선 (실사용 피드백 반영)
  - 표 하단에 넓은 클릭 영역의 "행 추가" 버튼 (전체 너비)
  - Ctrl+Enter 단축키로 행 추가 기능
  - 하단 여유 공간(h-64) 추가로 드롭다운 잘림 방지
  - 주요인물 필드를 Combobox로 변경 (캐스트 선택 + 직접 입력 가능)
  - 캐스트 드롭다운 필터링 개선 (마지막 입력값 기준 검색)
- 사이드바 네비게이션 순서 변경
  - 대시보드 → 피플 → 일일촬영계획표 순서로 변경
- Excel 내보내기 템플릿 방식으로 변경 (실사용 피드백 반영)
  - 기존 템플릿 파일(`뮤비 일촬표_템플릿-0.1.0.xlsx`)을 활용
  - 템플릿 구조 유지하면서 데이터만 채우기
  - 시간 값을 Excel 형식으로 변환
  - 템플릿 파일을 public 폴더에 저장하여 브라우저에서 fetch로 가져오기

### 2026-01-11 (오전)
- 피플 페이지 역할 선택 드롭다운 추가 (부서별 역할 목록)
- 스태프/캐스트 섹션에 "피플에서 불러오기" 기능 추가
- 프로젝트 피플 데이터를 일일촬영계획표에서 불러오기
- CLAUDE.md 파일 생성 (작업 기록용)
- 전체 UI 한국어화:
  - 네비게이션: "홈" → "대시보드", "촬영일정" → "일일촬영계획표"
  - "Day 1" → "1회차" (함수명은 shootingDay 유지)
  - "배포됨" → "저장됨"
  - "배포" 버튼 → "저장" 버튼
- 네비게이션에서 씬, 로케이션 메뉴 제거 (미구현 기능)

### 이전 작업
- 탭 네비게이션 구현 (기본정보, 전체일정, 스태프/장비, 캐스트)
- 전체일정/스태프/장비/캐스트 테이블 및 컴포넌트 생성
- 날씨 자동조회 기능 (다음 주소검색 + Open-Meteo API)
- 피플 관리 페이지 생성
- 사이드바 한국어화
