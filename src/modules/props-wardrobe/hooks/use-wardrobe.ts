'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Wardrobe, CreateWardrobeInput, UpdateWardrobeInput } from '../types'

export function useWardrobe(projectId: string | null) {
  const [wardrobe, setWardrobe] = useState<Wardrobe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchWardrobe = useCallback(async () => {
    if (!projectId) {
      setWardrobe([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('wardrobe')
        .select('*')
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('sequence', { ascending: true })

      if (fetchError) throw fetchError

      setWardrobe((data as Wardrobe[]) || [])
    } catch (err) {
      console.error('Failed to fetch wardrobe:', err)
      setError('의상 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [projectId, supabase])

  useEffect(() => {
    fetchWardrobe()
  }, [fetchWardrobe])

  const addWardrobe = useCallback(async (input: CreateWardrobeInput): Promise<Wardrobe | null> => {
    try {
      const { data: maxSeq } = await supabase
        .from('wardrobe')
        .select('sequence')
        .eq('project_id', input.project_id)
        .is('deleted_at', null)
        .order('sequence', { ascending: false })
        .limit(1)
        .single()

      const newSequence = ((maxSeq as { sequence: number } | null)?.sequence || 0) + 1

      const { data, error: insertError } = await supabase
        .from('wardrobe')
        .insert({
          ...input,
          sequence: newSequence,
          source: input.source || 'purchase',
          status: 'needed',
        } as never)
        .select('*')
        .single()

      if (insertError) throw insertError

      const newWardrobe = data as Wardrobe
      setWardrobe(prev => [...prev, newWardrobe])
      return newWardrobe
    } catch (err) {
      console.error('Failed to add wardrobe:', err)
      setError('의상 추가에 실패했습니다.')
      return null
    }
  }, [supabase])

  const updateWardrobe = useCallback(async (id: string, input: UpdateWardrobeInput): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('wardrobe')
        .update(input as never)
        .eq('id', id)

      if (updateError) throw updateError

      setWardrobe(prev => prev.map(w =>
        w.id === id ? { ...w, ...input } : w
      ))

      return true
    } catch (err) {
      console.error('Failed to update wardrobe:', err)
      setError('의상 수정에 실패했습니다.')
      return false
    }
  }, [supabase])

  const deleteWardrobe = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('wardrobe')
        .update({ deleted_at: new Date().toISOString() } as never)
        .eq('id', id)

      if (deleteError) throw deleteError

      setWardrobe(prev => prev.filter(w => w.id !== id))
      return true
    } catch (err) {
      console.error('Failed to delete wardrobe:', err)
      setError('의상 삭제에 실패했습니다.')
      return false
    }
  }, [supabase])

  return {
    wardrobe,
    isLoading,
    error,
    addWardrobe,
    updateWardrobe,
    deleteWardrobe,
    refetch: fetchWardrobe,
  }
}
