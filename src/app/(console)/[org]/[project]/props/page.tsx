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
  Package,
  Shirt,
} from 'lucide-react'
import { useProject } from '@/contexts/project-context'
import {
  useProps,
  useWardrobe,
  type SourceType,
  type ItemStatus,
  sourceLabels,
  itemStatusLabels,
} from '@/modules/props-wardrobe'
import { useScenes } from '@/modules/scene-master'
import { useCharacters } from '@/modules/character-master'
import { cn } from '@/lib/utils/cn'

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

export default function PropsPage() {
  const params = useParams()
  const org = params.org as string
  const project = params.project as string

  // Context에서 projectId 가져오기
  const { projectId, isLoading: isProjectLoading } = useProject()

  const [activeTab, setActiveTab] = useState<'props' | 'wardrobe'>('props')
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')

  const { props, isLoading: propsLoading, addProp, updateProp, deleteProp } = useProps(projectId)
  const { wardrobe, isLoading: wardrobeLoading, addWardrobe, updateWardrobe, deleteWardrobe } = useWardrobe(projectId)
  const { scenes } = useScenes(projectId)
  const { characters } = useCharacters(projectId)

  const isLoading = isProjectLoading || propsLoading || wardrobeLoading

  const handleAdd = async () => {
    if (!projectId || !newName.trim()) return

    if (activeTab === 'props') {
      await addProp({
        project_id: projectId,
        name: newName.trim(),
      })
    } else {
      await addWardrobe({
        project_id: projectId,
        name: newName.trim(),
      })
    }

    setNewName('')
    setIsAdding(false)
  }

  if (isLoading) {
    return (
      <AppShell org={org} project={project} title="소품/의상">
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell org={org} project={project} title="소품/의상">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">소품/의상</h1>
            <p className="text-sm text-muted-foreground">
              소품 {props.length}개, 의상 {wardrobe.length}개
            </p>
          </div>
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {activeTab === 'props' ? '소품 추가' : '의상 추가'}
          </Button>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab('props')}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              activeTab === 'props'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            )}
          >
            <Package className="h-4 w-4" />
            소품
          </button>
          <button
            onClick={() => setActiveTab('wardrobe')}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              activeTab === 'wardrobe'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            )}
          >
            <Shirt className="h-4 w-4" />
            의상
          </button>
        </div>

        {/* Add Form */}
        {isAdding && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">
                {activeTab === 'props' ? '새 소품 추가' : '새 의상 추가'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium">
                    {activeTab === 'props' ? '소품명' : '의상명'}
                  </label>
                  <Input
                    placeholder={activeTab === 'props' ? '예: 커피컵, 노트북' : '예: 정장, 원피스'}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    autoFocus
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={handleAdd} disabled={!newName.trim()}>
                    추가
                  </Button>
                  <Button variant="outline" onClick={() => setIsAdding(false)}>
                    취소
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Props Table */}
        {activeTab === 'props' && (
          <div className="rounded-lg border border-border bg-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">소품명</th>
                  <th className="w-20 px-3 py-3 text-center text-xs font-medium text-muted-foreground">수량</th>
                  <th className="w-24 px-3 py-3 text-center text-xs font-medium text-muted-foreground">조달</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">공급처</th>
                  <th className="w-24 px-3 py-3 text-center text-xs font-medium text-muted-foreground">상태</th>
                  <th className="w-10 px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {props.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      소품을 추가해주세요
                    </td>
                  </tr>
                ) : (
                  props.map((prop) => (
                    <tr key={prop.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="px-3 py-2">
                        <EditableInput
                          value={prop.name}
                          onSave={(v) => updateProp(prop.id, { name: v })}
                          className="h-8 text-sm"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <EditableInput
                          value={prop.quantity}
                          onSave={(v) => updateProp(prop.id, { quantity: parseInt(v) || 1 })}
                          className="h-8 w-14 text-center text-sm"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <select
                          value={prop.source}
                          onChange={(e) => updateProp(prop.id, { source: e.target.value as SourceType })}
                          className="h-8 w-20 rounded border border-input bg-background px-1 text-xs"
                        >
                          {Object.entries(sourceLabels).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <EditableInput
                          value={prop.supplier}
                          onSave={(v) => updateProp(prop.id, { supplier: v })}
                          placeholder="공급처"
                          className="h-8 text-sm"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <select
                          value={prop.status}
                          onChange={(e) => updateProp(prop.id, { status: e.target.value as ItemStatus })}
                          className="h-8 w-20 rounded border border-input bg-background px-1 text-xs"
                        >
                          {Object.entries(itemStatusLabels).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-500"
                          onClick={() => deleteProp(prop.id)}
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
        )}

        {/* Wardrobe Table */}
        {activeTab === 'wardrobe' && (
          <div className="rounded-lg border border-border bg-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">의상명</th>
                  <th className="w-28 px-3 py-3 text-left text-xs font-medium text-muted-foreground">캐릭터</th>
                  <th className="w-24 px-3 py-3 text-center text-xs font-medium text-muted-foreground">조달</th>
                  <th className="w-20 px-3 py-3 text-center text-xs font-medium text-muted-foreground">사이즈</th>
                  <th className="w-24 px-3 py-3 text-center text-xs font-medium text-muted-foreground">상태</th>
                  <th className="w-10 px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {wardrobe.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      의상을 추가해주세요
                    </td>
                  </tr>
                ) : (
                  wardrobe.map((item) => (
                    <tr key={item.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="px-3 py-2">
                        <EditableInput
                          value={item.name}
                          onSave={(v) => updateWardrobe(item.id, { name: v })}
                          className="h-8 text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={item.character_id || ''}
                          onChange={(e) => updateWardrobe(item.id, { character_id: e.target.value || null })}
                          className="h-8 w-24 rounded border border-input bg-background px-1 text-xs"
                        >
                          <option value="">-</option>
                          {characters.map((char) => (
                            <option key={char.id} value={char.id}>{char.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <select
                          value={item.source}
                          onChange={(e) => updateWardrobe(item.id, { source: e.target.value as SourceType })}
                          className="h-8 w-20 rounded border border-input bg-background px-1 text-xs"
                        >
                          {Object.entries(sourceLabels).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <EditableInput
                          value={item.size}
                          onSave={(v) => updateWardrobe(item.id, { size: v })}
                          placeholder="-"
                          className="h-8 w-16 text-center text-sm"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <select
                          value={item.status}
                          onChange={(e) => updateWardrobe(item.id, { status: e.target.value as ItemStatus })}
                          className="h-8 w-20 rounded border border-input bg-background px-1 text-xs"
                        >
                          {Object.entries(itemStatusLabels).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-500"
                          onClick={() => deleteWardrobe(item.id)}
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
        )}

        {/* Quick Add */}
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            {activeTab === 'props' ? '소품 추가' : '의상 추가'}
          </button>
        )}
      </div>
    </AppShell>
  )
}
