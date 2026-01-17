'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Shot, CreateShotInput, UpdateShotInput } from '../types'

export function useShots(projectId: string | null, sceneId?: string | null) {
  const [shots, setShots] = useState<Shot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchShots = useCallback(async () => {
    if (!projectId) {
      setShots([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('shots')
        .select('*')
        .eq('project_id', projectId)
        .is('deleted_at', null)

      if (sceneId) {
        query = query.eq('scene_id', sceneId)
      }

      const { data, error: fetchError } = await query
        .order('sequence', { ascending: true })
        .order('shot_number', { ascending: true })

      if (fetchError) throw fetchError

      setShots((data as Shot[]) || [])
    } catch (err) {
      console.error('Failed to fetch shots:', err)
      setError('샷 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [projectId, sceneId, supabase])

  useEffect(() => {
    fetchShots()
  }, [fetchShots])

  const addShot = useCallback(async (input: CreateShotInput): Promise<Shot | null> => {
    try {
      const { data: maxSeq } = await supabase
        .from('shots')
        .select('sequence')
        .eq('project_id', input.project_id)
        .is('deleted_at', null)
        .order('sequence', { ascending: false })
        .limit(1)
        .single()

      const newSequence = ((maxSeq as { sequence: number } | null)?.sequence || 0) + 1

      const { data, error: insertError } = await supabase
        .from('shots')
        .insert({
          ...input,
          sequence: newSequence,
        } as never)
        .select('*')
        .single()

      if (insertError) throw insertError

      const newShot = data as Shot
      setShots(prev => [...prev, newShot])
      return newShot
    } catch (err) {
      console.error('Failed to add shot:', err)
      setError('샷 추가에 실패했습니다.')
      return null
    }
  }, [supabase])

  const updateShot = useCallback(async (id: string, input: UpdateShotInput): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('shots')
        .update(input as never)
        .eq('id', id)

      if (updateError) throw updateError

      setShots(prev => prev.map(s =>
        s.id === id ? { ...s, ...input } : s
      ))

      return true
    } catch (err) {
      console.error('Failed to update shot:', err)
      setError('샷 수정에 실패했습니다.')
      return false
    }
  }, [supabase])

  const deleteShot = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('shots')
        .update({ deleted_at: new Date().toISOString() } as never)
        .eq('id', id)

      if (deleteError) throw deleteError

      setShots(prev => prev.filter(s => s.id !== id))
      return true
    } catch (err) {
      console.error('Failed to delete shot:', err)
      setError('샷 삭제에 실패했습니다.')
      return false
    }
  }, [supabase])

  return {
    shots,
    isLoading,
    error,
    addShot,
    updateShot,
    deleteShot,
    refetch: fetchShots,
  }
}
