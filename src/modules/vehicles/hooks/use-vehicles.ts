'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Vehicle, CreateVehicleInput, UpdateVehicleInput } from '../types'

export function useVehicles(projectId: string | null) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchVehicles = useCallback(async () => {
    if (!projectId) {
      setVehicles([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('sequence', { ascending: true })

      if (fetchError) throw fetchError

      setVehicles((data as Vehicle[]) || [])
    } catch (err) {
      console.error('Failed to fetch vehicles:', err)
      setError('차량 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [projectId, supabase])

  useEffect(() => {
    fetchVehicles()
  }, [fetchVehicles])

  const addVehicle = useCallback(async (input: CreateVehicleInput): Promise<Vehicle | null> => {
    try {
      const { data: maxSeq } = await supabase
        .from('vehicles')
        .select('sequence')
        .eq('project_id', input.project_id)
        .is('deleted_at', null)
        .order('sequence', { ascending: false })
        .limit(1)
        .single()

      const newSequence = ((maxSeq as { sequence: number } | null)?.sequence || 0) + 1

      const { data, error: insertError } = await supabase
        .from('vehicles')
        .insert({
          ...input,
          sequence: newSequence,
          status: 'planned',
        } as never)
        .select('*')
        .single()

      if (insertError) throw insertError

      const newVehicle = data as Vehicle
      setVehicles(prev => [...prev, newVehicle])
      return newVehicle
    } catch (err) {
      console.error('Failed to add vehicle:', err)
      setError('차량 추가에 실패했습니다.')
      return null
    }
  }, [supabase])

  const updateVehicle = useCallback(async (id: string, input: UpdateVehicleInput): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('vehicles')
        .update(input as never)
        .eq('id', id)

      if (updateError) throw updateError

      setVehicles(prev => prev.map(v =>
        v.id === id ? { ...v, ...input } : v
      ))

      return true
    } catch (err) {
      console.error('Failed to update vehicle:', err)
      setError('차량 수정에 실패했습니다.')
      return false
    }
  }, [supabase])

  const deleteVehicle = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('vehicles')
        .update({ deleted_at: new Date().toISOString() } as never)
        .eq('id', id)

      if (deleteError) throw deleteError

      setVehicles(prev => prev.filter(v => v.id !== id))
      return true
    } catch (err) {
      console.error('Failed to delete vehicle:', err)
      setError('차량 삭제에 실패했습니다.')
      return false
    }
  }, [supabase])

  return {
    vehicles,
    isLoading,
    error,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    refetch: fetchVehicles,
  }
}
