'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils/cn'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GripVertical, Plus, Trash2, ChevronDown } from 'lucide-react'

export interface ShotPlanItem {
  id: string
  sequence: number
  scene_number: string | null
  cut_number: string | null
  scene_time: 'M' | 'D' | 'E' | 'N' | null
  scene_location_type: 'I' | 'E' | null
  start_time: string | null
  end_time: string | null
  location: string | null
  content: string
  cast_ids: string[]
  notes: string | null
}

interface ShotPlanTableProps {
  items: ShotPlanItem[]
  onChange: (items: ShotPlanItem[]) => void
  onAddRow: () => void
  onDeleteRow: (id: string) => void
  availableCast?: Array<{ id: string; name: string }>
}

const SCENE_TIME_OPTIONS = [
  { value: 'M', label: 'M', description: 'Morning', color: 'bg-amber-100 text-amber-700' },
  { value: 'D', label: 'D', description: 'Day', color: 'bg-blue-100 text-blue-700' },
  { value: 'E', label: 'E', description: 'Evening', color: 'bg-purple-100 text-purple-700' },
  { value: 'N', label: 'N', description: 'Night', color: 'bg-gray-700 text-white' },
]

const LOCATION_TYPE_OPTIONS = [
  { value: 'I', label: 'I', description: 'Interior' },
  { value: 'E', label: 'E', description: 'Exterior' },
]

// Editable Cell - 로컬 상태로 즉시 반영, blur 시 부모에 전달
function EditableCell({
  value,
  onChange,
  placeholder,
  type = 'text',
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: 'text' | 'time' | 'textarea'
  className?: string
}) {
  const [localValue, setLocalValue] = useState(value)
  const prevValueRef = useRef(value)

  // 외부에서 value가 변경되면 로컬 값도 업데이트
  if (prevValueRef.current !== value && value !== localValue) {
    setLocalValue(value)
    prevValueRef.current = value
  }

  const handleBlur = () => {
    if (localValue !== value) {
      onChange(localValue)
    }
  }

  if (type === 'textarea') {
    return (
      <textarea
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        rows={2}
        className={cn(
          'w-full resize-none rounded border-0 bg-transparent px-2 py-1 text-sm focus:bg-secondary focus:outline-none focus:ring-1 focus:ring-border',
          className
        )}
      />
    )
  }

  return (
    <input
      type={type}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={cn(
        'w-full rounded border-0 bg-transparent px-2 py-1 text-sm focus:bg-secondary focus:outline-none focus:ring-1 focus:ring-border',
        className
      )}
    />
  )
}

// Combobox for Cast (Dropdown + Direct Input)
function CastCombobox({
  value,
  onChange,
  availableCast = [],
}: {
  value: string
  onChange: (value: string) => void
  availableCast: Array<{ id: string; name: string }>
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [localValue, setLocalValue] = useState(value)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })
  const inputRef = useRef<HTMLInputElement>(null)
  const prevValueRef = useRef(value)

  // 외부에서 value가 변경되면 로컬 값도 업데이트
  if (prevValueRef.current !== value && value !== localValue) {
    setLocalValue(value)
    prevValueRef.current = value
  }

  useEffect(() => {
    if (isOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      })
    }
  }, [isOpen])

  const handleBlur = () => {
    // 드롭다운 클릭 시 blur가 먼저 발생하므로 약간 지연
    setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue)
      }
      setIsOpen(false)
    }, 200)
  }

  const handleSelect = (name: string) => {
    const currentNames = localValue.split(',').map(s => s.trim()).filter(Boolean)
    if (!currentNames.includes(name)) {
      const newValue = [...currentNames, name].join(', ')
      setLocalValue(newValue)
      onChange(newValue)
    }
    setIsOpen(false)
  }

  // 필터링: 입력값이 비어있으면 모든 캐스트 표시, 아니면 필터링
  const searchValue = localValue.split(',').pop()?.trim().toLowerCase() || ''
  const filteredCast = availableCast.filter(cast =>
    cast.name.toLowerCase().includes(searchValue)
  )

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={handleBlur}
        placeholder="출연진 선택 또는 입력"
        className="w-full rounded border-0 bg-transparent px-2 py-1 text-sm focus:bg-secondary focus:outline-none focus:ring-1 focus:ring-border"
      />

      {isOpen && availableCast.length > 0 && typeof document !== 'undefined' && createPortal(
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="fixed z-50 max-h-[200px] overflow-y-auto rounded-lg border border-border bg-background shadow-lg"
            style={{ top: position.top, left: position.left, width: position.width }}
          >
            {filteredCast.length > 0 ? (
              filteredCast.map((cast) => (
                <button
                  key={cast.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleSelect(cast.name)
                  }}
                  className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-secondary"
                >
                  {cast.name}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                캐스트를 찾을 수 없습니다
              </div>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

// Dropdown Select for M/D/E/N and I/E (Portal 사용)
function DropdownSelect({
  value,
  options,
  onChange,
  placeholder = '-',
}: {
  value: string | null
  options: { value: string; label: string; description: string; color?: string }[]
  onChange: (value: string) => void
  placeholder?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)

  const selectedOption = options.find(opt => opt.value === value)

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      })
    }
  }, [isOpen])

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-center gap-1 rounded px-2 py-1 text-sm hover:bg-secondary focus:bg-secondary focus:outline-none"
      >
        {selectedOption ? (
          <span className={cn('rounded px-1.5 py-0.5 text-xs font-medium', selectedOption.color || 'bg-secondary')}>
            {selectedOption.label}
          </span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <>
          <div
            className="fixed inset-0 z-50"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="fixed z-50 min-w-[120px] rounded-lg border border-border bg-background p-1 shadow-lg"
            style={{ top: position.top, left: position.left }}
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-secondary',
                  value === option.value && 'bg-secondary'
                )}
              >
                <span className={cn('rounded px-1.5 py-0.5 text-xs font-medium', option.color || 'bg-secondary')}>
                  {option.label}
                </span>
                <span className="text-muted-foreground">{option.description}</span>
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

function SortableRow({
  item,
  onUpdate,
  onDelete,
  availableCast = [],
}: {
  item: ShotPlanItem
  onUpdate: (id: string, field: keyof ShotPlanItem, value: unknown) => void
  onDelete: (id: string) => void
  availableCast?: Array<{ id: string; name: string }>
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        'group border-b border-border transition-colors hover:bg-muted/50',
        isDragging && 'bg-secondary shadow-lg'
      )}
    >
      {/* Drag Handle + Sequence (촬영순서) */}
      <td className="w-[70px] px-2 py-2">
        <div className="flex items-center justify-center gap-1">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab rounded p-1 opacity-0 hover:bg-secondary group-hover:opacity-100"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
          <span className="text-sm font-medium text-muted-foreground">
            {item.sequence}
          </span>
        </div>
      </td>

      {/* S# */}
      <td className="w-[60px] px-2 py-2">
        <EditableCell
          value={item.scene_number || ''}
          onChange={(v) => onUpdate(item.id, 'scene_number', v || null)}
          placeholder="-"
          className="text-center"
        />
      </td>

      {/* CUT */}
      <td className="w-[60px] px-2 py-2">
        <EditableCell
          value={item.cut_number || ''}
          onChange={(v) => onUpdate(item.id, 'cut_number', v || null)}
          placeholder="-"
          className="text-center"
        />
      </td>

      {/* M/D/E/N */}
      <td className="w-[70px] px-2 py-2">
        <DropdownSelect
          value={item.scene_time}
          options={SCENE_TIME_OPTIONS}
          onChange={(v) => onUpdate(item.id, 'scene_time', v)}
        />
      </td>

      {/* I/E */}
      <td className="w-[50px] px-2 py-2">
        <DropdownSelect
          value={item.scene_location_type}
          options={LOCATION_TYPE_OPTIONS}
          onChange={(v) => onUpdate(item.id, 'scene_location_type', v)}
        />
      </td>

      {/* Start Time (시작) */}
      <td className="w-[85px] px-2 py-2">
        <EditableCell
          type="time"
          value={item.start_time || ''}
          onChange={(v) => onUpdate(item.id, 'start_time', v || null)}
          className="text-center"
        />
      </td>

      {/* End Time (끝) */}
      <td className="w-[85px] px-2 py-2">
        <EditableCell
          type="time"
          value={item.end_time || ''}
          onChange={(v) => onUpdate(item.id, 'end_time', v || null)}
          className="text-center"
        />
      </td>

      {/* 촬영장소 */}
      <td className="w-[200px] px-2 py-2">
        <EditableCell
          value={item.location || ''}
          onChange={(v) => onUpdate(item.id, 'location', v || null)}
          placeholder="장소 입력"
        />
      </td>

      {/* 촬영내용 */}
      <td className="min-w-[300px] px-2 py-2">
        <EditableCell
          type="textarea"
          value={item.content}
          onChange={(v) => onUpdate(item.id, 'content', v)}
          placeholder="촬영 내용 입력..."
        />
      </td>

      {/* 주요인물 */}
      <td className="w-[150px] px-2 py-2">
        <CastCombobox
          value={item.cast_ids.join(', ')}
          onChange={(v) => onUpdate(item.id, 'cast_ids', v.split(',').map(s => s.trim()).filter(Boolean))}
          availableCast={availableCast}
        />
      </td>

      {/* 비고 */}
      <td className="w-[150px] px-2 py-2">
        <EditableCell
          value={item.notes || ''}
          onChange={(v) => onUpdate(item.id, 'notes', v || null)}
          placeholder="비고"
        />
      </td>

      {/* Actions */}
      <td className="w-[40px] px-2 py-2">
        <button
          onClick={() => onDelete(item.id)}
          className="rounded p-1 opacity-0 hover:bg-secondary group-hover:opacity-100"
        >
          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
        </button>
      </td>
    </tr>
  )
}

export function ShotPlanTable({
  items,
  onChange,
  onAddRow,
  onDeleteRow,
  availableCast = [],
}: ShotPlanTableProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Ctrl+Enter로 새 행 추가
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        onAddRow()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onAddRow])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)

      const reordered = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
        ...item,
        sequence: index + 1,
      }))

      onChange(reordered)
    }
  }

  const handleUpdateItem = useCallback(
    (id: string, field: keyof ShotPlanItem, value: unknown) => {
      onChange(
        items.map((item) =>
          item.id === id ? { ...item, [field]: value } : item
        )
      )
    },
    [items, onChange]
  )

  const totalShots = items.length
  const totalTime = useMemo(() => {
    let minutes = 0
    items.forEach((item) => {
      if (item.start_time && item.end_time) {
        const [startH, startM] = item.start_time.split(':').map(Number)
        const [endH, endM] = item.end_time.split(':').map(Number)
        minutes += (endH * 60 + endM) - (startH * 60 + startM)
      }
    })
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }, [items])

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={onAddRow} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            행 추가
          </Button>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>총 {totalShots}컷</span>
          <span>예상 소요시간: {totalTime}</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full">
          <thead className="sticky top-0 z-10 border-b-2 border-border bg-secondary">
            <tr className="text-left text-xs font-semibold tracking-wider text-muted-foreground">
              <th className="w-[70px] px-2 py-3 text-center">촬영순서</th>
              <th className="w-[60px] px-2 py-3 text-center">S#</th>
              <th className="w-[60px] px-2 py-3 text-center">CUT</th>
              <th className="w-[70px] px-2 py-3 text-center">M/D/E/N</th>
              <th className="w-[50px] px-2 py-3 text-center">I/E</th>
              <th className="px-2 py-3 text-center" colSpan={2}>
                <div className="flex flex-col items-center">
                  <span>촬영시간</span>
                  <div className="flex w-full text-[10px] font-normal">
                    <span className="flex-1 text-center">시작</span>
                    <span className="flex-1 text-center">끝</span>
                  </div>
                </div>
              </th>
              <th className="w-[200px] px-2 py-3">촬영장소</th>
              <th className="min-w-[300px] px-2 py-3">촬영내용</th>
              <th className="w-[150px] px-2 py-3">주요인물</th>
              <th className="w-[150px] px-2 py-3">비고</th>
              <th className="w-[40px] px-2 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {items.map((item) => (
                  <SortableRow
                    key={item.id}
                    item={item}
                    onUpdate={handleUpdateItem}
                    onDelete={onDeleteRow}
                    availableCast={availableCast}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </tbody>
        </table>

        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="mb-2 text-muted-foreground">아직 촬영 계획이 없습니다</p>
            <Button onClick={onAddRow} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              첫 번째 컷 추가
            </Button>
          </div>
        )}

        {items.length > 0 && (
          <button
            onClick={onAddRow}
            className="flex w-full items-center justify-center gap-2 border-t border-border bg-secondary/30 py-4 text-sm text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            <span>행 추가 (Ctrl+Enter)</span>
          </button>
        )}
      </div>

      {/* 하단 여유 공간 (드롭다운이 잘리지 않도록) */}
      <div className="h-64" />
    </div>
  )
}
