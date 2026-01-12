// @ts-nocheck
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface ProjectPerson {
  id: string
  project_id: string
  name: string
  role: string | null
  department: string | null
  phone: string | null
  email: string | null
  notes: string | null
  is_cast: boolean
  created_at: string
  updated_at: string
}

export type Department =
  | 'direction'      // 연출부
  | 'camera'         // 촬영부
  | 'lighting'       // 조명부
  | 'sound'          // 음향부
  | 'art'            // 미술부
  | 'costume'        // 의상부
  | 'makeup'         // 분장부
  | 'production'     // 제작부
  | 'cast'           // 캐스트
  | 'others'         // 기타

export const DEPARTMENT_LABELS: Record<Department, string> = {
  direction: '연출부',
  camera: '촬영부',
  lighting: '조명부',
  sound: '음향부',
  art: '미술부',
  costume: '의상부',
  makeup: '분장부',
  production: '제작부',
  cast: '캐스트',
  others: '기타',
}

// 부서별 역할 목록
export const ROLES_BY_DEPARTMENT: Record<Department, string[]> = {
  direction: ['감독', '연출', '조감독', '세컨', '써드', '스크립터', '현장스틸'],
  camera: ['촬영감독', 'A카메라', 'B카메라', '포커스풀러', 'DIT', '짐벌', '드론', '스테디캠'],
  lighting: ['조명감독', '조명팀장', '조명', '조명보조', '발전차'],
  sound: ['음향감독', '붐오퍼레이터', '동시녹음', '음향보조'],
  art: ['미술감독', '미술팀장', '세트', '소품', '소품보조', '특수소품'],
  costume: ['의상감독', '의상팀장', '의상', '의상보조'],
  makeup: ['분장감독', '분장', '헤어', '특수분장'],
  production: ['프로듀서', '라인프로듀서', '제작부장', '제작', '제작보조', '회계', '차량', '로케매니저'],
  cast: ['주연', '조연', '단역', '엑스트라', '스턴트'],
  others: ['스틸', 'VFX', '메이킹', '케이터링', '기타'],
}

// 전체 역할 목록 (flat)
export const ALL_ROLES = Object.values(ROLES_BY_DEPARTMENT).flat()

export function useProjectPeople(projectId: string) {
  const [people, setPeople] = useState<ProjectPerson[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Memoize supabase client to prevent infinite loops
  const supabase = useMemo(() => createClient(), [])

  // Fetch all people
  const fetchPeople = useCallback(async () => {
    if (!projectId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('project_people')
        .select('*')
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('department', { ascending: true })
        .order('name', { ascending: true })

      if (fetchError) throw fetchError

      setPeople(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [projectId, supabase])

  useEffect(() => {
    fetchPeople()
  }, [fetchPeople])

  // Add person
  const addPerson = useCallback(
    async (person: Omit<ProjectPerson, 'id' | 'project_id' | 'created_at' | 'updated_at'>) => {
      if (!projectId) return null

      const newPerson = {
        id: crypto.randomUUID(),
        project_id: projectId,
        ...person,
      }

      const { error } = await supabase.from('project_people').insert([newPerson] as any)

      if (error) {
        setError(error.message)
        return null
      }

      setPeople((prev) => [...prev, newPerson as ProjectPerson])
      return newPerson
    },
    [projectId, supabase]
  )

  // Update person
  const updatePerson = useCallback(
    async (id: string, updates: Partial<ProjectPerson>) => {
      // @ts-ignore
      const { error } = await supabase
        .from('project_people')
        .update(updates)
        .eq('id', id)

      if (error) {
        setError(error.message)
        return false
      }

      setPeople((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      )
      return true
    },
    [supabase]
  )

  // Delete person (soft delete)
  const deletePerson = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from('project_people')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        setError(error.message)
        return false
      }

      setPeople((prev) => prev.filter((p) => p.id !== id))
      return true
    },
    [supabase]
  )

  // Get people by department
  const getPeopleByDepartment = useCallback(
    (department: Department) => {
      return people.filter((p) => p.department === department)
    },
    [people]
  )

  // Get staff (non-cast)
  const staff = people.filter((p) => !p.is_cast)

  // Get cast
  const cast = people.filter((p) => p.is_cast)

  return {
    people,
    staff,
    cast,
    isLoading,
    error,
    addPerson,
    updatePerson,
    deletePerson,
    getPeopleByDepartment,
    refetch: fetchPeople,
  }
}
