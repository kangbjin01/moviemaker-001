'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Trash2, Calendar, CalendarDays } from 'lucide-react'
import { AppShell } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useProject } from '@/contexts/project-context'
import { useShootingSchedule, scheduleStatusLabels } from '@/modules/shooting-schedule'
import type { ScheduleStatus } from '@/modules/shooting-schedule'

function EditableInput({
  value,
  onSave,
  placeholder,
  className,
  type = 'text',
}: {
  value: string | number | null | undefined
  onSave: (value: string) => void
  placeholder?: string
  className?: string
  type?: 'text' | 'date' | 'number'
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
      type={type}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
    />
  )
}

export default function SchedulePage() {
  const params = useParams()
  const org = params.org as string
  const project = params.project as string

  // Context에서 projectId 가져오기 (이미 로드됨)
  const { projectId, isLoading: isProjectLoading } = useProject()

  const { schedules, isLoading: isDataLoading, addSchedule, updateSchedule, deleteSchedule } = useShootingSchedule(projectId)

  const isLoading = isProjectLoading || isDataLoading
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newSchedule, setNewSchedule] = useState({
    shoot_date: '',
    day_number: '',
  })

  const handleAdd = async () => {
    if (!newSchedule.shoot_date || !projectId) return

    await addSchedule({
      project_id: projectId,
      shoot_date: newSchedule.shoot_date,
      day_number: newSchedule.day_number ? parseInt(newSchedule.day_number) : undefined,
    })

    setNewSchedule({ shoot_date: '', day_number: '' })
    setIsAddDialogOpen(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm('이 촬영일을 삭제하시겠습니까?')) {
      await deleteSchedule(id)
    }
  }

  if (isLoading) {
    return (
      <AppShell org={org} project={project} title="촬영 스케줄">
        <div className="p-6">로딩 중...</div>
      </AppShell>
    )
  }

  return (
    <AppShell org={org} project={project} title="촬영 스케줄">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            <h1 className="text-2xl font-bold">촬영 스케줄</h1>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            촬영일 추가
          </Button>
        </div>

        <div className="rounded-lg border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="w-20 px-3 py-3 text-left text-xs font-medium text-muted-foreground">촬영일차</th>
                <th className="w-40 px-3 py-3 text-left text-xs font-medium text-muted-foreground">촬영일</th>
                <th className="w-28 px-3 py-3 text-left text-xs font-medium text-muted-foreground">상태</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">메모</th>
                <th className="w-12 px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    등록된 촬영일이 없습니다
                  </td>
                </tr>
              ) : (
                schedules.map((s) => (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="px-3 py-2">
                      <EditableInput
                        value={s.day_number}
                        onSave={(v) => updateSchedule(s.id, { day_number: v ? parseInt(v) : null })}
                        placeholder="N"
                        type="number"
                        className="h-8 w-16 text-center text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <EditableInput
                        value={s.shoot_date}
                        onSave={(v) => updateSchedule(s.id, { shoot_date: v })}
                        type="date"
                        className="h-8 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={s.status}
                        onChange={(e) => updateSchedule(s.id, { status: e.target.value as ScheduleStatus })}
                        className="h-8 w-24 rounded border border-input bg-background px-2 text-sm"
                      >
                        {Object.entries(scheduleStatusLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <EditableInput
                        value={s.notes}
                        onSave={(v) => updateSchedule(s.id, { notes: v || null })}
                        placeholder="메모"
                        className="h-8 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                        onClick={() => handleDelete(s.id)}
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

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>촬영일 추가</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">촬영일</label>
                <Input
                  type="date"
                  value={newSchedule.shoot_date}
                  onChange={(e) => setNewSchedule({ ...newSchedule, shoot_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">촬영일차 (선택)</label>
                <Input
                  type="number"
                  value={newSchedule.day_number}
                  onChange={(e) => setNewSchedule({ ...newSchedule, day_number: e.target.value })}
                  placeholder="예: 1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleAdd}>추가</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
