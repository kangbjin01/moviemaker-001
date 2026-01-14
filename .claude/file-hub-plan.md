# File Hub Feature Plan (MVP)

## Overview
프로젝트 파일 허브 - 촬영 관련 파일을 업로드하고 팀원들과 공유하는 기능

## MVP 핵심 목표
1. 드래그앤드롭 업로드 (폴더/태그/카테고리)
2. 웹에서 바로 미리보기 (PDF/이미지)
3. 촬영일(회차)·피플·로케이션 등과 연결

---

## Database Schema

### 1. project_files 테이블
```sql
CREATE TABLE project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  category TEXT, -- script, storyboard, moodboard, location, music, vfx, contract, reference, output
  tags TEXT[] DEFAULT '{}',
  description TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_project_files_project ON project_files(project_id);
CREATE INDEX idx_project_files_category ON project_files(category);
```

### 2. project_file_links 테이블 (연결 테이블)
```sql
CREATE TABLE project_file_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES project_files(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- shooting_day, person, location, scene
  entity_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_file_links_file ON project_file_links(file_id);
CREATE INDEX idx_file_links_entity ON project_file_links(entity_type, entity_id);
```

---

## Storage Setup
- Bucket: `project-files` (private)
- Path: `{orgId}/{projectId}/{uuid}/{originalFileName}`
- RLS 정책 적용

---

## Categories (카테고리)
| Key | Korean |
|-----|--------|
| script | 대본 |
| storyboard | 콘티 |
| moodboard | 무드보드 |
| location | 로케 |
| music | 음악 |
| vfx | VFX |
| contract | 계약/예산 |
| reference | 참고자료 |
| output | 출력물 |

---

## UI Structure

### 사이드바
- `파일` 메뉴 추가 (route: `/[org]/[project]/files`)

### 파일 허브 페이지
```
+------------------------------------------+
| 상단: 업로드 버튼 | 검색 | 필터(카테고리/회차/태그) |
+------------------------------------------+
| 좌측 사이드바   |  파일 리스트       | 프리뷰 패널 |
| - 카테고리      |  - 썸네일          | - PDF 뷰어  |
| - 전체          |  - 파일명          | - 이미지    |
| - 대본          |  - 카테고리        | - 메타정보  |
| - 콘티          |  - 연결된 회차     | - 태그      |
| - ...           |  - 업로더/날짜     | - 연결 정보 |
+------------------------------------------+
```

### 일일촬영계획표 상세 페이지
- `파일` 탭 추가
- 해당 촬영일에 연결된 파일만 표시
- "여기에 업로드" 버튼

---

## Implementation Steps

### Phase 1: Foundation
- [x] 계획 수립 및 memory 저장
- [x] DB 스키마 생성 (SQL) - project_files, project_file_links 테이블 + RLS
- [x] Supabase Storage 버킷 설정 - project-files 버킷 + 정책

### Phase 2: Basic UI
- [x] 사이드바에 파일 메뉴 추가 - sidebar.tsx에 FolderOpen 아이콘
- [x] 파일 허브 페이지 기본 레이아웃 - /[org]/[project]/files/page.tsx
- [x] 파일 업로드 컴포넌트 (react-dropzone) - 드래그앤드롭 + 카테고리 선택

### Phase 3: Core Features
- [x] 파일 리스트 및 필터 - 카테고리 필터, 검색
- [x] 파일 프리뷰 (PDF/이미지) - signed URL + iframe/img
- [x] 다운로드 기능 - signed URL + download attribute

### Phase 4: Integration
- [ ] 촬영일과 파일 연결
- [ ] 촬영일 상세 페이지에 파일 탭 추가

---

## Tech Stack
- Upload: react-dropzone
- Storage: Cloudflare R2 (S3 compatible)
  - Bucket: moviemaker-01-files
  - SDK: @aws-sdk/client-s3, @aws-sdk/s3-request-presigner
  - API Routes: /api/files/upload-url, /api/files/signed-url
- Viewer:
  - PDF: react-pdf (페이지 넘김, 줌 지원)
  - Image: native img tag
  - Office (docx, xlsx, pptx): Microsoft Office Online Viewer
  - Component: src/components/file-viewer/index.tsx
- State: React useState

---

## MVP 제외 항목 (나중에)
- 버전 관리
- 외부 공유 링크
- 코멘트/승인 워크플로우
- 대용량 resumable 업로드
- OCR/자동 태깅/AI 요약
