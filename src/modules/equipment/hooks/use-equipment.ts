'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Equipment, CreateEquipmentInput, UpdateEquipmentInput, EquipmentCategory } from '../types'

export function useEquipment(projectId: string | null, category?: EquipmentCategory) {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchEquipment = useCallback(async () => {
    if (!projectId) {
      setEquipment([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('equipment')
        .select('*')
        .eq('project_id', projectId)
        .is('deleted_at', null)

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error: fetchError } = await query
        .order('category', { ascending: true })
        .order('sequence', { ascending: true })

      if (fetchError) throw fetchError

      setEquipment((data as Equipment[]) || [])
    } catch (err) {
      console.error('Failed to fetch equipment:', err)
      setError('장비 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [projectId, category, supabase])

  useEffect(() => {
    fetchEquipment()
  }, [fetchEquipment])

  const addEquipment = useCallback(async (input: CreateEquipmentInput): Promise<Equipment | null> => {
    try {
      const { data: maxSeq } = await supabase
        .from('equipment')
        .select('sequence')
        .eq('project_id', input.project_id)
        .is('deleted_at', null)
        .order('sequence', { ascending: false })
        .limit(1)
        .single()

      const newSequence = ((maxSeq as { sequence: number } | null)?.sequence || 0) + 1

      const { data, error: insertError } = await supabase
        .from('equipment')
        .insert({
          ...input,
          sequence: newSequence,
          quantity: input.quantity || 1,
          status: 'planned',
        } as never)
        .select('*')
        .single()

      if (insertError) throw insertError

      const newEquipment = data as Equipment
      setEquipment(prev => [...prev, newEquipment])
      return newEquipment
    } catch (err) {
      console.error('Failed to add equipment:', err)
      setError('장비 추가에 실패했습니다.')
      return null
    }
  }, [supabase])

  const updateEquipment = useCallback(async (id: string, input: UpdateEquipmentInput): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('equipment')
        .update(input as never)
        .eq('id', id)

      if (updateError) throw updateError

      setEquipment(prev => prev.map(e =>
        e.id === id ? { ...e, ...input } : e
      ))

      return true
    } catch (err) {
      console.error('Failed to update equipment:', err)
      setError('장비 수정에 실패했습니다.')
      return false
    }
  }, [supabase])

  const deleteEquipment = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('equipment')
        .update({ deleted_at: new Date().toISOString() } as never)
        .eq('id', id)

      if (deleteError) throw deleteError

      setEquipment(prev => prev.filter(e => e.id !== id))
      return true
    } catch (err) {
      console.error('Failed to delete equipment:', err)
      setError('장비 삭제에 실패했습니다.')
      return false
    }
  }, [supabase])

  return {
    equipment,
    isLoading,
    error,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    refetch: fetchEquipment,
  }
}
