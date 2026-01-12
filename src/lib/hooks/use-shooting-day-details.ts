// @ts-nocheck
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  ScheduleItem,
  StaffItem,
  EquipmentItem,
  CastItem,
} from '@/components/shooting-day'

export function useShootingDayDetails(shootingDayId: string) {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([])
  const [staffItems, setStaffItems] = useState<StaffItem[]>([])
  const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>([])
  const [castItems, setCastItems] = useState<CastItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Fetch all data
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch schedules
      const { data: schedules, error: scheduleError } = await supabase
        .from('shooting_day_schedules')
        .select('*')
        .eq('shooting_day_id', shootingDayId)
        .is('deleted_at', null)
        .order('sequence', { ascending: true })

      if (scheduleError) throw scheduleError

      setScheduleItems(
        (schedules || []).map((s) => ({
          id: s.id,
          sequence: s.sequence,
          time: s.time || '',
          title: s.title || '',
          description: s.description || '',
        }))
      )

      // Fetch staff
      const { data: staff, error: staffError } = await supabase
        .from('shooting_day_staff')
        .select('*')
        .eq('shooting_day_id', shootingDayId)
        .is('deleted_at', null)
        .order('sequence', { ascending: true })

      if (staffError) throw staffError

      setStaffItems(
        (staff || []).map((s) => ({
          id: s.id,
          role: s.role || '',
          name: s.name || '',
          phone: s.phone || '',
          sequence: s.sequence || 0,
        }))
      )

      // Fetch equipment
      const { data: equipment, error: equipmentError } = await supabase
        .from('shooting_day_equipment')
        .select('*')
        .eq('shooting_day_id', shootingDayId)
        .is('deleted_at', null)

      if (equipmentError) throw equipmentError

      setEquipmentItems(
        (equipment || []).map((e) => ({
          id: e.id,
          department: e.department || '',
          content: e.content || '',
        }))
      )

      // Fetch cast
      const { data: cast, error: castError } = await supabase
        .from('shooting_day_cast')
        .select('*')
        .eq('shooting_day_id', shootingDayId)
        .is('deleted_at', null)
        .order('sequence', { ascending: true })

      if (castError) throw castError

      setCastItems(
        (cast || []).map((c) => ({
          id: c.id,
          character_name: c.character_name || '',
          actor_name: c.actor_name || '',
          call_time: c.call_time || '',
          call_location: c.call_location || '',
          scenes: c.scenes || '',
          costume_props: c.costume_props || '',
          phone: c.phone || '',
          sequence: c.sequence || 0,
        }))
      )
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [shootingDayId, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ==================== SCHEDULE ====================
  const updateScheduleItems = useCallback(
    async (items: ScheduleItem[]) => {
      setScheduleItems(items)

      for (const item of items) {
        await supabase.from('shooting_day_schedules').upsert({
          id: item.id,
          shooting_day_id: shootingDayId,
          sequence: item.sequence,
          time: item.time,
          title: item.title,
          description: item.description,
        })
      }
    },
    [shootingDayId, supabase]
  )

  const addScheduleItem = useCallback(async () => {
    const newItem: ScheduleItem = {
      id: crypto.randomUUID(),
      sequence: scheduleItems.length + 1,
      time: '',
      title: '',
      description: '',
    }

    const { error } = await supabase.from('shooting_day_schedules').insert({
      id: newItem.id,
      shooting_day_id: shootingDayId,
      sequence: newItem.sequence,
      title: '',
    })

    if (error) {
      setError(error.message)
      return
    }

    setScheduleItems((prev) => [...prev, newItem])
  }, [shootingDayId, scheduleItems.length, supabase])

  const deleteScheduleItem = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from('shooting_day_schedules')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        setError(error.message)
        return
      }

      setScheduleItems((prev) => {
        const filtered = prev.filter((item) => item.id !== id)
        return filtered.map((item, index) => ({
          ...item,
          sequence: index + 1,
        }))
      })
    },
    [supabase]
  )

  // ==================== STAFF ====================
  const updateStaffItems = useCallback(
    async (items: StaffItem[]) => {
      setStaffItems(items)

      for (const item of items) {
        await supabase.from('shooting_day_staff').upsert({
          id: item.id,
          shooting_day_id: shootingDayId,
          role: item.role,
          name: item.name,
          phone: item.phone,
          sequence: item.sequence,
        })
      }
    },
    [shootingDayId, supabase]
  )

  const addStaffItem = useCallback(async () => {
    const newItem: StaffItem = {
      id: crypto.randomUUID(),
      role: '',
      name: '',
      phone: '',
      sequence: staffItems.length + 1,
    }

    const { error } = await supabase.from('shooting_day_staff').insert({
      id: newItem.id,
      shooting_day_id: shootingDayId,
      role: '',
      name: '',
      sequence: newItem.sequence,
    })

    if (error) {
      setError(error.message)
      return
    }

    setStaffItems((prev) => [...prev, newItem])
  }, [shootingDayId, staffItems.length, supabase])

  const deleteStaffItem = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from('shooting_day_staff')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        setError(error.message)
        return
      }

      setStaffItems((prev) => {
        const filtered = prev.filter((item) => item.id !== id)
        return filtered.map((item, index) => ({
          ...item,
          sequence: index + 1,
        }))
      })
    },
    [supabase]
  )

  // ==================== EQUIPMENT ====================
  const updateEquipmentItems = useCallback(
    async (items: EquipmentItem[]) => {
      setEquipmentItems(items)

      for (const item of items) {
        await supabase.from('shooting_day_equipment').upsert({
          id: item.id,
          shooting_day_id: shootingDayId,
          department: item.department,
          content: item.content,
        })
      }
    },
    [shootingDayId, supabase]
  )

  // ==================== CAST ====================
  const updateCastItems = useCallback(
    async (items: CastItem[]) => {
      setCastItems(items)

      for (const item of items) {
        await supabase.from('shooting_day_cast').upsert({
          id: item.id,
          shooting_day_id: shootingDayId,
          character_name: item.character_name,
          actor_name: item.actor_name,
          call_time: item.call_time,
          call_location: item.call_location,
          scenes: item.scenes,
          costume_props: item.costume_props,
          phone: item.phone,
          sequence: item.sequence,
        })
      }
    },
    [shootingDayId, supabase]
  )

  const addCastItem = useCallback(async () => {
    const newItem: CastItem = {
      id: crypto.randomUUID(),
      character_name: '',
      actor_name: '',
      call_time: '',
      call_location: '',
      scenes: '',
      costume_props: '',
      phone: '',
      sequence: castItems.length + 1,
    }

    const { error } = await supabase.from('shooting_day_cast').insert({
      id: newItem.id,
      shooting_day_id: shootingDayId,
      character_name: '',
      actor_name: '',
      sequence: newItem.sequence,
    })

    if (error) {
      setError(error.message)
      return
    }

    setCastItems((prev) => [...prev, newItem])
  }, [shootingDayId, castItems.length, supabase])

  const deleteCastItem = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from('shooting_day_cast')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        setError(error.message)
        return
      }

      setCastItems((prev) => {
        const filtered = prev.filter((item) => item.id !== id)
        return filtered.map((item, index) => ({
          ...item,
          sequence: index + 1,
        }))
      })
    },
    [supabase]
  )

  return {
    // Data
    scheduleItems,
    staffItems,
    equipmentItems,
    castItems,
    isLoading,
    error,

    // Schedule
    updateScheduleItems,
    addScheduleItem,
    deleteScheduleItem,

    // Staff
    updateStaffItems,
    addStaffItem,
    deleteStaffItem,

    // Equipment
    updateEquipmentItems,

    // Cast
    updateCastItems,
    addCastItem,
    deleteCastItem,

    // Refetch
    refetch: fetchData,
  }
}
