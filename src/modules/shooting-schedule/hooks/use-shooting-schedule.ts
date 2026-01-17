'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ShootingSchedule, CreateScheduleInput, UpdateScheduleInput } from '../types'

export function useShootingSchedule(projectId: string | null) {
  const [schedules, setSchedules] = useState<ShootingSchedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchSchedules = useCallback(async () => {
    if (!projectId) {
      setSchedules([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('shooting_schedule')
        .select('*')
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('shoot_date', { ascending: true })

      if (fetchError) throw fetchError

      setSchedules((data as ShootingSchedule[]) || [])
    } catch (err) {
      console.error('Failed to fetch schedules:', err)
      setError('촬영 스케줄을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [projectId, supabase])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  const addSchedule = useCallback(async (input: CreateScheduleInput): Promise<ShootingSchedule | null> => {
    try {
      const { data, error: insertError } = await supabase
        .from('shooting_schedule')
        .insert({
          ...input,
          status: 'planned',
        } as never)
        .select('*')
        .single()

      if (insertError) throw insertError

      const newSchedule = data as ShootingSchedule
      setSchedules(prev => [...prev, newSchedule].sort((a, b) =>
        new Date(a.shoot_date).getTime() - new Date(b.shoot_date).getTime()
      ))
      return newSchedule
    } catch (err) {
      console.error('Failed to add schedule:', err)
      setError('촬영일 추가에 실패했습니다.')
      return null
    }
  }, [supabase])

  const updateSchedule = useCallback(async (id: string, input: UpdateScheduleInput): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('shooting_schedule')
        .update(input as never)
        .eq('id', id)

      if (updateError) throw updateError

      setSchedules(prev => prev.map(s =>
        s.id === id ? { ...s, ...input } : s
      ))

      return true
    } catch (err) {
      console.error('Failed to update schedule:', err)
      setError('촬영일 수정에 실패했습니다.')
      return false
    }
  }, [supabase])

  const deleteSchedule = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('shooting_schedule')
        .update({ deleted_at: new Date().toISOString() } as never)
        .eq('id', id)

      if (deleteError) throw deleteError

      setSchedules(prev => prev.filter(s => s.id !== id))
      return true
    } catch (err) {
      console.error('Failed to delete schedule:', err)
      setError('촬영일 삭제에 실패했습니다.')
      return false
    }
  }, [supabase])

  return {
    schedules,
    isLoading,
    error,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    refetch: fetchSchedules,
  }
}
