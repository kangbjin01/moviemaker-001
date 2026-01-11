'use client'

import { useState, useCallback, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { AppShell } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Trash2,
  Users,
  UserCircle,
  Search,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'
import {
  useProjectPeople,
  DEPARTMENT_LABELS,
  ROLES_BY_DEPARTMENT,
  type Department,
  type ProjectPerson,
} from '@/lib/hooks/use-project-people'

const DEPARTMENTS: Department[] = [
  'direction',
  'camera',
  'lighting',
  'sound',
  'art',
  'costume',
  'makeup',
  'production',
  'cast',
  'others',
]

function PersonRow({
  person,
  onUpdate,
  onDelete,
}: {
  person: ProjectPerson
  onUpdate: (id: string, updates: Partial<ProjectPerson>) => void
  onDelete: (id: string) => void
}) {
  const [localValues, setLocalValues] = useState({
    name: person.name,
    phone: person.phone || '',
    email: person.email || '',
    notes: person.notes || '',
  })

  const handleBlur = (field: keyof typeof localValues) => {
    if (localValues[field] !== (person[field] || '')) {
      onUpdate(person.id, { [field]: localValues[field] || null })
    }
  }

  return (
    <tr className="group border-b border-border transition-colors hover:bg-muted/50">
      <td className="px-3 py-2">
        <input
          type="text"
          value={localValues.name}
          onChange={(e) => setLocalValues((prev) => ({ ...prev, name: e.target.value }))}
          onBlur={() => handleBlur('name')}
          placeholder="이름"
          className="w-full rounded border-0 bg-transparent px-2 py-1.5 text-sm font-medium focus:bg-secondary focus:outline-none focus:ring-1 focus:ring-border"
        />
      </td>
      <td className="px-3 py-2">
        <select
          value={person.department || ''}
          onChange={(e) => onUpdate(person.id, { department: e.target.value || null, role: null })}
          className="w-full rounded border-0 bg-transparent px-2 py-1.5 text-sm focus:bg-secondary focus:outline-none focus:ring-1 focus:ring-border"
        >
          <option value="">부서 선택</option>
          {DEPARTMENTS.map((dept) => (
            <option key={dept} value={dept}>
              {DEPARTMENT_LABELS[dept]}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2">
        <select
          value={person.role || ''}
          onChange={(e) => onUpdate(person.id, { role: e.target.value || null })}
          className="w-full rounded border-0 bg-transparent px-2 py-1.5 text-sm focus:bg-secondary focus:outline-none focus:ring-1 focus:ring-border"
        >
          <option value="">역할 선택</option>
          {person.department && ROLES_BY_DEPARTMENT[person.department as Department]?.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2">
        <input
          type="text"
          value={localValues.phone}
          onChange={(e) => setLocalValues((prev) => ({ ...prev, phone: e.target.value }))}
          onBlur={() => handleBlur('phone')}
          placeholder="010-0000-0000"
          className="w-full rounded border-0 bg-transparent px-2 py-1.5 text-sm font-mono text-muted-foreground focus:bg-secondary focus:outline-none focus:ring-1 focus:ring-border"
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="email"
          value={localValues.email}
          onChange={(e) => setLocalValues((prev) => ({ ...prev, email: e.target.value }))}
          onBlur={() => handleBlur('email')}
          placeholder="email@example.com"
          className="w-full rounded border-0 bg-transparent px-2 py-1.5 text-sm text-muted-foreground focus:bg-secondary focus:outline-none focus:ring-1 focus:ring-border"
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="text"
          value={localValues.notes}
          onChange={(e) => setLocalValues((prev) => ({ ...prev, notes: e.target.value }))}
          onBlur={() => handleBlur('notes')}
          placeholder="비고"
          className="w-full rounded border-0 bg-transparent px-2 py-1.5 text-sm focus:bg-secondary focus:outline-none focus:ring-1 focus:ring-border"
        />
      </td>
      <td className="px-3 py-2">
        <button
          onClick={() => onDelete(person.id)}
          className="rounded p-1 opacity-0 hover:bg-secondary group-hover:opacity-100"
        >
          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
        </button>
      </td>
    </tr>
  )
}

export default function PeoplePage() {
  const params = useParams()
  const org = params.org as string
  const project = params.project as string

  const [projectId, setProjectId] = useState<string | null>(null)
  const [isLoadingProject, setIsLoadingProject] = useState(true)

  const supabase = createClient()

  // 프로젝트 슬러그로 ID 조회
  useEffect(() => {
    async function fetchProjectId() {
      const { data } = await supabase
        .from('projects')
        .select('id')
        .eq('slug', project)
        .single()

      if (data) {
        setProjectId(data.id)
      }
      setIsLoadingProject(false)
    }
    fetchProjectId()
  }, [project, supabase])

  const {
    people,
    staff,
    cast,
    isLoading,
    error,
    addPerson,
    updatePerson,
    deletePerson,
  } = useProjectPeople(projectId || '')

  const [activeTab, setActiveTab] = useState<'all' | 'staff' | 'cast'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const handleAddStaff = async () => {
    await addPerson({
      name: '',
      role: null,
      department: null,
      phone: null,
      email: null,
      notes: null,
      is_cast: false,
    })
  }

  const handleAddCast = async () => {
    await addPerson({
      name: '',
      role: null,
      department: 'cast',
      phone: null,
      email: null,
      notes: null,
      is_cast: true,
    })
  }

  const handleUpdate = useCallback(
    (id: string, updates: Partial<ProjectPerson>) => {
      updatePerson(id, updates)
    },
    [updatePerson]
  )

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm('정말 삭제하시겠습니까?')) {
        deletePerson(id)
      }
    },
    [deletePerson]
  )

  // Filter people based on tab and search
  const filteredPeople = (() => {
    let filtered = people

    // Filter by tab
    if (activeTab === 'staff') {
      filtered = staff
    } else if (activeTab === 'cast') {
      filtered = cast
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.role?.toLowerCase().includes(query) ||
          p.department?.toLowerCase().includes(query) ||
          p.phone?.toLowerCase().includes(query)
      )
    }

    return filtered
  })()

  // Group by department
  const groupedByDepartment = DEPARTMENTS.reduce((acc, dept) => {
    const deptPeople = filteredPeople.filter((p) => p.department === dept)
    if (deptPeople.length > 0) {
      acc[dept] = deptPeople
    }
    return acc
  }, {} as Record<Department, ProjectPerson[]>)

  // People without department
  const noDepartment = filteredPeople.filter((p) => !p.department)

  if (isLoadingProject || isLoading) {
    return (
      <AppShell org={org} project={project} title="피플">
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    )
  }

  if (!projectId) {
    return (
      <AppShell org={org} project={project} title="피플">
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground">프로젝트를 찾을 수 없습니다</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell org={org} project={project} title="피플">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="border-b border-border bg-background px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">피플</h1>
              <p className="text-sm text-muted-foreground">
                프로젝트 스태프 및 캐스트를 관리합니다
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleAddStaff} variant="outline" size="sm">
                <Users className="mr-2 h-4 w-4" />
                스태프 추가
              </Button>
              <Button onClick={handleAddCast} size="sm">
                <UserCircle className="mr-2 h-4 w-4" />
                캐스트 추가
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="border-b border-border bg-background px-6 py-3">
          <div className="flex items-center gap-4">
            {/* Tab Buttons */}
            <div className="inline-flex items-center gap-1 rounded-xl bg-secondary/50 p-1">
              <button
                onClick={() => setActiveTab('all')}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  activeTab === 'all'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-background/50'
                )}
              >
                전체 ({people.length})
              </button>
              <button
                onClick={() => setActiveTab('staff')}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  activeTab === 'staff'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-background/50'
                )}
              >
                스태프 ({staff.length})
              </button>
              <button
                onClick={() => setActiveTab('cast')}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  activeTab === 'cast'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-background/50'
                )}
              >
                캐스트 ({cast.length})
              </button>
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="이름, 역할, 연락처 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {filteredPeople.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="mb-2 text-muted-foreground">
                {searchQuery ? '검색 결과가 없습니다' : '아직 등록된 인원이 없습니다'}
              </p>
              {!searchQuery && (
                <div className="flex gap-2">
                  <Button onClick={handleAddStaff} variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    스태프 추가
                  </Button>
                  <Button onClick={handleAddCast} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    캐스트 추가
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Grouped by department */}
              {Object.entries(groupedByDepartment).map(([dept, deptPeople]) => (
                <div key={dept} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {DEPARTMENT_LABELS[dept as Department]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {deptPeople.length}명
                    </span>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full">
                      <thead className="border-b border-border bg-secondary/50">
                        <tr className="text-left text-xs font-semibold tracking-wider text-muted-foreground">
                          <th className="w-[150px] px-3 py-2">이름</th>
                          <th className="w-[120px] px-3 py-2">부서</th>
                          <th className="w-[150px] px-3 py-2">역할</th>
                          <th className="w-[140px] px-3 py-2">연락처</th>
                          <th className="w-[180px] px-3 py-2">이메일</th>
                          <th className="px-3 py-2">비고</th>
                          <th className="w-[50px] px-3 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {deptPeople.map((person) => (
                          <PersonRow
                            key={person.id}
                            person={person}
                            onUpdate={handleUpdate}
                            onDelete={handleDelete}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              {/* No department */}
              {noDepartment.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">미분류</Badge>
                    <span className="text-xs text-muted-foreground">
                      {noDepartment.length}명
                    </span>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full">
                      <thead className="border-b border-border bg-secondary/50">
                        <tr className="text-left text-xs font-semibold tracking-wider text-muted-foreground">
                          <th className="w-[150px] px-3 py-2">이름</th>
                          <th className="w-[120px] px-3 py-2">부서</th>
                          <th className="w-[150px] px-3 py-2">역할</th>
                          <th className="w-[140px] px-3 py-2">연락처</th>
                          <th className="w-[180px] px-3 py-2">이메일</th>
                          <th className="px-3 py-2">비고</th>
                          <th className="w-[50px] px-3 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {noDepartment.map((person) => (
                          <PersonRow
                            key={person.id}
                            person={person}
                            onUpdate={handleUpdate}
                            onDelete={handleDelete}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
