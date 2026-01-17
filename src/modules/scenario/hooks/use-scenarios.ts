'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Scenario, CreateScenarioInput, UpdateScenarioInput } from '../types'

export function useScenarios(projectId: string | null) {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchScenarios = useCallback(async () => {
    if (!projectId) {
      setScenarios([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('scenarios')
        .select('*')
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })

      if (fetchError) throw fetchError

      setScenarios((data as Scenario[]) || [])
    } catch (err) {
      console.error('Failed to fetch scenarios:', err)
      setError('시나리오 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [projectId, supabase])

  useEffect(() => {
    fetchScenarios()
  }, [fetchScenarios])

  const addScenario = useCallback(async (input: CreateScenarioInput): Promise<Scenario | null> => {
    try {
      const { data, error: insertError } = await supabase
        .from('scenarios')
        .insert({
          ...input,
          status: 'draft',
        } as never)
        .select('*')
        .single()

      if (insertError) throw insertError

      const newScenario = data as Scenario
      setScenarios(prev => [newScenario, ...prev])
      return newScenario
    } catch (err) {
      console.error('Failed to add scenario:', err)
      setError('시나리오 추가에 실패했습니다.')
      return null
    }
  }, [supabase])

  const updateScenario = useCallback(async (id: string, input: UpdateScenarioInput): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('scenarios')
        .update(input as never)
        .eq('id', id)

      if (updateError) throw updateError

      setScenarios(prev => prev.map(s =>
        s.id === id ? { ...s, ...input } : s
      ))

      return true
    } catch (err) {
      console.error('Failed to update scenario:', err)
      setError('시나리오 수정에 실패했습니다.')
      return false
    }
  }, [supabase])

  const deleteScenario = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('scenarios')
        .update({ deleted_at: new Date().toISOString() } as never)
        .eq('id', id)

      if (deleteError) throw deleteError

      setScenarios(prev => prev.filter(s => s.id !== id))
      return true
    } catch (err) {
      console.error('Failed to delete scenario:', err)
      setError('시나리오 삭제에 실패했습니다.')
      return false
    }
  }, [supabase])

  return {
    scenarios,
    isLoading,
    error,
    addScenario,
    updateScenario,
    deleteScenario,
    refetch: fetchScenarios,
  }
}
