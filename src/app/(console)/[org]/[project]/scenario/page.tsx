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
  FileText,
  Edit3,
  ArrowLeft,
  Save,
  Clock,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  useScenarios,
  type Scenario,
  type ScenarioStatus,
  scenarioStatusLabels,
} from '@/modules/scenario'
import { cn } from '@/lib/utils/cn'

export default function ScenarioPage() {
  const params = useParams()
  const org = params.org as string
  const project = params.project as string

  const [projectId, setProjectId] = useState<string | null>(null)
  const [isAddingScenario, setIsAddingScenario] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const supabase = createClient()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

  const { scenarios, isLoading, addScenario, updateScenario, deleteScenario } = useScenarios(projectId)

  const handleAddScenario = async () => {
    if (!projectId || !newTitle.trim()) return

    const newScenario = await addScenario({
      project_id: projectId,
      title: newTitle.trim(),
    })

    if (newScenario) {
      setEditingId(newScenario.id)
      setEditContent('')
    }

    setNewTitle('')
    setIsAddingScenario(false)
  }

  const handleEdit = (scenario: Scenario) => {
    setEditingId(scenario.id)
    setEditContent(scenario.content || '')
  }

  const handleSave = async () => {
    if (!editingId) return

    setIsSaving(true)
    await updateScenario(editingId, { content: editContent })
    setIsSaving(false)
  }

  const handleBack = () => {
    setEditingId(null)
    setEditContent('')
  }

  const editingScenario = scenarios.find(s => s.id === editingId)

  if (isLoading) {
    return (
      <AppShell org={org} project={project} title="시나리오">
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    )
  }

  // 편집 모드
  if (editingId && editingScenario) {
    return (
      <AppShell org={org} project={project} title="시나리오">
        <div className="flex h-full flex-col">
          {/* 에디터 헤더 */}
          <div className="flex items-center justify-between border-b border-border px-6 py-3">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                목록
              </Button>
              <div>
                <h2 className="font-medium">{editingScenario.title}</h2>
                <p className="text-xs text-muted-foreground">
                  v{editingScenario.version} · {scenarioStatusLabels[editingScenario.status]}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={editingScenario.status}
                onChange={(e) => updateScenario(editingId, { status: e.target.value as ScenarioStatus })}
                className="h-8 rounded border border-input bg-background px-2 text-sm"
              >
                <option value="draft">작성중</option>
                <option value="review">검토중</option>
                <option value="approved">승인됨</option>
                <option value="locked">확정</option>
              </select>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                저장
              </Button>
            </div>
          </div>

          {/* 에디터 본문 */}
          <div className="flex-1 overflow-hidden p-6">
            <div className="mx-auto h-full max-w-4xl">
              <textarea
                ref={textareaRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="시나리오를 작성하세요...

씬 1. 카페 내부 - 낮

민수(30대, 회사원)가 창가에 앉아 커피를 마시고 있다.
문이 열리고 영희(20대, 대학생)가 들어온다.

민수
  (고개를 들며)
  오랜만이야.

영희
  (자리에 앉으며)
  미안해, 늦었지?"
                className="h-full w-full resize-none rounded-lg border border-input bg-background p-4 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring"
                style={{ minHeight: '500px' }}
              />
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  // 목록 모드
  return (
    <AppShell org={org} project={project} title="시나리오">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">시나리오</h1>
            <p className="text-sm text-muted-foreground">
              총 {scenarios.length}개 시나리오
            </p>
          </div>
          <Button onClick={() => setIsAddingScenario(true)}>
            <Plus className="mr-2 h-4 w-4" />
            새 시나리오
          </Button>
        </div>

        {/* Add Form */}
        {isAddingScenario && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">새 시나리오</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium">제목</label>
                  <Input
                    placeholder="예: 봄날의 기억 v1"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddScenario()}
                    autoFocus
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={handleAddScenario} disabled={!newTitle.trim()}>
                    생성
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddingScenario(false)}>
                    취소
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scenario List */}
        {scenarios.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            시나리오를 추가해주세요
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {scenarios.map((scenario) => (
              <Card
                key={scenario.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => handleEdit(scenario)}
              >
                <CardContent className="p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-medium">{scenario.title}</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteScenario(scenario.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className={cn(
                        "rounded px-2 py-0.5 text-xs",
                        scenario.status === 'draft' && "bg-gray-100 text-gray-600",
                        scenario.status === 'review' && "bg-yellow-100 text-yellow-700",
                        scenario.status === 'approved' && "bg-green-100 text-green-700",
                        scenario.status === 'locked' && "bg-blue-100 text-blue-700"
                      )}>
                        {scenarioStatusLabels[scenario.status]}
                      </span>
                      <span>v{scenario.version}</span>
                    </div>

                    {scenario.logline && (
                      <p className="line-clamp-2 text-muted-foreground">
                        {scenario.logline}
                      </p>
                    )}

                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(scenario.updated_at).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Add */}
        {!isAddingScenario && scenarios.length > 0 && (
          <button
            onClick={() => setIsAddingScenario(true)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            새 시나리오
          </button>
        )}
      </div>
    </AppShell>
  )
}
