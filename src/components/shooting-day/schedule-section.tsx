'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface ScheduleItem {
  id: string
  sequence: number
  time: string
  title: string
  description: string
}

interface ScheduleSectionProps {
  items: ScheduleItem[]
  onChange: (items: ScheduleItem[]) => void
  onAddRow: () => void
  onDeleteRow: (id: string) => void
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

export function ScheduleSection({
  items,
  onChange,
  onAddRow,
  onDeleteRow,
}: ScheduleSectionProps) {
  const handleUpdateItem = useCallback(
    (id: string, field: keyof ScheduleItem, value: string) => {
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">전체일정</h3>
        <Button onClick={onAddRow} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          일정 추가
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full">
          <thead className="border-b-2 border-border bg-secondary">
            <tr className="text-left text-xs font-semibold tracking-wider text-muted-foreground">
              <th className="w-[50px] px-3 py-3"></th>
              <th className="w-[120px] px-3 py-3">시간</th>
              <th className="w-[200px] px-3 py-3">일정</th>
              <th className="px-3 py-3">내용</th>
              <th className="w-[50px] px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr
                key={item.id}
                className="group border-b border-border transition-colors hover:bg-muted/50"
              >
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    <button className="cursor-grab rounded p-1 opacity-0 hover:bg-secondary group-hover:opacity-100">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <span className="text-xs text-muted-foreground">{index + 1}</span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <EditableCell
                    value={item.time}
                    onChange={(v) => handleUpdateItem(item.id, 'time', v)}
                    placeholder="00:00"
                    className="font-mono"
                  />
                </td>
                <td className="px-3 py-2">
                  <EditableCell
                    value={item.title}
                    onChange={(v) => handleUpdateItem(item.id, 'title', v)}
                    placeholder="일정명 입력"
                    className="font-medium"
                  />
                </td>
                <td className="px-3 py-2">
                  <EditableCell
                    value={item.description}
                    onChange={(v) => handleUpdateItem(item.id, 'description', v)}
                    placeholder="내용 입력"
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
            <p className="mb-2 text-muted-foreground">아직 일정이 없습니다</p>
            <Button onClick={onAddRow} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              첫 번째 일정 추가
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
