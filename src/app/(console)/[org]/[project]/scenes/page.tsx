'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { AppShell } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Plus,
  Search,
  FileText,
  Loader2,
  Trash2,
  GripVertical,
  MapPin,
  Clock,
  Sun,
  Moon,
  Sunrise,
  Sunset,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useScenes, type Scene, type TimeOfDay, type LocationType } from '@/modules/scene-master'

// 한글 입력을 위한 EditableInput 컴포넌트
function EditableInput({
  value,
  onSave,
  placeholder,
  className,
  type = 'text',
  step,
}: {
  value: string | number | null
  onSave: (value: string) => void
  placeholder?: string
  className?: string
  type?: 'text' | 'number'
  step?: string
}) {
  const [localValue, setLocalValue] = useState(String(value ?? ''))
  const inputRef = useRef<HTMLInputElement>(null)

  // 외부 value가 변경되면 로컬 상태 동기화
  useEffect(() => {
    setLocalValue(String(value ?? ''))
  }, [value])

  const handleBlur = () => {
    if (localValue !== String(value ?? '')) {
      onSave(localValue)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur()
    }
  }

  return (
    <Input
      ref={inputRef}
      type={type}
      step={step}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={className}
    />
  )
}

export default function ScenesPage() {
  const params = useParams()
  const org = params.org as string
  const project = params.project as string

  const [projectId, setProjectId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddingScene, setIsAddingScene] = useState(false)
  const [newSceneNumber, setNewSceneNumber] = useState('')

  const supabase = createClient()

  // 프로젝트 ID 조회
  useEffect(() => {
    async function fetchProjectId() {
      const { data } = await supabase
        .from('projects')
        .select('id')
        .eq('slug', project)
        .single<{ id: string }>()

      if (data) {
        setProjectId(data.id)
      }
    }
    fetchProjectId()
  }, [project, supabase])

  const { scenes, isLoading, addScene, updateScene, deleteScene } = useScenes(projectId)

  // 검색 필터링
  const filteredScenes = scenes.filter(scene => {
    const query = searchQuery.toLowerCase()
    return (
      scene.scene_number.toLowerCase().includes(query) ||
      scene.scene_name?.toLowerCase().includes(query) ||
      scene.location?.name?.toLowerCase().includes(query)
    )
  })

  // 새 씬 추가
  const handleAddScene = async () => {
    if (!projectId || !newSceneNumber.trim()) return

    await addScene({
      project_id: projectId,
      scene_number: newSceneNumber.trim(),
    })

    setNewSceneNumber('')
    setIsAddingScene(false)
  }

  // 씬 필드 업데이트
  const handleUpdateScene = async (id: string, field: string, value: string | null) => {
    await updateScene(id, { [field]: value || null })
  }

  // 시간대 아이콘
  const getTimeIcon = (time: TimeOfDay | null) => {
    switch (time) {
      case 'D': return <Sun className="h-4 w-4 text-amber-500" />
      case 'N': return <Moon className="h-4 w-4 text-indigo-500" />
      case 'M': return <Sunrise className="h-4 w-4 text-orange-400" />
      case 'E': return <Sunset className="h-4 w-4 text-orange-500" />
      default: return null
    }
  }

  if (isLoading) {
    return (
      <AppShell org={org} project={project} title="씬 마스터">
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell org={org} project={project} title="씬 마스터">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">씬 마스터</h1>
            <p className="text-sm text-muted-foreground">
              총 {scenes.length}개 씬
            </p>
          </div>
          <Button onClick={() => setIsAddingScene(true)}>
            <Plus className="mr-2 h-4 w-4" />
            씬 추가
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="씬 번호, 이름, 장소 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Add Scene Form */}
        {isAddingScene && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">새 씬 추가</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium">씬 번호</label>
                  <Input
                    placeholder="예: 1, 2A, 3"
                    value={newSceneNumber}
                    onChange={(e) => setNewSceneNumber(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddScene()}
                    autoFocus
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={handleAddScene} disabled={!newSceneNumber.trim()}>
                    추가
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddingScene(false)}>
                    취소
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scenes Table */}
        <div className="rounded-lg border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="w-10 px-3 py-3"></th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">S#</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">씬 이름</th>
                <th className="w-16 px-3 py-3 text-center text-xs font-medium text-muted-foreground">시간</th>
                <th className="w-16 px-3 py-3 text-center text-xs font-medium text-muted-foreground">장소</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">로케이션</th>
                <th className="w-20 px-3 py-3 text-center text-xs font-medium text-muted-foreground">페이지</th>
                <th className="w-20 px-3 py-3 text-center text-xs font-medium text-muted-foreground">예상시간</th>
                <th className="w-10 px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredScenes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    {searchQuery ? '검색 결과가 없습니다' : '씬을 추가해주세요'}
                  </td>
                </tr>
              ) : (
                filteredScenes.map((scene) => (
                  <tr key={scene.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="px-3 py-2">
                      <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
                    </td>
                    <td className="px-3 py-2">
                      <EditableInput
                        value={scene.scene_number}
                        onSave={(v) => handleUpdateScene(scene.id, 'scene_number', v)}
                        className="h-8 w-16 text-sm font-medium"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <EditableInput
                        value={scene.scene_name}
                        onSave={(v) => handleUpdateScene(scene.id, 'scene_name', v)}
                        placeholder="씬 이름"
                        className="h-8 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <select
                        value={scene.time_of_day || ''}
                        onChange={(e) => handleUpdateScene(scene.id, 'time_of_day', e.target.value)}
                        className="h-8 w-14 rounded border border-input bg-background px-1 text-sm"
                      >
                        <option value="">-</option>
                        <option value="D">D</option>
                        <option value="N">N</option>
                        <option value="M">M</option>
                        <option value="E">E</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <select
                        value={scene.location_type || ''}
                        onChange={(e) => handleUpdateScene(scene.id, 'location_type', e.target.value)}
                        className="h-8 w-14 rounded border border-input bg-background px-1 text-sm"
                      >
                        <option value="">-</option>
                        <option value="I">I</option>
                        <option value="E">E</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {scene.location?.name || '-'}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <EditableInput
                        type="number"
                        step="0.125"
                        value={scene.page_count}
                        onSave={(v) => handleUpdateScene(scene.id, 'page_count', v)}
                        placeholder="-"
                        className="h-8 w-16 text-center text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <EditableInput
                          type="number"
                          value={scene.estimated_duration}
                          onSave={(v) => handleUpdateScene(scene.id, 'estimated_duration', v)}
                          placeholder="-"
                          className="h-8 w-14 text-center text-sm"
                        />
                        <span className="text-xs text-muted-foreground">분</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                        onClick={() => deleteScene(scene.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Quick Add */}
        {!isAddingScene && scenes.length > 0 && (
          <button
            onClick={() => setIsAddingScene(true)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            씬 추가
          </button>
        )}
      </div>
    </AppShell>
  )
}
