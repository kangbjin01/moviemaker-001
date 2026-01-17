'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Location, CreateLocationInput, UpdateLocationInput } from '../types'

export function useLocations(projectId: string | null) {
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // 로케이션 목록 조회
  const fetchLocations = useCallback(async () => {
    if (!projectId) {
      setLocations([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('locations')
        .select('*')
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('sequence', { ascending: true })
        .order('name', { ascending: true })

      if (fetchError) throw fetchError

      // images 필드 파싱
      const parsed = (data || []).map(loc => ({
        ...loc,
        images: Array.isArray(loc.images) ? loc.images : [],
      }))

      setLocations(parsed)
    } catch (err) {
      console.error('Failed to fetch locations:', err)
      setError('로케이션 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [projectId, supabase])

  useEffect(() => {
    fetchLocations()
  }, [fetchLocations])

  // 로케이션 추가
  const addLocation = useCallback(async (input: CreateLocationInput): Promise<Location | null> => {
    try {
      // 현재 최대 sequence 조회
      const { data: maxSeq } = await supabase
        .from('locations')
        .select('sequence')
        .eq('project_id', input.project_id)
        .is('deleted_at', null)
        .order('sequence', { ascending: false })
        .limit(1)
        .single()

      const newSequence = ((maxSeq as { sequence: number } | null)?.sequence || 0) + 1

      const { data, error: insertError } = await supabase
        .from('locations')
        .insert({
          ...input,
          sequence: newSequence,
          images: [],
        } as never)
        .select()
        .single()

      if (insertError) throw insertError

      const newLocation = {
        ...(data as Record<string, unknown>),
        images: [],
      } as Location

      setLocations(prev => [...prev, newLocation])
      return newLocation
    } catch (err) {
      console.error('Failed to add location:', err)
      setError('로케이션 추가에 실패했습니다.')
      return null
    }
  }, [supabase])

  // 로케이션 수정
  const updateLocation = useCallback(async (id: string, input: UpdateLocationInput): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('locations')
        .update(input as never)
        .eq('id', id)

      if (updateError) throw updateError

      // 로컬 상태 업데이트
      setLocations(prev => prev.map(loc =>
        loc.id === id ? { ...loc, ...input } : loc
      ))

      return true
    } catch (err) {
      console.error('Failed to update location:', err)
      setError('로케이션 수정에 실패했습니다.')
      return false
    }
  }, [supabase])

  // 로케이션 삭제 (soft delete)
  const deleteLocation = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('locations')
        .update({ deleted_at: new Date().toISOString() } as never)
        .eq('id', id)

      if (deleteError) throw deleteError

      setLocations(prev => prev.filter(loc => loc.id !== id))
      return true
    } catch (err) {
      console.error('Failed to delete location:', err)
      setError('로케이션 삭제에 실패했습니다.')
      return false
    }
  }, [supabase])

  return {
    locations,
    isLoading,
    error,
    addLocation,
    updateLocation,
    deleteLocation,
    refetch: fetchLocations,
  }
}
