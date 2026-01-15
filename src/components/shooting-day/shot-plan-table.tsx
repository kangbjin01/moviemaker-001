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
import { GripVertical, Plus, Trash2, ChevronDown, Clock, X, Film, Copy } from 'lucide-react'
import { Input } from '@/components/ui/input'

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
  onApplyToSameScene,
  availableCast = [],
  hasSameSceneItems,
}: {
  item: ShotPlanItem
  onUpdate: (id: string, field: keyof ShotPlanItem, value: unknown) => void
  onDelete: (id: string) => void
  onApplyToSameScene: (item: ShotPlanItem) => void
  availableCast?: Array<{ id: string; name: string }>
  hasSameSceneItems: boolean
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
      <td className="w-[70px] px-2 py-2">
        <div className="flex items-center gap-1">
          {hasSameSceneItems && item.scene_number && (
            <button
              onClick={() => onApplyToSameScene(item)}
              className="rounded p-1 opacity-0 hover:bg-secondary group-hover:opacity-100"
              title="같은 씬에 적용"
            >
              <Copy className="h-4 w-4 text-muted-foreground hover:text-blue-500" />
            </button>
          )}
          <button
            onClick={() => onDelete(item.id)}
            className="rounded p-1 opacity-0 hover:bg-secondary group-hover:opacity-100"
            title="삭제"
          >
            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
          </button>
        </div>
      </td>
    </tr>
  )
}

// Auto-fill time settings interface
interface AutoFillTimeSettings {
  mode: 'perCut' | 'byRange' // perCut: 컷당 시간 지정, byRange: 시작/끝 시간으로 자동 분배
  startTime: string
  endTime: string // byRange 모드용
  timePerCut: number // minutes
  breakTime: number // minutes between cuts
  mealTime: string // e.g., "12:00"
  mealDuration: number // minutes
  includeMealTime: boolean
}

// Auto-fill time modal component
function AutoFillTimeModal({
  isOpen,
  onClose,
  onApply,
  itemCount,
}: {
  isOpen: boolean
  onClose: () => void
  onApply: (settings: AutoFillTimeSettings) => void
  itemCount: number
}) {
  const [settings, setSettings] = useState<AutoFillTimeSettings>({
    mode: 'perCut',
    startTime: '09:00',
    endTime: '18:00',
    timePerCut: 15,
    breakTime: 5,
    mealTime: '12:00',
    mealDuration: 60,
    includeMealTime: true,
  })

  // Calculate estimated end time (for perCut mode)
  const estimatedEndTime = useMemo(() => {
    if (!settings.startTime || itemCount === 0) return '-'

    const [startH, startM] = settings.startTime.split(':').map(Number)
    let totalMinutes = startH * 60 + startM

    const shootingMinutes = settings.timePerCut * itemCount + settings.breakTime * (itemCount - 1)
    totalMinutes += shootingMinutes

    if (settings.includeMealTime && settings.mealTime) {
      const [mealH, mealM] = settings.mealTime.split(':').map(Number)
      const mealStart = mealH * 60 + mealM
      const shootingStartMinutes = startH * 60 + startM

      if (mealStart >= shootingStartMinutes && mealStart <= totalMinutes) {
        totalMinutes += settings.mealDuration
      }
    }

    const endH = Math.floor(totalMinutes / 60)
    const endM = totalMinutes % 60
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
  }, [settings, itemCount])

  // Calculate time per cut (for byRange mode)
  const calculatedTimePerCut = useMemo(() => {
    if (!settings.startTime || !settings.endTime || itemCount === 0) return 0

    const [startH, startM] = settings.startTime.split(':').map(Number)
    const [endH, endM] = settings.endTime.split(':').map(Number)

    let totalAvailableMinutes = (endH * 60 + endM) - (startH * 60 + startM)

    // Subtract meal time if included
    if (settings.includeMealTime) {
      totalAvailableMinutes -= settings.mealDuration
    }

    // Subtract break times (itemCount - 1 breaks)
    totalAvailableMinutes -= settings.breakTime * (itemCount - 1)

    // Divide by item count
    const timePerCut = Math.floor(totalAvailableMinutes / itemCount)
    return Math.max(1, timePerCut)
  }, [settings, itemCount])

  if (!isOpen) return null

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-background p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">시간 자동 채우기</h3>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Mode selector */}
          <div className="flex rounded-lg border border-border p-1 bg-secondary/30">
            <button
              type="button"
              onClick={() => setSettings(s => ({ ...s, mode: 'perCut' }))}
              className={cn(
                'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                settings.mode === 'perCut'
                  ? 'bg-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              컷당 시간 지정
            </button>
            <button
              type="button"
              onClick={() => setSettings(s => ({ ...s, mode: 'byRange' }))}
              className={cn(
                'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                settings.mode === 'byRange'
                  ? 'bg-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              시작/끝 시간 지정
            </button>
          </div>

          {/* Start & End time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="start-time" className="text-sm font-medium">촬영 시작 시간</label>
              <Input
                id="start-time"
                type="time"
                value={settings.startTime}
                onChange={(e) => setSettings(s => ({ ...s, startTime: e.target.value }))}
              />
            </div>
            {settings.mode === 'perCut' ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">예상 종료 시간</label>
                <div className="flex h-10 items-center rounded-md border border-input bg-secondary px-3 text-sm">
                  {estimatedEndTime}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label htmlFor="end-time" className="text-sm font-medium">촬영 종료 시간</label>
                <Input
                  id="end-time"
                  type="time"
                  value={settings.endTime}
                  onChange={(e) => setSettings(s => ({ ...s, endTime: e.target.value }))}
                />
              </div>
            )}
          </div>

          {/* Time per cut & break time */}
          <div className="grid grid-cols-2 gap-4">
            {settings.mode === 'perCut' ? (
              <div className="space-y-2">
                <label htmlFor="time-per-cut" className="text-sm font-medium">컷당 소요 시간 (분)</label>
                <Input
                  id="time-per-cut"
                  type="number"
                  min={1}
                  max={120}
                  value={settings.timePerCut}
                  onChange={(e) => setSettings(s => ({ ...s, timePerCut: parseInt(e.target.value) || 15 }))}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">계산된 컷당 시간</label>
                <div className="flex h-10 items-center rounded-md border border-input bg-secondary px-3 text-sm">
                  {calculatedTimePerCut}분
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="break-time" className="text-sm font-medium">컷 사이 휴식 (분)</label>
              <Input
                id="break-time"
                type="number"
                min={0}
                max={60}
                value={settings.breakTime}
                onChange={(e) => setSettings(s => ({ ...s, breakTime: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          {/* Meal time toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="include-meal"
              checked={settings.includeMealTime}
              onChange={(e) => setSettings(s => ({ ...s, includeMealTime: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="include-meal" className="text-sm font-medium cursor-pointer">식사 시간 포함</label>
          </div>

          {/* Meal time settings */}
          {settings.includeMealTime && (
            <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-secondary/30 p-3">
              <div className="space-y-2">
                <label htmlFor="meal-time" className="text-sm font-medium">식사 시작 시간</label>
                <Input
                  id="meal-time"
                  type="time"
                  value={settings.mealTime}
                  onChange={(e) => setSettings(s => ({ ...s, mealTime: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="meal-duration" className="text-sm font-medium">식사 시간 (분)</label>
                <Input
                  id="meal-duration"
                  type="number"
                  min={15}
                  max={120}
                  value={settings.mealDuration}
                  onChange={(e) => setSettings(s => ({ ...s, mealDuration: parseInt(e.target.value) || 60 }))}
                />
              </div>
            </div>
          )}

          {/* Info */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 text-sm text-blue-700 dark:text-blue-300">
            <p>총 {itemCount}컷의 시간을 자동으로 채웁니다.</p>
            <p className="text-xs mt-1 text-blue-600 dark:text-blue-400">
              기존에 입력된 시간은 덮어씌워집니다.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={() => {
            // byRange 모드일 경우 계산된 timePerCut을 사용
            const finalSettings = settings.mode === 'byRange'
              ? { ...settings, timePerCut: calculatedTimePerCut }
              : settings
            onApply(finalSettings)
          }}>
            적용
          </Button>
        </div>
      </div>
    </>,
    document.body
  )
}

// Scene batch add settings interface
interface AddSceneSettings {
  sceneNumber: string
  cutCount: number
  sceneTime: 'M' | 'D' | 'E' | 'N' | null
  locationType: 'I' | 'E' | null
  location: string
}

// Scene batch add modal component
function AddSceneModal({
  isOpen,
  onClose,
  onApply,
}: {
  isOpen: boolean
  onClose: () => void
  onApply: (settings: AddSceneSettings) => void
}) {
  const [settings, setSettings] = useState<AddSceneSettings>({
    sceneNumber: '',
    cutCount: 1,
    sceneTime: 'D',
    locationType: 'I',
    location: '',
  })

  if (!isOpen) return null

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-background p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">씬 일괄 추가</h3>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Scene number & Cut count */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="scene-number" className="text-sm font-medium">씬 번호 (S#)</label>
              <Input
                id="scene-number"
                type="text"
                placeholder="예: 3"
                value={settings.sceneNumber}
                onChange={(e) => setSettings(s => ({ ...s, sceneNumber: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="cut-count" className="text-sm font-medium">컷 수</label>
              <Input
                id="cut-count"
                type="number"
                min={1}
                max={50}
                value={settings.cutCount}
                onChange={(e) => setSettings(s => ({ ...s, cutCount: parseInt(e.target.value) || 1 }))}
              />
            </div>
          </div>

          {/* Scene time & Location type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">시간대 (M/D/E/N)</label>
              <div className="flex gap-1">
                {SCENE_TIME_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSettings(s => ({ ...s, sceneTime: opt.value as 'M' | 'D' | 'E' | 'N' }))}
                    className={cn(
                      'flex-1 rounded px-2 py-2 text-xs font-medium transition-colors',
                      settings.sceneTime === opt.value
                        ? opt.color
                        : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">실내외 (I/E)</label>
              <div className="flex gap-1">
                {LOCATION_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSettings(s => ({ ...s, locationType: opt.value as 'I' | 'E' }))}
                    className={cn(
                      'flex-1 rounded px-3 py-2 text-sm font-medium transition-colors',
                      settings.locationType === opt.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label htmlFor="scene-location" className="text-sm font-medium">촬영장소 (선택)</label>
            <Input
              id="scene-location"
              type="text"
              placeholder="예: 카페 내부"
              value={settings.location}
              onChange={(e) => setSettings(s => ({ ...s, location: e.target.value }))}
            />
          </div>

          {/* Preview */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium">미리보기</p>
            <p className="text-xs mt-1">
              S#{settings.sceneNumber || '?'} - {settings.cutCount}개 컷 생성
              {settings.sceneNumber && (
                <span className="ml-1">
                  ({settings.sceneNumber}-1 ~ {settings.sceneNumber}-{settings.cutCount})
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button
            onClick={() => onApply(settings)}
            disabled={!settings.sceneNumber || settings.cutCount < 1}
          >
            추가
          </Button>
        </div>
      </div>
    </>,
    document.body
  )
}

export function ShotPlanTable({
  items,
  onChange,
  onAddRow,
  onDeleteRow,
  availableCast = [],
}: ShotPlanTableProps) {
  const [isAutoFillModalOpen, setIsAutoFillModalOpen] = useState(false)
  const [isAddSceneModalOpen, setIsAddSceneModalOpen] = useState(false)
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

  // Auto-fill time handler
  const handleAutoFillTime = useCallback((settings: AutoFillTimeSettings) => {
    if (items.length === 0) return

    const [startH, startM] = settings.startTime.split(':').map(Number)
    let currentMinutes = startH * 60 + startM

    // Meal time in minutes
    let mealTimeMinutes = 0
    let mealInserted = false
    if (settings.includeMealTime && settings.mealTime) {
      const [mealH, mealM] = settings.mealTime.split(':').map(Number)
      mealTimeMinutes = mealH * 60 + mealM
    }

    const updatedItems = items.map((item, index) => {
      // Check if meal time should be inserted before this cut
      if (
        settings.includeMealTime &&
        !mealInserted &&
        currentMinutes >= mealTimeMinutes &&
        mealTimeMinutes > startH * 60 + startM
      ) {
        // Meal time falls before this cut starts
        currentMinutes = mealTimeMinutes + settings.mealDuration
        mealInserted = true
      }

      // If we haven't passed meal time but this cut will go past meal time
      if (
        settings.includeMealTime &&
        !mealInserted &&
        currentMinutes < mealTimeMinutes &&
        currentMinutes + settings.timePerCut > mealTimeMinutes
      ) {
        // Start after meal break
        currentMinutes = mealTimeMinutes + settings.mealDuration
        mealInserted = true
      }

      const cutStartMinutes = currentMinutes
      const cutEndMinutes = cutStartMinutes + settings.timePerCut

      const startTimeStr = `${String(Math.floor(cutStartMinutes / 60)).padStart(2, '0')}:${String(cutStartMinutes % 60).padStart(2, '0')}`
      const endTimeStr = `${String(Math.floor(cutEndMinutes / 60)).padStart(2, '0')}:${String(cutEndMinutes % 60).padStart(2, '0')}`

      // Move to next cut start time (current cut end + break time)
      currentMinutes = cutEndMinutes + (index < items.length - 1 ? settings.breakTime : 0)

      return {
        ...item,
        start_time: startTimeStr,
        end_time: endTimeStr,
      }
    })

    onChange(updatedItems)
    setIsAutoFillModalOpen(false)
  }, [items, onChange])

  // Add scene batch handler
  const handleAddScene = useCallback((settings: AddSceneSettings) => {
    const newItems: ShotPlanItem[] = []
    const startSequence = items.length + 1

    for (let i = 0; i < settings.cutCount; i++) {
      newItems.push({
        id: crypto.randomUUID(),
        sequence: startSequence + i,
        scene_number: settings.sceneNumber,
        cut_number: `${settings.sceneNumber}-${i + 1}`,
        scene_time: settings.sceneTime,
        scene_location_type: settings.locationType,
        start_time: null,
        end_time: null,
        location: settings.location || null,
        content: '',
        cast_ids: [],
        notes: null,
      })
    }

    onChange([...items, ...newItems])
    setIsAddSceneModalOpen(false)
  }, [items, onChange])

  // Apply scene values to all cuts with same scene number
  const handleApplyToSameScene = useCallback((sourceItem: ShotPlanItem) => {
    if (!sourceItem.scene_number) return

    const updatedItems = items.map((item) => {
      if (item.scene_number === sourceItem.scene_number && item.id !== sourceItem.id) {
        return {
          ...item,
          scene_time: sourceItem.scene_time,
          scene_location_type: sourceItem.scene_location_type,
          location: sourceItem.location,
        }
      }
      return item
    })

    onChange(updatedItems)
  }, [items, onChange])

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
      {/* Auto-fill time modal */}
      <AutoFillTimeModal
        isOpen={isAutoFillModalOpen}
        onClose={() => setIsAutoFillModalOpen(false)}
        onApply={handleAutoFillTime}
        itemCount={items.length}
      />

      {/* Add scene modal */}
      <AddSceneModal
        isOpen={isAddSceneModalOpen}
        onClose={() => setIsAddSceneModalOpen(false)}
        onApply={handleAddScene}
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button onClick={onAddRow} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            행 추가
          </Button>
          <Button
            onClick={() => setIsAddSceneModalOpen(true)}
            size="sm"
            variant="outline"
          >
            <Film className="mr-2 h-4 w-4" />
            씬 추가
          </Button>
          <Button
            onClick={() => setIsAutoFillModalOpen(true)}
            size="sm"
            variant="outline"
            disabled={items.length === 0}
          >
            <Clock className="mr-2 h-4 w-4" />
            시간 자동채우기
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
              <th className="w-[70px] px-2 py-3"></th>
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
                {items.map((item) => {
                  // Check if there are other items with the same scene number
                  const hasSameSceneItems = item.scene_number
                    ? items.filter(i => i.scene_number === item.scene_number).length > 1
                    : false
                  return (
                    <SortableRow
                      key={item.id}
                      item={item}
                      onUpdate={handleUpdateItem}
                      onDelete={onDeleteRow}
                      onApplyToSameScene={handleApplyToSameScene}
                      availableCast={availableCast}
                      hasSameSceneItems={hasSameSceneItems}
                    />
                  )
                })}
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
