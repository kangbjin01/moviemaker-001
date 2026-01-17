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
  Camera,
  Lightbulb,
  Mic,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  useEquipment,
  type EquipmentCategory,
  type EquipmentStatus,
  equipmentCategoryLabels,
  equipmentStatusLabels,
} from '@/modules/equipment'

// 한글 입력용
function EditableInput({
  value,
  onSave,
  placeholder,
  className,
}: {
  value: string | number | null
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

// 카테고리 아이콘
function CategoryIcon({ category }: { category: EquipmentCategory }) {
  switch (category) {
    case 'camera':
    case 'lens':
      return <Camera className="h-4 w-4" />
    case 'lighting':
      return <Lightbulb className="h-4 w-4" />
    case 'sound':
      return <Mic className="h-4 w-4" />
    default:
      return null
  }
}

export default function EquipmentPage() {
  const params = useParams()
  const org = params.org as string
  const project = params.project as string

  const [projectId, setProjectId] = useState<string | null>(null)
  const [isAddingEquipment, setIsAddingEquipment] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState<EquipmentCategory>('camera')
  const [filterCategory, setFilterCategory] = useState<EquipmentCategory | ''>('')

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

  const { equipment, isLoading, addEquipment, updateEquipment, deleteEquipment } = useEquipment(
    projectId,
    filterCategory || undefined
  )

  const handleAddEquipment = async () => {
    if (!projectId || !newName.trim()) return

    await addEquipment({
      project_id: projectId,
      category: newCategory,
      name: newName.trim(),
    })

    setNewName('')
    setIsAddingEquipment(false)
  }

  // 카테고리별 그룹화
  const groupedEquipment = equipment.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<EquipmentCategory, typeof equipment>)

  if (isLoading) {
    return (
      <AppShell org={org} project={project} title="장비 리스트">
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell org={org} project={project} title="장비 리스트">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">장비 리스트</h1>
            <p className="text-sm text-muted-foreground">
              총 {equipment.length}개 장비
            </p>
          </div>
          <Button onClick={() => setIsAddingEquipment(true)}>
            <Plus className="mr-2 h-4 w-4" />
            장비 추가
          </Button>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as EquipmentCategory | '')}
            className="h-9 rounded border border-input bg-background px-3 text-sm"
          >
            <option value="">모든 카테고리</option>
            {Object.entries(equipmentCategoryLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Add Form */}
        {isAddingEquipment && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">새 장비 추가</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="w-32">
                  <label className="mb-1 block text-sm font-medium">카테고리</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as EquipmentCategory)}
                    className="h-9 w-full rounded border border-input bg-background px-2 text-sm"
                  >
                    {Object.entries(equipmentCategoryLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium">장비명</label>
                  <Input
                    placeholder="예: Sony A7S3, Arri Skypanel"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddEquipment()}
                    autoFocus
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={handleAddEquipment} disabled={!newName.trim()}>
                    추가
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddingEquipment(false)}>
                    취소
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Equipment Table */}
        <div className="rounded-lg border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="w-28 px-3 py-3 text-left text-xs font-medium text-muted-foreground">카테고리</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">장비명</th>
                <th className="w-20 px-3 py-3 text-center text-xs font-medium text-muted-foreground">수량</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">스펙/모델</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">렌탈 업체</th>
                <th className="w-24 px-3 py-3 text-center text-xs font-medium text-muted-foreground">상태</th>
                <th className="w-10 px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {equipment.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    장비를 추가해주세요
                  </td>
                </tr>
              ) : (
                equipment.map((item) => (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CategoryIcon category={item.category} />
                        <select
                          value={item.category}
                          onChange={(e) => updateEquipment(item.id, { category: e.target.value as EquipmentCategory })}
                          className="h-8 rounded border border-input bg-background px-1 text-xs"
                        >
                          {Object.entries(equipmentCategoryLabels).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <EditableInput
                        value={item.name}
                        onSave={(v) => updateEquipment(item.id, { name: v })}
                        className="h-8 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <EditableInput
                        value={item.quantity}
                        onSave={(v) => updateEquipment(item.id, { quantity: parseInt(v) || 1 })}
                        className="h-8 w-14 text-center text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <EditableInput
                        value={item.specification}
                        onSave={(v) => updateEquipment(item.id, { specification: v })}
                        placeholder="스펙/모델"
                        className="h-8 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <EditableInput
                        value={item.rental_company}
                        onSave={(v) => updateEquipment(item.id, { rental_company: v })}
                        placeholder="렌탈 업체"
                        className="h-8 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <select
                        value={item.status}
                        onChange={(e) => updateEquipment(item.id, { status: e.target.value as EquipmentStatus })}
                        className="h-8 w-20 rounded border border-input bg-background px-1 text-xs"
                      >
                        {Object.entries(equipmentStatusLabels).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                        onClick={() => deleteEquipment(item.id)}
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
        {!isAddingEquipment && equipment.length > 0 && (
          <button
            onClick={() => setIsAddingEquipment(true)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            장비 추가
          </button>
        )}
      </div>
    </AppShell>
  )
}
