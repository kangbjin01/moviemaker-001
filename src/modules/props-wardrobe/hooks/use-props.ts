'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Prop, CreatePropInput, UpdatePropInput } from '../types'

export function useProps(projectId: string | null) {
  const [props, setProps] = useState<Prop[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchProps = useCallback(async () => {
    if (!projectId) {
      setProps([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('props')
        .select('*')
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('sequence', { ascending: true })

      if (fetchError) throw fetchError

      setProps((data as Prop[]) || [])
    } catch (err) {
      console.error('Failed to fetch props:', err)
      setError('소품 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [projectId, supabase])

  useEffect(() => {
    fetchProps()
  }, [fetchProps])

  const addProp = useCallback(async (input: CreatePropInput): Promise<Prop | null> => {
    try {
      const { data: maxSeq } = await supabase
        .from('props')
        .select('sequence')
        .eq('project_id', input.project_id)
        .is('deleted_at', null)
        .order('sequence', { ascending: false })
        .limit(1)
        .single()

      const newSequence = ((maxSeq as { sequence: number } | null)?.sequence || 0) + 1

      const { data, error: insertError } = await supabase
        .from('props')
        .insert({
          ...input,
          sequence: newSequence,
          quantity: input.quantity || 1,
          source: input.source || 'purchase',
          status: 'needed',
        } as never)
        .select('*')
        .single()

      if (insertError) throw insertError

      const newProp = data as Prop
      setProps(prev => [...prev, newProp])
      return newProp
    } catch (err) {
      console.error('Failed to add prop:', err)
      setError('소품 추가에 실패했습니다.')
      return null
    }
  }, [supabase])

  const updateProp = useCallback(async (id: string, input: UpdatePropInput): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('props')
        .update(input as never)
        .eq('id', id)

      if (updateError) throw updateError

      setProps(prev => prev.map(p =>
        p.id === id ? { ...p, ...input } : p
      ))

      return true
    } catch (err) {
      console.error('Failed to update prop:', err)
      setError('소품 수정에 실패했습니다.')
      return false
    }
  }, [supabase])

  const deleteProp = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('props')
        .update({ deleted_at: new Date().toISOString() } as never)
        .eq('id', id)

      if (deleteError) throw deleteError

      setProps(prev => prev.filter(p => p.id !== id))
      return true
    } catch (err) {
      console.error('Failed to delete prop:', err)
      setError('소품 삭제에 실패했습니다.')
      return false
    }
  }, [supabase])

  return {
    props,
    isLoading,
    error,
    addProp,
    updateProp,
    deleteProp,
    refetch: fetchProps,
  }
}
