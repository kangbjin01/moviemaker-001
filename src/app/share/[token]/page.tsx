// @ts-nocheck
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  FileText,
  Image,
  Film,
  Music,
  File,
  Loader2,
  FolderOpen,
  Eye,
  X,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Search,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

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

interface SharedFile {
  id: string
  original_name: string
  mime_type: string | null
  size_bytes: number | null
  department: string | null
  doc_type: string | null
  storage_path: string
  created_at: string
}

interface SharedProject {
  id: string
  name: string
}

// 뷰어 전용 컴포넌트 (다운로드 없음)
function ViewOnlyViewer({
  url,
  fileName,
  mimeType,
  onClose,
}: {
  url: string
  fileName: string
  mimeType: string | null
  onClose: () => void
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [scale, setScale] = useState(100)

  const isPdf = mimeType?.includes('pdf')
  const isImage = mimeType?.startsWith('image/')
  const isOffice =
    mimeType?.includes('word') ||
    mimeType?.includes('spreadsheet') ||
    mimeType?.includes('presentation') ||
    mimeType?.includes('officedocument') ||
    fileName.endsWith('.docx') ||
    fileName.endsWith('.xlsx') ||
    fileName.endsWith('.pptx')

  const zoomIn = () => setScale((prev) => Math.min(prev + 25, 200))
  const zoomOut = () => setScale((prev) => Math.max(prev - 25, 50))

  const officeViewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95">
      <div className="flex items-center justify-between bg-zinc-900 px-4 py-3 border-b border-zinc-700">
        <div className="flex items-center gap-4">
          <h3 className="font-medium truncate max-w-md text-white">{fileName}</h3>
          <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">뷰어 전용</span>
        </div>
        <div className="flex items-center gap-2">
          {(isPdf || isImage) && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={zoomOut}
                disabled={scale <= 50}
                className="text-zinc-300 hover:text-white hover:bg-zinc-700"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm w-16 text-center text-zinc-300">{scale}%</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={zoomIn}
                disabled={scale >= 200}
                className="text-zinc-300 hover:text-white hover:bg-zinc-700"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <div className="w-px h-6 bg-zinc-600 mx-2" />
            </>
          )}
          {isOffice && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(officeViewerUrl, '_blank')}
                className="text-zinc-300 hover:text-white hover:bg-zinc-700"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                새 탭
              </Button>
              <div className="w-px h-6 bg-zinc-600 mx-2" />
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-zinc-300 hover:text-white hover:bg-zinc-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}

        {isPdf && (
          <iframe
            src={`${url}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
            className="bg-white rounded-lg shadow-2xl"
            style={{
              width: `${scale}%`,
              height: '100%',
              maxWidth: '100%',
            }}
            title={fileName}
            onLoad={() => setIsLoading(false)}
          />
        )}

        {isImage && (
          <img
            src={url}
            alt={fileName}
            className="max-h-full object-contain rounded-lg shadow-2xl transition-transform"
            style={{
              transform: `scale(${scale / 100})`,
            }}
            onLoad={() => setIsLoading(false)}
          />
        )}

        {isOffice && (
          <iframe
            src={officeViewerUrl}
            className="w-full h-full bg-white rounded-lg shadow-2xl"
            title={fileName}
            onLoad={() => setIsLoading(false)}
          />
        )}

        {!isPdf && !isImage && !isOffice && (
          <div className="text-center text-white">
            <p>이 파일 형식은 미리보기를 지원하지 않습니다.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SharePage({ params }: { params: { token: string } }) {
  const { token } = params

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [project, setProject] = useState<SharedProject | null>(null)
  const [files, setFiles] = useState<SharedFile[]>([])
  const [selectedFile, setSelectedFile] = useState<SharedFile | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isViewerOpen, setIsViewerOpen] = useState(false)

  // 필터 상태
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedDocType, setSelectedDocType] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isDepartmentOpen, setIsDepartmentOpen] = useState(true)
  const [isDocTypeOpen, setIsDocTypeOpen] = useState(true)

  // 데이터 로드
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/share/${token}`)

        if (!response.ok) {
          const data = await response.json()
          setError(data.error || '공유 링크가 유효하지 않습니다.')
          setIsLoading(false)
          return
        }

        const data = await response.json()
        setProject(data.project)
        setFiles(data.files)
      } catch (err) {
        setError('데이터를 불러오는 중 오류가 발생했습니다.')
      }
      setIsLoading(false)
    }

    fetchData()
  }, [token])

  // 파일이 뷰어로 볼 수 있는지 확인
  const isViewable = useCallback((file: SharedFile) => {
    if (!file.mime_type && !file.original_name) return false
    const mime = file.mime_type || ''
    const name = file.original_name.toLowerCase()
    return (
      mime.startsWith('image/') ||
      mime.includes('pdf') ||
      mime.includes('word') ||
      mime.includes('spreadsheet') ||
      mime.includes('presentation') ||
      mime.includes('officedocument') ||
      name.endsWith('.docx') ||
      name.endsWith('.xlsx') ||
      name.endsWith('.pptx')
    )
  }, [])

  // 뷰어 열기
  const openViewer = useCallback(
    async (file: SharedFile) => {
      setSelectedFile(file)
      setPreviewUrl(null)

      if (isViewable(file)) {
        try {
          const response = await fetch(`/api/share/${token}/signed-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ storagePath: file.storage_path }),
          })

          if (response.ok) {
            const { signedUrl } = await response.json()
            setPreviewUrl(signedUrl)
            setIsViewerOpen(true)
          }
        } catch (err) {
          console.error('Failed to get preview URL:', err)
        }
      }
    },
    [token, isViewable]
  )

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

  // 필터링된 파일 목록
  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <FolderOpen className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-xl font-semibold mb-2">접근할 수 없습니다</h1>
        <p className="text-muted-foreground">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <FolderOpen className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-lg font-semibold">{project?.name}</h1>
              <p className="text-sm text-muted-foreground">공유된 파일 목록 (뷰어 전용)</p>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <div className="flex h-[calc(100vh-65px)]">
        {/* 좌측: 필터 사이드바 */}
        <div className="w-48 border-r border-border p-4 overflow-y-auto bg-card">
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
        </div>

        {/* 우측: 파일 리스트 */}
        <div className="flex-1 flex flex-col">
          {/* 검색 바 */}
          <div className="p-4 border-b border-border">
            <div className="relative max-w-md">
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
            {filteredFiles.length > 0 ? (
              <div className="space-y-2">
                {filteredFiles.map((file) => {
                  const FileIcon = getFileIcon(file.mime_type)
                  return (
                    <div
                      key={file.id}
                      className="flex items-center gap-4 rounded-lg border border-border p-3 bg-card hover:bg-secondary transition-colors"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                        <FileIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium">{file.original_name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{formatFileSize(file.size_bytes)}</span>
                          <span>·</span>
                          <span>{formatDate(file.created_at)}</span>
                          {file.department && (
                            <>
                              <span>·</span>
                              <span className="text-xs bg-secondary px-1.5 py-0.5 rounded">
                                {DEPARTMENTS.find((d) => d.key === file.department)?.label || file.department}
                              </span>
                            </>
                          )}
                          {file.doc_type && (
                            <span className="text-xs bg-secondary px-1.5 py-0.5 rounded">
                              {DOC_TYPES.find((d) => d.key === file.doc_type)?.label || file.doc_type}
                            </span>
                          )}
                        </div>
                      </div>
                      {isViewable(file) && (
                        <Button variant="outline" size="sm" onClick={() => openViewer(file)}>
                          <Eye className="h-4 w-4 mr-2" />
                          보기
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 font-semibold">파일이 없습니다</h3>
                <p className="text-sm text-muted-foreground">
                  {files.length > 0 ? '검색 조건에 맞는 파일이 없습니다.' : '공유된 파일이 없습니다.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 뷰어 */}
      {isViewerOpen && selectedFile && previewUrl && (
        <ViewOnlyViewer
          url={previewUrl}
          fileName={selectedFile.original_name}
          mimeType={selectedFile.mime_type}
          onClose={() => setIsViewerOpen(false)}
        />
      )}
    </div>
  )
}
