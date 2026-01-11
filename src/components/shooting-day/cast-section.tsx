'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, User, UserPlus, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface CastItem {
  id: string
  character_name: string
  actor_name: string
  call_time: string
  call_location: string
  scenes: string
  costume_props: string
  phone: string
  sequence: number
}

export interface CastPersonForImport {
  id: string
  name: string
  role: string | null
  phone: string | null
}

interface CastSectionProps {
  items: CastItem[]
  onChange: (items: CastItem[]) => void
  onAddRow: () => void
  onDeleteRow: (id: string) => void
  availableCast?: CastPersonForImport[]
  onImportCast?: (people: CastPersonForImport[]) => void
}

function EditableCell({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  const [localValue, setLocalValue] = useState(value)

  const handleBlur = () => {
    if (localValue !== value) {
      onChange(localValue)
    }
  }

  return (
    <input
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={cn(
        'w-full rounded border-0 bg-transparent px-2 py-1.5 text-sm',
        'focus:bg-secondary focus:outline-none focus:ring-1 focus:ring-border',
        className
      )}
    />
  )
}

// 캐스트 불러오기 모달
function ImportCastModal({
  isOpen,
  onClose,
  people,
  existingActorNames,
  onImport,
}: {
  isOpen: boolean
  onClose: () => void
  people: CastPersonForImport[]
  existingActorNames: string[]
  onImport: (selected: CastPersonForImport[]) => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  if (!isOpen) return null

  const handleToggle = (id: string) => {
    const newSelected = new Set(selected)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelected(newSelected)
  }

  const handleImport = () => {
    const selectedPeople = people.filter((p) => selected.has(p.id))
    onImport(selectedPeople)
    setSelected(new Set())
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-background shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="font-semibold">캐스트 불러오기</h3>
          <button onClick={onClose} className="rounded p-1 hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[400px] overflow-y-auto p-4">
          {people.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              불러올 수 있는 캐스트가 없습니다.<br />
              피플 페이지에서 먼저 캐스트를 등록해주세요.
            </p>
          ) : (
            <div className="space-y-2">
              {people.map((person) => {
                const isAlreadyAdded = existingActorNames.includes(person.name)
                const isSelected = selected.has(person.id)
                return (
                  <button
                    key={person.id}
                    onClick={() => !isAlreadyAdded && handleToggle(person.id)}
                    disabled={isAlreadyAdded}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors',
                      isAlreadyAdded
                        ? 'border-border bg-muted/50 opacity-50 cursor-not-allowed'
                        : isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-secondary'
                    )}
                  >
                    <div>
                      <p className="font-medium">{person.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {person.role || '역할 미지정'}
                        {person.phone && ` · ${person.phone}`}
                      </p>
                    </div>
                    {isAlreadyAdded ? (
                      <span className="text-xs text-muted-foreground">추가됨</span>
                    ) : isSelected ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : null}
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            취소
          </Button>
          <Button
            size="sm"
            onClick={handleImport}
            disabled={selected.size === 0}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            {selected.size}명 불러오기
          </Button>
        </div>
      </div>
    </div>
  )
}

export function CastSection({
  items,
  onChange,
  onAddRow,
  onDeleteRow,
  availableCast = [],
  onImportCast,
}: CastSectionProps) {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

  const handleUpdateItem = useCallback(
    (id: string, field: keyof CastItem, value: string) => {
      onChange(
        items.map((item) =>
          item.id === id ? { ...item, [field]: value } : item
        )
      )
    },
    [items, onChange]
  )

  return (
    <div className="space-y-4">
      {/* Import Modal */}
      <ImportCastModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        people={availableCast}
        existingActorNames={items.map((i) => i.actor_name)}
        onImport={(selected) => onImportCast?.(selected)}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">캐스트 리스트 및 배우 집합</h3>
        </div>
        <div className="flex items-center gap-2">
          {availableCast.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImportModalOpen(true)}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              피플에서 불러오기
            </Button>
          )}
          <Button onClick={onAddRow} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            캐스트 추가
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[900px]">
          <thead className="border-b-2 border-border bg-secondary">
            <tr className="text-left text-xs font-semibold tracking-wider text-muted-foreground">
              <th className="w-[100px] px-3 py-3">배역</th>
              <th className="w-[100px] px-3 py-3">연기자</th>
              <th className="w-[80px] px-3 py-3">집합시간</th>
              <th className="w-[150px] px-3 py-3">집합위치</th>
              <th className="w-[120px] px-3 py-3">등장씬</th>
              <th className="min-w-[200px] px-3 py-3">의상/소품</th>
              <th className="w-[130px] px-3 py-3">연락처</th>
              <th className="w-[50px] px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="group border-b border-border transition-colors hover:bg-muted/50"
              >
                <td className="px-3 py-2">
                  <EditableCell
                    value={item.character_name}
                    onChange={(v) => handleUpdateItem(item.id, 'character_name', v)}
                    placeholder="배역명"
                    className="font-medium"
                  />
                </td>
                <td className="px-3 py-2">
                  <EditableCell
                    value={item.actor_name}
                    onChange={(v) => handleUpdateItem(item.id, 'actor_name', v)}
                    placeholder="배우명"
                  />
                </td>
                <td className="px-3 py-2">
                  <EditableCell
                    value={item.call_time}
                    onChange={(v) => handleUpdateItem(item.id, 'call_time', v)}
                    placeholder="00:00"
                    className="font-mono"
                  />
                </td>
                <td className="px-3 py-2">
                  <EditableCell
                    value={item.call_location}
                    onChange={(v) => handleUpdateItem(item.id, 'call_location', v)}
                    placeholder="집합 위치"
                  />
                </td>
                <td className="px-3 py-2">
                  <EditableCell
                    value={item.scenes}
                    onChange={(v) => handleUpdateItem(item.id, 'scenes', v)}
                    placeholder="S# 1, 2, 3"
                  />
                </td>
                <td className="px-3 py-2">
                  <EditableCell
                    value={item.costume_props}
                    onChange={(v) => handleUpdateItem(item.id, 'costume_props', v)}
                    placeholder="준비물 입력"
                  />
                </td>
                <td className="px-3 py-2">
                  <EditableCell
                    value={item.phone}
                    onChange={(v) => handleUpdateItem(item.id, 'phone', v)}
                    placeholder="010-0000-0000"
                    className="font-mono text-muted-foreground"
                  />
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => onDeleteRow(item.id)}
                    className="rounded p-1 opacity-0 hover:bg-secondary group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="mb-2 text-muted-foreground">아직 캐스트가 없습니다</p>
            <Button onClick={onAddRow} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              첫 번째 캐스트 추가
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
