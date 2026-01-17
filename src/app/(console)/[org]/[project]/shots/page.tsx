'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { AppShell } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Plus,
  Loader2,
  Trash2,
  Video,
  Camera,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  useShots,
  type ShotType,
  type CameraMovement,
  shotTypeLabels,
  cameraMovementLabels,
} from '@/modules/shot-list'
import { useScenes } from '@/modules/scene-master'

// 한글 입력용
function EditableInput({
  value,
  onSave,
  placeholder,
  className,
}: {
  value: string | null
  onSave: (value: string) => void
  placeholder?: string
  className?: string
}) {
  const [localValue, setLocalValue] = useState(String(value ?? ''))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLocalValue(String(value ?? ''))
  }, [value])

  const handleBlur = () => {
    if (localValue !== String(value ?? '')) {
      onSave(localValue)
    }
  }

  return (
    <Input
      ref={inputRef}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.blur()}
      placeholder={placeholder}
      className={className}
    />
  )
}

export default function ShotsPage() {
  const params = useParams()
  const org = params.org as string
  const project = params.project as string

  const [projectId, setProjectId] = useState<string | null>(null)
  const [isAddingShot, setIsAddingShot] = useState(false)
  const [newShotNumber, setNewShotNumber] = useState('')
  const [filterSceneId, setFilterSceneId] = useState<string>('')

  const supabase = createClient()

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

  const { shots, isLoading, addShot, updateShot, deleteShot } = useShots(
    projectId,
    filterSceneId || undefined
  )
  const { scenes } = useScenes(projectId)

  const handleAddShot = async () => {
    if (!projectId || !newShotNumber.trim()) return

    await addShot({
      project_id: projectId,
      shot_number: newShotNumber.trim(),
      scene_id: filterSceneId || undefined,
    })

    setNewShotNumber('')
    setIsAddingShot(false)
  }

  if (isLoading) {
    return (
      <AppShell org={org} project={project} title="콘티/컷 리스트">
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell org={org} project={project} title="콘티/컷 리스트">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">콘티/컷 리스트</h1>
            <p className="text-sm text-muted-foreground">
              총 {shots.length}개 샷
            </p>
          </div>
          <Button onClick={() => setIsAddingShot(true)}>
            <Plus className="mr-2 h-4 w-4" />
            샷 추가
          </Button>
        </div>

        {/* Scene Filter */}
        <div className="mb-6">
          <select
            value={filterSceneId}
            onChange={(e) => setFilterSceneId(e.target.value)}
            className="h-9 rounded border border-input bg-background px-3 text-sm"
          >
            <option value="">모든 씬</option>
            {scenes.map((scene) => (
              <option key={scene.id} value={scene.id}>
                S#{scene.scene_number} {scene.scene_name || ''}
              </option>
            ))}
          </select>
        </div>

        {/* Add Form */}
        {isAddingShot && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">새 샷 추가</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="w-32">
                  <label className="mb-1 block text-sm font-medium">샷 번호</label>
                  <Input
                    placeholder="예: 1, 2A"
                    value={newShotNumber}
                    onChange={(e) => setNewShotNumber(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddShot()}
                    autoFocus
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={handleAddShot} disabled={!newShotNumber.trim()}>
                    추가
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddingShot(false)}>
                    취소
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Shots Table */}
        <div className="rounded-lg border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="w-16 px-3 py-3 text-left text-xs font-medium text-muted-foreground">샷#</th>
                <th className="w-24 px-3 py-3 text-left text-xs font-medium text-muted-foreground">씬</th>
                <th className="w-24 px-3 py-3 text-center text-xs font-medium text-muted-foreground">샷 타입</th>
                <th className="w-28 px-3 py-3 text-center text-xs font-medium text-muted-foreground">카메라</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">설명</th>
                <th className="w-20 px-3 py-3 text-center text-xs font-medium text-muted-foreground">길이(초)</th>
                <th className="w-10 px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {shots.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    샷을 추가해주세요
                  </td>
                </tr>
              ) : (
                shots.map((shot) => (
                  <tr key={shot.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="px-3 py-2">
                      <EditableInput
                        value={shot.shot_number}
                        onSave={(v) => updateShot(shot.id, { shot_number: v })}
                        className="h-8 w-14 text-sm font-medium"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={shot.scene_id || ''}
                        onChange={(e) => updateShot(shot.id, { scene_id: e.target.value || null })}
                        className="h-8 w-20 rounded border border-input bg-background px-1 text-xs"
                      >
                        <option value="">-</option>
                        {scenes.map((scene) => (
                          <option key={scene.id} value={scene.id}>
                            S#{scene.scene_number}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <select
                        value={shot.shot_type || ''}
                        onChange={(e) => updateShot(shot.id, { shot_type: (e.target.value || null) as ShotType | null })}
                        className="h-8 w-20 rounded border border-input bg-background px-1 text-xs"
                      >
                        <option value="">-</option>
                        {Object.entries(shotTypeLabels).map(([key, label]) => (
                          <option key={key} value={key}>{key}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <select
                        value={shot.camera_movement || ''}
                        onChange={(e) => updateShot(shot.id, { camera_movement: (e.target.value || null) as CameraMovement | null })}
                        className="h-8 w-24 rounded border border-input bg-background px-1 text-xs"
                      >
                        <option value="">-</option>
                        {Object.entries(cameraMovementLabels).map(([key, label]) => (
                          <option key={key} value={key}>{key}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <EditableInput
                        value={shot.description}
                        onSave={(v) => updateShot(shot.id, { description: v })}
                        placeholder="샷 설명"
                        className="h-8 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <EditableInput
                        value={shot.duration_seconds?.toString() || ''}
                        onSave={(v) => updateShot(shot.id, { duration_seconds: parseInt(v) || null })}
                        placeholder="-"
                        className="h-8 w-14 text-center text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                        onClick={() => deleteShot(shot.id)}
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
        {!isAddingShot && shots.length > 0 && (
          <button
            onClick={() => setIsAddingShot(true)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            샷 추가
          </button>
        )}
      </div>
    </AppShell>
  )
}
