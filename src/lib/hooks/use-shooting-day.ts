// @ts-nocheck
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ShotPlanItem } from '@/components/shooting-day'

export interface ShootingDay {
  id: string
  project_id: string
  day_number: number | null
  shoot_date: string
  call_time: string | null
  shooting_time_start: string | null
  shooting_time_end: string | null
  base_location_id: string | null
  base_location: string | null // 촬영장소 (텍스트)
  assembly_location: string | null // 집합장소
  weather: string | null // 일기예보
  precipitation: string | null // 강수확률
  temp_low: string | null // 최저온도
  temp_high: string | null // 최고온도
  sunrise: string | null // 일출시간
  sunset: string | null // 일몰시간
  notes: string | null // 기타사항
  status: 'draft' | 'published'
  version: number
}

export interface ShootingDayWithItems extends ShootingDay {
  shot_plan_items: ShotPlanItem[]
}

export function useShootingDay(dayId: string) {
  const [shootingDay, setShootingDay] = useState<ShootingDay | null>(null)
  const [items, setItems] = useState<ShotPlanItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Memoize supabase client to prevent infinite loops
  const supabase = useMemo(() => createClient(), [])

  // Fetch shooting day and items
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch shooting day
      const { data: day, error: dayError } = await supabase
        .from('shooting_days')
        .select('*')
        .eq('id', dayId)
        .single()

      if (dayError) throw dayError

      setShootingDay(day)

      // Fetch shot plan items
      const { data: planItems, error: itemsError } = await supabase
        .from('shot_plan_items')
        .select('*')
        .eq('shooting_day_id', dayId)
        .is('deleted_at', null)
        .order('sequence', { ascending: true })

      if (itemsError) throw itemsError

      // Transform to match component interface
      const transformedItems: ShotPlanItem[] = (planItems || []).map(item => ({
        id: item.id,
        sequence: item.sequence,
        scene_number: item.scene_number,
        cut_number: item.cut_number,
        scene_time: item.scene_time as 'M' | 'D' | 'E' | 'N' | null,
        scene_location_type: item.scene_location_type as 'I' | 'E' | null,
        start_time: item.start_time,
        end_time: item.end_time,
        location: item.location_override || null,
        content: item.content,
        cast_ids: item.cast_ids || [],
        notes: item.notes,
      }))

      setItems(transformedItems)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [dayId, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Update shooting day header
  const updateShootingDay = useCallback(async (updates: Partial<ShootingDay>) => {
    const { error } = await supabase
      .from('shooting_days')
      .update(updates)
      .eq('id', dayId)

    if (error) {
      setError(error.message)
      return false
    }

    setShootingDay(prev => prev ? { ...prev, ...updates } : null)
    return true
  }, [dayId, supabase])

  // Update shot plan items
  const updateItems = useCallback(async (newItems: ShotPlanItem[]) => {
    setItems(newItems)

    // Debounced save to database
    for (const item of newItems) {
      const dbItem = {
        id: item.id,
        shooting_day_id: dayId,
        sequence: item.sequence,
        scene_number: item.scene_number,
        cut_number: item.cut_number,
        scene_time: item.scene_time,
        scene_location_type: item.scene_location_type,
        start_time: item.start_time,
        end_time: item.end_time,
        location_override: item.location,
        content: item.content,
        cast_ids: item.cast_ids,
        notes: item.notes,
      }

      await supabase
        .from('shot_plan_items')
        .upsert(dbItem)
    }
  }, [dayId, supabase])

  // Add new item
  const addItem = useCallback(async () => {
    const newItem: ShotPlanItem = {
      id: crypto.randomUUID(),
      sequence: items.length + 1,
      scene_number: null,
      cut_number: null,
      scene_time: null,
      scene_location_type: null,
      start_time: null,
      end_time: null,
      location: null,
      content: '',
      cast_ids: [],
      notes: null,
    }

    const dbItem = {
      id: newItem.id,
      shooting_day_id: dayId,
      sequence: newItem.sequence,
      content: '',
    }

    const { error } = await supabase
      .from('shot_plan_items')
      .insert(dbItem)

    if (error) {
      setError(error.message)
      return
    }

    setItems(prev => [...prev, newItem])
  }, [dayId, items.length, supabase])

  // Delete item (soft delete)
  const deleteItem = useCallback(async (itemId: string) => {
    const { error } = await supabase
      .from('shot_plan_items')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', itemId)

    if (error) {
      setError(error.message)
      return
    }

    setItems(prev => {
      const filtered = prev.filter(item => item.id !== itemId)
      // Re-sequence
      return filtered.map((item, index) => ({
        ...item,
        sequence: index + 1,
      }))
    })
  }, [supabase])

  // Publish shooting day
  const publish = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('shooting_days')
      .update({
        status: 'published',
        version: (shootingDay?.version || 0) + 1,
        published_at: new Date().toISOString(),
        published_by: user?.id,
      })
      .eq('id', dayId)

    if (error) {
      setError(error.message)
      return false
    }

    setShootingDay(prev => prev ? {
      ...prev,
      status: 'published',
      version: (prev.version || 0) + 1,
    } : null)

    return true
  }, [dayId, shootingDay?.version, supabase])

  return {
    shootingDay,
    items,
    isLoading,
    error,
    updateShootingDay,
    updateItems,
    addItem,
    deleteItem,
    publish,
    refetch: fetchData,
  }
}
