'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, Users, Package, UserPlus, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface StaffItem {
  id: string
  role: string
  name: string
  phone: string
  sequence: number
}

export interface EquipmentItem {
  id: string
  department: string
  content: string
}

export interface ProjectPersonForImport {
  id: string
  name: string
  role: string | null
  department: string | null
  phone: string | null
}

interface StaffEquipmentSectionProps {
  staff: StaffItem[]
  equipment: EquipmentItem[]
  onStaffChange: (staff: StaffItem[]) => void
  onEquipmentChange: (equipment: EquipmentItem[]) => void
  onAddStaff: () => void
  onDeleteStaff: (id: string) => void
  availablePeople?: ProjectPersonForImport[]
  onImportStaff?: (people: ProjectPersonForImport[]) => void
}

const DEPARTMENTS = [
  { key: 'direction', label: '연출' },
  { key: 'assistant_direction', label: '조연출' },
  { key: 'camera', label: '촬영/관련장비' },
  { key: 'lighting', label: '조명' },
  { key: 'sound', label: '음향' },
  { key: 'art', label: '미술' },
  { key: 'costume', label: '의상' },
  { key: 'production', label: '제작' },
  { key: 'others', label: '기타' },
]

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

// 피플 불러오기 모달
function ImportPeopleModal({
  isOpen,
  onClose,
  people,
  existingStaffNames,
  onImport,
}: {
  isOpen: boolean
  onClose: () => void
  people: ProjectPersonForImport[]
  existingStaffNames: string[]
  onImport: (selected: ProjectPersonForImport[]) => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  if (!isOpen) return null

  // 캐스트가 아닌 사람들만 필터링
  const staffPeople = people.filter((p) => p.department !== 'cast')

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
    const selectedPeople = staffPeople.filter((p) => selected.has(p.id))
    onImport(selectedPeople)
    setSelected(new Set())
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-background shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="font-semibold">피플에서 불러오기</h3>
          <button onClick={onClose} className="rounded p-1 hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[400px] overflow-y-auto p-4">
          {staffPeople.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              불러올 수 있는 스태프가 없습니다.<br />
              피플 페이지에서 먼저 스태프를 등록해주세요.
            </p>
          ) : (
            <div className="space-y-2">
              {staffPeople.map((person) => {
                const isAlreadyAdded = existingStaffNames.includes(person.name)
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

export function StaffEquipmentSection({
  staff,
  equipment,
  onStaffChange,
  onEquipmentChange,
  onAddStaff,
  onDeleteStaff,
  availablePeople = [],
  onImportStaff,
}: StaffEquipmentSectionProps) {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

  const handleUpdateStaff = useCallback(
    (id: string, field: keyof StaffItem, value: string) => {
      onStaffChange(
        staff.map((item) =>
          item.id === id ? { ...item, [field]: value } : item
        )
      )
    },
    [staff, onStaffChange]
  )

  const handleUpdateEquipment = useCallback(
    (department: string, content: string) => {
      const existing = equipment.find((e) => e.department === department)
      if (existing) {
        onEquipmentChange(
          equipment.map((e) =>
            e.department === department ? { ...e, content } : e
          )
        )
      } else {
        onEquipmentChange([
          ...equipment,
          { id: crypto.randomUUID(), department, content },
        ])
      }
    },
    [equipment, onEquipmentChange]
  )

  const getEquipmentContent = (department: string) => {
    return equipment.find((e) => e.department === department)?.content || ''
  }

  return (
    <div className="space-y-8">
      {/* Import Modal */}
      <ImportPeopleModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        people={availablePeople}
        existingStaffNames={staff.map((s) => s.name)}
        onImport={(selected) => onImportStaff?.(selected)}
      />

      {/* Staff Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">스태프</h3>
          </div>
          <div className="flex items-center gap-2">
            {availablePeople.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsImportModalOpen(true)}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                피플에서 불러오기
              </Button>
            )}
            <Button onClick={onAddStaff} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              스태프 추가
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full">
            <thead className="border-b-2 border-border bg-secondary">
              <tr className="text-left text-xs font-semibold tracking-wider text-muted-foreground">
                <th className="w-[180px] px-3 py-3">역할</th>
                <th className="w-[150px] px-3 py-3">이름</th>
                <th className="w-[150px] px-3 py-3">연락처</th>
                <th className="w-[50px] px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {staff.map((item) => (
                <tr
                  key={item.id}
                  className="group border-b border-border transition-colors hover:bg-muted/50"
                >
                  <td className="px-3 py-2">
                    <EditableCell
                      value={item.role}
                      onChange={(v) => handleUpdateStaff(item.id, 'role', v)}
                      placeholder="역할 입력"
                      className="font-medium"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <EditableCell
                      value={item.name}
                      onChange={(v) => handleUpdateStaff(item.id, 'name', v)}
                      placeholder="이름"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <EditableCell
                      value={item.phone}
                      onChange={(v) => handleUpdateStaff(item.id, 'phone', v)}
                      placeholder="010-0000-0000"
                      className="font-mono text-muted-foreground"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => onDeleteStaff(item.id)}
                      className="rounded p-1 opacity-0 hover:bg-secondary group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {staff.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="mb-2 text-sm text-muted-foreground">스태프가 없습니다</p>
              <Button onClick={onAddStaff} variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                스태프 추가
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Equipment Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">세부진행 / 장비</h3>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {DEPARTMENTS.map((dept) => (
            <div
              key={dept.key}
              className="rounded-lg border border-border bg-card overflow-hidden"
            >
              <div className="border-b border-border bg-secondary/50 px-3 py-2">
                <h4 className="text-sm font-semibold">{dept.label}</h4>
              </div>
              <div className="p-2">
                <Textarea
                  value={getEquipmentContent(dept.key)}
                  onChange={(e) => handleUpdateEquipment(dept.key, e.target.value)}
                  placeholder={`${dept.label} 관련 장비/물품 입력...`}
                  className="min-h-[120px] resize-none border-0 bg-transparent text-sm focus:ring-0"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
