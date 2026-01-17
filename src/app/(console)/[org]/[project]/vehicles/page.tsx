'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Trash2, Car } from 'lucide-react'
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
import { useVehicles, vehicleTypeLabels, vehicleStatusLabels } from '@/modules/vehicles'
import type { VehicleType, VehicleStatus } from '@/modules/vehicles'

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

export default function VehiclesPage() {
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

  const { vehicles, isLoading: isDataLoading, addVehicle, updateVehicle, deleteVehicle } = useVehicles(projectId)

  const isLoading = isProjectLoading || isDataLoading
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newVehicle, setNewVehicle] = useState({
    name: '',
    vehicle_type: 'car' as VehicleType,
  })

  const handleAdd = async () => {
    if (!newVehicle.name.trim() || !projectId) return

    await addVehicle({
      project_id: projectId,
      name: newVehicle.name.trim(),
      vehicle_type: newVehicle.vehicle_type,
    })

    setNewVehicle({ name: '', vehicle_type: 'car' })
    setIsAddDialogOpen(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm('이 차량을 삭제하시겠습니까?')) {
      await deleteVehicle(id)
    }
  }

  if (isLoading) {
    return (
      <AppShell org={org} project={project} title="차량/이동">
        <div className="p-6">로딩 중...</div>
      </AppShell>
    )
  }

  return (
    <AppShell org={org} project={project} title="차량/이동">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Car className="h-6 w-6" />
            <h1 className="text-2xl font-bold">차량/이동 관리</h1>
          </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          차량 추가
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="w-36 px-3 py-3 text-left text-xs font-medium text-muted-foreground">차량명</th>
              <th className="w-24 px-3 py-3 text-left text-xs font-medium text-muted-foreground">유형</th>
              <th className="w-28 px-3 py-3 text-left text-xs font-medium text-muted-foreground">차량번호</th>
              <th className="w-32 px-3 py-3 text-left text-xs font-medium text-muted-foreground">렌탈업체</th>
              <th className="w-24 px-3 py-3 text-left text-xs font-medium text-muted-foreground">기사명</th>
              <th className="w-32 px-3 py-3 text-left text-xs font-medium text-muted-foreground">기사 연락처</th>
              <th className="w-24 px-3 py-3 text-left text-xs font-medium text-muted-foreground">상태</th>
              <th className="w-12 px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {vehicles.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-muted-foreground">
                  <Car className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  등록된 차량이 없습니다
                </td>
              </tr>
            ) : (
              vehicles.map((v) => (
                <tr key={v.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-3 py-2">
                    <EditableInput
                      value={v.name}
                      onSave={(val) => updateVehicle(v.id, { name: val })}
                      placeholder="차량명"
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={v.vehicle_type}
                      onChange={(e) => updateVehicle(v.id, { vehicle_type: e.target.value as VehicleType })}
                      className="h-8 w-20 rounded border border-input bg-background px-1 text-sm"
                    >
                      {Object.entries(vehicleTypeLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <EditableInput
                      value={v.plate_number}
                      onSave={(val) => updateVehicle(v.id, { plate_number: val || null })}
                      placeholder="차량번호"
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <EditableInput
                      value={v.rental_company}
                      onSave={(val) => updateVehicle(v.id, { rental_company: val || null })}
                      placeholder="렌탈업체"
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <EditableInput
                      value={v.driver_name}
                      onSave={(val) => updateVehicle(v.id, { driver_name: val || null })}
                      placeholder="기사명"
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <EditableInput
                      value={v.driver_phone}
                      onSave={(val) => updateVehicle(v.id, { driver_phone: val || null })}
                      placeholder="연락처"
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={v.status}
                      onChange={(e) => updateVehicle(v.id, { status: e.target.value as VehicleStatus })}
                      className="h-8 w-20 rounded border border-input bg-background px-1 text-sm"
                    >
                      {Object.entries(vehicleStatusLabels).map(([value, label]) => (
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
                      onClick={() => handleDelete(v.id)}
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
            <DialogTitle>차량 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">차량명</label>
              <Input
                value={newVehicle.name}
                onChange={(e) => setNewVehicle({ ...newVehicle, name: e.target.value })}
                placeholder="예: 촬영1호차"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">차량 유형</label>
              <select
                value={newVehicle.vehicle_type}
                onChange={(e) => setNewVehicle({ ...newVehicle, vehicle_type: e.target.value as VehicleType })}
                className="h-10 w-full rounded border border-input bg-background px-3 text-sm"
              >
                {Object.entries(vehicleTypeLabels).map(([value, label]) => (
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
