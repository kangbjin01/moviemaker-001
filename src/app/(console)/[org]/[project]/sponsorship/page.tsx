'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Trash2, Gift, Building2 } from 'lucide-react'
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
import { createClient } from '@/lib/supabase/client'
import { useSponsorships, sponsorshipCategoryLabels, sponsorshipStatusLabels } from '@/modules/sponsorship'
import type { SponsorshipCategory, SponsorshipStatus } from '@/modules/sponsorship'

function EditableInput({
  value,
  onSave,
  placeholder,
  className,
}: {
  value: string | null | undefined
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
      placeholder={placeholder}
      className={className}
    />
  )
}

export default function SponsorshipPage() {
  const params = useParams()
  const org = params.org as string
  const project = params.project as string

  const [projectId, setProjectId] = useState<string | null>(null)
  const [isProjectLoading, setIsProjectLoading] = useState(true)
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
      setIsProjectLoading(false)
    }
    fetchProjectId()
  }, [project, supabase])

  const { sponsorships, isLoading: isDataLoading, addSponsorship, updateSponsorship, deleteSponsorship } = useSponsorships(projectId)

  const isLoading = isProjectLoading || isDataLoading
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newSponsorship, setNewSponsorship] = useState({
    company_name: '',
    category: 'product' as SponsorshipCategory,
  })

  const handleAdd = async () => {
    if (!newSponsorship.company_name.trim() || !projectId) return

    await addSponsorship({
      project_id: projectId,
      company_name: newSponsorship.company_name.trim(),
      category: newSponsorship.category,
    })

    setNewSponsorship({ company_name: '', category: 'product' })
    setIsAddDialogOpen(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm('이 협찬 정보를 삭제하시겠습니까?')) {
      await deleteSponsorship(id)
    }
  }

  if (isLoading) {
    return (
      <AppShell org={org} project={project} title="협찬 관리">
        <div className="p-6">로딩 중...</div>
      </AppShell>
    )
  }

  return (
    <AppShell org={org} project={project} title="협찬 관리">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Gift className="h-6 w-6" />
            <h1 className="text-2xl font-bold">협찬 관리</h1>
          </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          협찬 추가
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="w-40 px-3 py-3 text-left text-xs font-medium text-muted-foreground">업체명</th>
              <th className="w-24 px-3 py-3 text-left text-xs font-medium text-muted-foreground">유형</th>
              <th className="w-28 px-3 py-3 text-left text-xs font-medium text-muted-foreground">담당자</th>
              <th className="w-32 px-3 py-3 text-left text-xs font-medium text-muted-foreground">연락처</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">협찬 내용</th>
              <th className="w-28 px-3 py-3 text-left text-xs font-medium text-muted-foreground">예상 금액</th>
              <th className="w-24 px-3 py-3 text-left text-xs font-medium text-muted-foreground">상태</th>
              <th className="w-12 px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {sponsorships.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-muted-foreground">
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  등록된 협찬이 없습니다
                </td>
              </tr>
            ) : (
              sponsorships.map((s) => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-3 py-2">
                    <EditableInput
                      value={s.company_name}
                      onSave={(v) => updateSponsorship(s.id, { company_name: v })}
                      placeholder="업체명"
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={s.category || 'product'}
                      onChange={(e) => updateSponsorship(s.id, { category: e.target.value as SponsorshipCategory })}
                      className="h-8 w-20 rounded border border-input bg-background px-1 text-sm"
                    >
                      {Object.entries(sponsorshipCategoryLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <EditableInput
                      value={s.contact_name}
                      onSave={(v) => updateSponsorship(s.id, { contact_name: v || null })}
                      placeholder="담당자"
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <EditableInput
                      value={s.contact_phone}
                      onSave={(v) => updateSponsorship(s.id, { contact_phone: v || null })}
                      placeholder="연락처"
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <EditableInput
                      value={s.description}
                      onSave={(v) => updateSponsorship(s.id, { description: v || null })}
                      placeholder="협찬 내용"
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <EditableInput
                      value={s.value}
                      onSave={(v) => updateSponsorship(s.id, { value: v || null })}
                      placeholder="예상 금액"
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={s.status}
                      onChange={(e) => updateSponsorship(s.id, { status: e.target.value as SponsorshipStatus })}
                      className="h-8 w-20 rounded border border-input bg-background px-1 text-sm"
                    >
                      {Object.entries(sponsorshipStatusLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
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
            <DialogTitle>협찬 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">업체명</label>
              <Input
                value={newSponsorship.company_name}
                onChange={(e) => setNewSponsorship({ ...newSponsorship, company_name: e.target.value })}
                placeholder="협찬 업체명"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">협찬 유형</label>
              <select
                value={newSponsorship.category}
                onChange={(e) => setNewSponsorship({ ...newSponsorship, category: e.target.value as SponsorshipCategory })}
                className="h-10 w-full rounded border border-input bg-background px-3 text-sm"
              >
                {Object.entries(sponsorshipCategoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
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
