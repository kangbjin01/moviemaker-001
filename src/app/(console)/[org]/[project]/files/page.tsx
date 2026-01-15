// @ts-nocheck
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { AppShell } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Upload,
  Search,
  FileText,
  Image,
  Film,
  Music,
  File,
  Loader2,
  FolderOpen,
  X,
  Download,
  Eye,
  Trash2,
  ChevronDown,
  ChevronRight,
  Share2,
  Link,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { FileViewer } from '@/components/file-viewer'

// 부서 정의
const DEPARTMENTS = [
  { key: 'all', label: '전체' },
  { key: 'unassigned', label: '미지정' },
  { key: 'direction', label: '연출부' },
  { key: 'production', label: '제작부' },
  { key: 'camera', label: '촬영부' },
  { key: 'lighting', label: '조명부' },
  { key: 'art', label: '미술부' },
  { key: 'costume', label: '의상부' },
  { key: 'makeup', label: '분장부' },
  { key: 'sound', label: '음향부' },
  { key: 'editing', label: '편집부' },
  { key: 'vfx', label: 'VFX' },
  { key: 'casting', label: '캐스팅' },
] as const

// 문서 종류 정의
const DOC_TYPES = [
  { key: 'all', label: '전체' },
  { key: 'unassigned', label: '미지정' },
  { key: 'script', label: '대본' },
  { key: 'storyboard', label: '콘티' },
  { key: 'plan', label: '계획서' },
  { key: 'report', label: '보고서' },
  { key: 'reference', label: '참고자료' },
  { key: 'contract', label: '계약서' },
  { key: 'budget', label: '예산' },
  { key: 'schedule', label: '스케줄' },
  { key: 'image', label: '이미지' },
  { key: 'video', label: '영상' },
  { key: 'audio', label: '음악/사운드' },
] as const

interface ProjectFile {
  id: string
  original_name: string
  mime_type: string | null
  size_bytes: number | null
  department: string | null
  doc_type: string | null
  tags: string[]
  uploaded_by: string | null
  created_at: string
  storage_path: string
}

export default function FilesPage() {
  const params = useParams()
  const org = params.org as string
  const project = params.project as string

  const [files, setFiles] = useState<ProjectFile[]>([])
  const [projectId, setProjectId] = useState<string | null>(null)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedDocType, setSelectedDocType] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [isViewerOpen, setIsViewerOpen] = useState(false)

  // 업로드 관련 상태
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [uploadDepartment, setUploadDepartment] = useState('direction')
  const [uploadDocType, setUploadDocType] = useState('reference')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string[]>([])

  // 사이드바 접기 상태
  const [isDepartmentOpen, setIsDepartmentOpen] = useState(true)
  const [isDocTypeOpen, setIsDocTypeOpen] = useState(true)

  // 공유 관련 상태
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [shareEnabled, setShareEnabled] = useState(false)
  const [isShareLoading, setIsShareLoading] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  // 프로젝트 스토리지 제한 (2GB)
  const STORAGE_LIMIT_BYTES = 2 * 1024 * 1024 * 1024 // 2GB

  // 현재 사용 중인 스토리지 용량 계산
  const totalStorageUsed = useMemo(() => {
    return files.reduce((sum, file) => sum + (file.size_bytes || 0), 0)
  }, [files])

  // 스토리지 사용량 퍼센트
  const storageUsagePercent = useMemo(() => {
    return Math.min((totalStorageUsed / STORAGE_LIMIT_BYTES) * 100, 100)
  }, [totalStorageUsed])

  // 프로젝트 정보 및 파일 목록 로드
  useEffect(() => {
    async function fetchData() {
      const { data: projectData } = await supabase
        .from('projects')
        .select('id, organization_id')
        .eq('slug', project)
        .single()

      if (!projectData) {
        setIsLoading(false)
        return
      }

      setProjectId(projectData.id)
      setOrgId(projectData.organization_id)

      const { data: filesData } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectData.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      setFiles(filesData || [])
      setIsLoading(false)
    }

    fetchData()
  }, [project, supabase])

  // 파일 업로드 핸들러 (R2)
  const handleUpload = useCallback(async (acceptedFiles: File[]) => {
    if (!projectId || !orgId) return

    // 업로드할 파일들의 총 크기 계산
    const totalUploadSize = acceptedFiles.reduce((sum, file) => sum + file.size, 0)

    // 용량 초과 체크
    if (totalStorageUsed + totalUploadSize > STORAGE_LIMIT_BYTES) {
      const remainingSpace = STORAGE_LIMIT_BYTES - totalStorageUsed
      const remainingMB = (remainingSpace / (1024 * 1024)).toFixed(1)
      const uploadSizeMB = (totalUploadSize / (1024 * 1024)).toFixed(1)
      alert(`프로젝트 저장 용량을 초과합니다.\n\n현재 남은 용량: ${remainingMB} MB\n업로드 시도: ${uploadSizeMB} MB\n\n프로젝트당 최대 2GB까지 업로드할 수 있습니다.`)
      return
    }

    setIsUploading(true)
    setUploadProgress([])

    const { data: { user } } = await supabase.auth.getUser()

    for (const file of acceptedFiles) {
      try {
        setUploadProgress(prev => [...prev, `${file.name} 업로드 중...`])

        const fileId = crypto.randomUUID()
        const storagePath = `${orgId}/${projectId}/${fileId}/${file.name}`

        // R2 presigned URL 가져오기
        const urlResponse = await fetch('/api/files/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
            storagePath,
          }),
        })

        if (!urlResponse.ok) {
          setUploadProgress(prev => [...prev, `❌ ${file.name}: URL 생성 실패`])
          continue
        }

        const { uploadUrl } = await urlResponse.json()

        // R2에 직접 업로드
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
          },
        })

        if (!uploadResponse.ok) {
          setUploadProgress(prev => [...prev, `❌ ${file.name}: 업로드 실패`])
          continue
        }

        // DB에 메타데이터 저장
        const { error: dbError } = await supabase
          .from('project_files')
          .insert({
            id: fileId,
            project_id: projectId,
            org_id: orgId,
            storage_path: storagePath,
            original_name: file.name,
            mime_type: file.type || null,
            size_bytes: file.size,
            department: uploadDepartment,
            doc_type: uploadDocType,
            tags: [],
            uploaded_by: user?.id,
          })

        if (dbError) {
          setUploadProgress(prev => [...prev, `❌ ${file.name}: ${dbError.message}`])
          continue
        }

        setUploadProgress(prev => {
          const updated = prev.filter(p => !p.includes(file.name + ' 업로드 중'))
          return [...updated, `✅ ${file.name} 완료`]
        })

        // 파일 목록 갱신
        setFiles(prev => [{
          id: fileId,
          original_name: file.name,
          mime_type: file.type || null,
          size_bytes: file.size,
          department: uploadDepartment,
          doc_type: uploadDocType,
          tags: [],
          uploaded_by: user?.id || null,
          created_at: new Date().toISOString(),
          storage_path: storagePath,
        }, ...prev])

      } catch (err) {
        setUploadProgress(prev => [...prev, `❌ ${file.name}: 오류 발생`])
      }
    }

    setIsUploading(false)
    // 2초 후 모달 닫기
    setTimeout(() => {
      setIsUploadModalOpen(false)
      setUploadProgress([])
    }, 2000)
  }, [projectId, orgId, uploadDepartment, uploadDocType, supabase, totalStorageUsed, STORAGE_LIMIT_BYTES])

  // Dropzone 설정
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleUpload,
    disabled: isUploading,
  })

  // 파일이 뷰어로 볼 수 있는지 확인
  const isViewable = useCallback((file: ProjectFile) => {
    if (!file) return false
    const mime = (file.mime_type || '').toLowerCase()
    const name = (file.original_name || '').toLowerCase()
    if (!mime && !name) return false
    return (
      mime.startsWith('image/') ||
      mime.includes('pdf') ||
      mime.includes('word') ||
      mime.includes('spreadsheet') ||
      mime.includes('presentation') ||
      mime.includes('officedocument') ||
      name.endsWith('.pdf') ||
      name.endsWith('.docx') ||
      name.endsWith('.xlsx') ||
      name.endsWith('.pptx') ||
      name.endsWith('.doc') ||
      name.endsWith('.xls') ||
      name.endsWith('.ppt') ||
      name.endsWith('.png') ||
      name.endsWith('.jpg') ||
      name.endsWith('.jpeg') ||
      name.endsWith('.gif') ||
      name.endsWith('.webp')
    )
  }, [])

  // 파일 선택 시 프리뷰 URL 가져오기 (R2)
  const handleSelectFile = useCallback(async (file: ProjectFile) => {
    setSelectedFile(file)
    setPreviewUrl(null)

    // 뷰어로 볼 수 있는 파일인 경우 URL 생성
    if (isViewable(file)) {
      setIsLoadingPreview(true)
      try {
        const response = await fetch('/api/files/signed-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storagePath: file.storage_path, expiresIn: 3600 }),
        })

        if (response.ok) {
          const { signedUrl } = await response.json()
          setPreviewUrl(signedUrl)
        }
      } catch (err) {
        console.error('Failed to get preview URL:', err)
      }
      setIsLoadingPreview(false)
    }
  }, [isViewable])

  // 파일 다운로드 함수
  const downloadFile = useCallback(async (file: ProjectFile) => {
    try {
      const response = await fetch('/api/files/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storagePath: file.storage_path, expiresIn: 60 }),
      })

      if (response.ok) {
        const { signedUrl } = await response.json()
        const link = document.createElement('a')
        link.href = signedUrl
        link.download = file.original_name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (err) {
      console.error('Failed to download file:', err)
    }
  }, [])

  // 다운로드 핸들러 (R2)
  const handleDownload = useCallback(async () => {
    if (!selectedFile) return
    await downloadFile(selectedFile)
  }, [selectedFile, downloadFile])

  // 파일 뷰어 열기
  const openViewer = useCallback(async (file: ProjectFile) => {
    await handleSelectFile(file)
    setTimeout(() => setIsViewerOpen(true), 100)
  }, [handleSelectFile])

  // 부서 수정 핸들러
  const handleUpdateDepartment = useCallback(async (fileId: string, newDepartment: string) => {
    try {
      // 'unassigned'는 null로 저장
      const valueToSave = newDepartment === 'unassigned' ? null : newDepartment
      const { error } = await supabase
        .from('project_files')
        .update({ department: valueToSave })
        .eq('id', fileId)

      if (!error) {
        setFiles(prev => prev.map(f =>
          f.id === fileId ? { ...f, department: valueToSave } : f
        ))
        if (selectedFile?.id === fileId) {
          setSelectedFile(prev => prev ? { ...prev, department: valueToSave } : null)
        }
      }
    } catch (err) {
      console.error('Failed to update department:', err)
    }
  }, [supabase, selectedFile])

  // 문서 종류 수정 핸들러
  const handleUpdateDocType = useCallback(async (fileId: string, newDocType: string) => {
    try {
      // 'unassigned'는 null로 저장
      const valueToSave = newDocType === 'unassigned' ? null : newDocType
      const { error } = await supabase
        .from('project_files')
        .update({ doc_type: valueToSave })
        .eq('id', fileId)

      if (!error) {
        setFiles(prev => prev.map(f =>
          f.id === fileId ? { ...f, doc_type: valueToSave } : f
        ))
        if (selectedFile?.id === fileId) {
          setSelectedFile(prev => prev ? { ...prev, doc_type: valueToSave } : null)
        }
      }
    } catch (err) {
      console.error('Failed to update doc_type:', err)
    }
  }, [supabase, selectedFile])

  // 파일 삭제 핸들러
  const handleDeleteFile = useCallback(async (file: ProjectFile) => {
    if (!confirm(`"${file.original_name}" 파일을 삭제하시겠습니까?`)) {
      return
    }

    try {
      // Soft delete (deleted_at 설정)
      const { error } = await supabase
        .from('project_files')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', file.id)

      if (error) {
        alert('파일 삭제에 실패했습니다.')
        console.error('Failed to delete file:', error)
        return
      }

      // 로컬 상태에서 제거
      setFiles(prev => prev.filter(f => f.id !== file.id))

      // 선택된 파일이 삭제된 경우 선택 해제
      if (selectedFile?.id === file.id) {
        setSelectedFile(null)
        setPreviewUrl(null)
      }
    } catch (err) {
      alert('파일 삭제 중 오류가 발생했습니다.')
      console.error('Failed to delete file:', err)
    }
  }, [supabase, selectedFile])

  // 공유 설정 로드
  const loadShareSettings = useCallback(async () => {
    if (!projectId) return
    try {
      const response = await fetch(`/api/projects/${projectId}/share`)
      if (response.ok) {
        const data = await response.json()
        setShareToken(data.shareToken)
        setShareEnabled(data.shareEnabled)
      }
    } catch (err) {
      console.error('Failed to load share settings:', err)
    }
  }, [projectId])

  // 공유 토글
  const handleShareToggle = useCallback(async (action: 'enable' | 'disable' | 'regenerate') => {
    if (!projectId) return
    setIsShareLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (response.ok) {
        const data = await response.json()
        setShareToken(data.shareToken)
        setShareEnabled(data.shareEnabled)
      }
    } catch (err) {
      console.error('Failed to update share settings:', err)
    }
    setIsShareLoading(false)
  }, [projectId])

  // 공유 링크 복사
  const copyShareLink = useCallback(() => {
    if (!shareToken) return
    const shareUrl = `${window.location.origin}/share/${shareToken}`
    navigator.clipboard.writeText(shareUrl)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }, [shareToken])

  // 공유 모달 열 때 설정 로드
  useEffect(() => {
    if (isShareModalOpen && projectId) {
      loadShareSettings()
    }
  }, [isShareModalOpen, projectId, loadShareSettings])

  // 필터링된 파일 목록
  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      // null 값은 'unassigned'로 취급
      const fileDepartment = file.department || 'unassigned'
      const fileDocType = file.doc_type || 'unassigned'

      const matchesDepartment =
        selectedDepartment === 'all' || fileDepartment === selectedDepartment
      const matchesDocType =
        selectedDocType === 'all' || fileDocType === selectedDocType
      const matchesSearch =
        !searchQuery ||
        file.original_name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesDepartment && matchesDocType && matchesSearch
    })
  }, [files, selectedDepartment, selectedDocType, searchQuery])

  // 파일 아이콘 결정
  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return File
    if (mimeType.startsWith('image/')) return Image
    if (mimeType.startsWith('video/')) return Film
    if (mimeType.startsWith('audio/')) return Music
    if (mimeType.includes('pdf')) return FileText
    return File
  }

  // 파일 크기 포맷
  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // 날짜 포맷
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <AppShell org={org} project={project} title="파일">
      <div className="flex h-full">
        {/* 좌측: 필터 사이드바 */}
        <div className="w-48 border-r border-border p-4 overflow-y-auto">
          {/* 부서 필터 */}
          <button
            onClick={() => setIsDepartmentOpen(!isDepartmentOpen)}
            className="flex w-full items-center justify-between mb-2 text-xs font-semibold uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>부서</span>
            {isDepartmentOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          {isDepartmentOpen && (
            <nav className="space-y-0.5 mb-4">
              {DEPARTMENTS.map((dept) => (
                <button
                  key={dept.key}
                  onClick={() => setSelectedDepartment(dept.key)}
                  className={`flex w-full items-center rounded-md px-2 py-1.5 text-sm transition-colors ${
                    selectedDepartment === dept.key
                      ? 'bg-secondary font-medium text-foreground'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  {dept.label}
                </button>
              ))}
            </nav>
          )}

          {/* 문서 종류 필터 */}
          <button
            onClick={() => setIsDocTypeOpen(!isDocTypeOpen)}
            className="flex w-full items-center justify-between mb-2 text-xs font-semibold uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>문서 종류</span>
            {isDocTypeOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          {isDocTypeOpen && (
            <nav className="space-y-0.5">
              {DOC_TYPES.map((docType) => (
                <button
                  key={docType.key}
                  onClick={() => setSelectedDocType(docType.key)}
                  className={`flex w-full items-center rounded-md px-2 py-1.5 text-sm transition-colors ${
                    selectedDocType === docType.key
                      ? 'bg-secondary font-medium text-foreground'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  {docType.label}
                </button>
              ))}
            </nav>
          )}

          {/* 스토리지 사용량 */}
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
              저장 용량
            </p>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  storageUsagePercent > 90 ? 'bg-destructive' : storageUsagePercent > 70 ? 'bg-yellow-500' : 'bg-primary'
                }`}
                style={{ width: `${storageUsagePercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatFileSize(totalStorageUsed)} / 2 GB
            </p>
          </div>
        </div>

        {/* 중앙: 파일 리스트 */}
        <div className="flex-1 flex flex-col">
          {/* 상단 액션 바 */}
          <div className="flex items-center gap-4 border-b border-border p-4">
            <Button onClick={() => setIsUploadModalOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              업로드
            </Button>
            <Button variant="outline" onClick={() => setIsShareModalOpen(true)}>
              <Share2 className="mr-2 h-4 w-4" />
              공유
            </Button>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="파일명으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* 파일 리스트 */}
          <div className="flex-1 overflow-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredFiles.length > 0 ? (
              <div className="space-y-2">
                {filteredFiles.map((file) => {
                  const FileIcon = getFileIcon(file.mime_type)
                  return (
                    <div
                      key={file.id}
                      onClick={() => handleSelectFile(file)}
                      className={`flex w-full items-center gap-4 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-secondary ${
                        selectedFile?.id === file.id
                          ? 'border-primary bg-secondary'
                          : 'border-border'
                      }`}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                        <FileIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium">{file.original_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.size_bytes)} · {formatDate(file.created_at)}
                        </p>
                      </div>
                      {/* 부서 선택 */}
                      <select
                        value={file.department || 'unassigned'}
                        onChange={(e) => {
                          e.stopPropagation()
                          handleUpdateDepartment(file.id, e.target.value)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border border-border bg-background px-2 py-1 text-xs"
                      >
                        {DEPARTMENTS.filter(d => d.key !== 'all').map((dept) => (
                          <option key={dept.key} value={dept.key}>
                            {dept.label}
                          </option>
                        ))}
                      </select>
                      {/* 문서 종류 선택 */}
                      <select
                        value={file.doc_type || 'unassigned'}
                        onChange={(e) => {
                          e.stopPropagation()
                          handleUpdateDocType(file.id, e.target.value)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border border-border bg-background px-2 py-1 text-xs"
                      >
                        {DOC_TYPES.filter(d => d.key !== 'all').map((docType) => (
                          <option key={docType.key} value={docType.key}>
                            {docType.label}
                          </option>
                        ))}
                      </select>
                      {/* 액션 버튼 */}
                      <div className="flex items-center gap-1">
                        {isViewable(file) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openViewer(file)
                            }}
                            className="rounded p-1.5 hover:bg-background"
                            title="뷰어로 보기"
                          >
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            downloadFile(file)
                          }}
                          className="rounded p-1.5 hover:bg-background"
                          title="다운로드"
                        >
                          <Download className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteFile(file)
                          }}
                          className="rounded p-1.5 hover:bg-destructive/10"
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 font-semibold">파일이 없습니다</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  파일을 업로드하여 팀원들과 공유하세요
                </p>
                <Button onClick={() => setIsUploadModalOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  첫 파일 업로드
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 우측: 프리뷰 패널 */}
        {selectedFile && (
          <div className="w-80 border-l border-border p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">파일 정보</h3>
              <button
                onClick={() => setSelectedFile(null)}
                className="rounded-lg p-1 hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 프리뷰 영역 */}
            <div className="mb-4 rounded-lg border border-border bg-secondary overflow-hidden">
              {isLoadingPreview ? (
                <div className="p-8 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : previewUrl && selectedFile.mime_type?.startsWith('image/') ? (
                <img
                  src={previewUrl}
                  alt={selectedFile.original_name}
                  className="w-full h-auto max-h-64 object-contain"
                />
              ) : previewUrl && selectedFile.mime_type?.includes('pdf') ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-64"
                  title={selectedFile.original_name}
                />
              ) : (
                <div className="p-8 flex items-center justify-center">
                  {(() => {
                    const FileIcon = getFileIcon(selectedFile.mime_type)
                    return <FileIcon className="h-16 w-16 text-muted-foreground" />
                  })()}
                </div>
              )}
            </div>

            {/* 메타 정보 */}
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">파일명</p>
                <p className="text-sm font-medium break-all">{selectedFile.original_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">크기</p>
                <p className="text-sm">{formatFileSize(selectedFile.size_bytes)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">업로드일</p>
                <p className="text-sm">{formatDate(selectedFile.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">부서</p>
                <Badge variant="secondary" className="mt-1">
                  {DEPARTMENTS.find((d) => d.key === (selectedFile.department || 'unassigned'))?.label || '미지정'}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">문서 종류</p>
                <Badge variant="secondary" className="mt-1">
                  {DOC_TYPES.find((d) => d.key === (selectedFile.doc_type || 'unassigned'))?.label || '미지정'}
                </Badge>
              </div>
              {selectedFile.tags && selectedFile.tags.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">태그</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedFile.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 액션 버튼 */}
            <div className="mt-6 space-y-2">
              {isViewable(selectedFile) && previewUrl && (
                <Button className="w-full" onClick={() => setIsViewerOpen(true)}>
                  <Eye className="mr-2 h-4 w-4" />
                  뷰어로 보기
                </Button>
              )}
              <Button className="w-full" variant="outline" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                다운로드
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => handleDeleteFile(selectedFile)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                삭제
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 파일 뷰어 */}
      {isViewerOpen && selectedFile && previewUrl && (
        <FileViewer
          url={previewUrl}
          fileName={selectedFile.original_name}
          mimeType={selectedFile.mime_type}
          onClose={() => setIsViewerOpen(false)}
          onDownload={handleDownload}
        />
      )}

      {/* 업로드 모달 */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-background p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">파일 업로드</h2>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="rounded-lg p-1 hover:bg-secondary"
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 부서 선택 */}
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">부서</label>
              <select
                value={uploadDepartment}
                onChange={(e) => setUploadDepartment(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                disabled={isUploading}
              >
                {DEPARTMENTS.filter(d => d.key !== 'all').map((dept) => (
                  <option key={dept.key} value={dept.key}>
                    {dept.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 문서 종류 선택 */}
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">문서 종류</label>
              <select
                value={uploadDocType}
                onChange={(e) => setUploadDocType(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                disabled={isUploading}
              >
                {DOC_TYPES.filter(d => d.key !== 'all').map((docType) => (
                  <option key={docType.key} value={docType.key}>
                    {docType.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 드롭존 */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
            >
              <input {...getInputProps()} />
              {isUploading ? (
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  {isDragActive ? (
                    <p className="text-sm">파일을 여기에 놓으세요</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      파일을 드래그하거나 클릭하여 선택하세요
                    </p>
                  )}
                </>
              )}
            </div>

            {/* 업로드 진행 상황 */}
            {uploadProgress.length > 0 && (
              <div className="mt-4 space-y-1 max-h-32 overflow-auto">
                {uploadProgress.map((msg, i) => (
                  <p key={i} className="text-sm">
                    {msg}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 공유 모달 */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">파일 공유</h2>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="rounded-lg p-1 hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              공유 링크를 통해 외부 사용자가 이 프로젝트의 파일을 볼 수 있습니다.
              (뷰어 전용, 다운로드 불가)
            </p>

            {/* 공유 상태 토글 */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary mb-4">
              <div className="flex items-center gap-3">
                <Link className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">외부 공유</span>
              </div>
              <button
                onClick={() => handleShareToggle(shareEnabled ? 'disable' : 'enable')}
                disabled={isShareLoading}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  shareEnabled ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-600'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${
                    shareEnabled ? 'left-7 bg-white' : 'left-1 bg-white shadow-sm'
                  }`}
                />
              </button>
            </div>

            {/* 공유 링크 */}
            {shareEnabled && shareToken && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/share/${shareToken}`}
                    className="text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyShareLink}
                    className="shrink-0"
                  >
                    {isCopied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleShareToggle('regenerate')}
                  disabled={isShareLoading}
                  className="text-muted-foreground"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isShareLoading ? 'animate-spin' : ''}`} />
                  링크 재생성
                </Button>
                <p className="text-xs text-muted-foreground">
                  링크를 재생성하면 기존 링크는 더 이상 작동하지 않습니다.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  )
}
