'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Sponsorship, CreateSponsorshipInput, UpdateSponsorshipInput } from '../types'

export function useSponsorships(projectId: string | null) {
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchSponsorships = useCallback(async () => {
    if (!projectId) {
      setSponsorships([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('sponsorships')
        .select('*')
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('sequence', { ascending: true })

      if (fetchError) throw fetchError

      setSponsorships((data as Sponsorship[]) || [])
    } catch (err) {
      console.error('Failed to fetch sponsorships:', err)
      setError('협찬 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [projectId, supabase])

  useEffect(() => {
    fetchSponsorships()
  }, [fetchSponsorships])

  const addSponsorship = useCallback(async (input: CreateSponsorshipInput): Promise<Sponsorship | null> => {
    try {
      const { data: maxSeq } = await supabase
        .from('sponsorships')
        .select('sequence')
        .eq('project_id', input.project_id)
        .is('deleted_at', null)
        .order('sequence', { ascending: false })
        .limit(1)
        .single()

      const newSequence = ((maxSeq as { sequence: number } | null)?.sequence || 0) + 1

      const { data, error: insertError } = await supabase
        .from('sponsorships')
        .insert({
          ...input,
          sequence: newSequence,
          status: 'contacted',
        } as never)
        .select('*')
        .single()

      if (insertError) throw insertError

      const newSponsorship = data as Sponsorship
      setSponsorships(prev => [...prev, newSponsorship])
      return newSponsorship
    } catch (err) {
      console.error('Failed to add sponsorship:', err)
      setError('협찬 추가에 실패했습니다.')
      return null
    }
  }, [supabase])

  const updateSponsorship = useCallback(async (id: string, input: UpdateSponsorshipInput): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('sponsorships')
        .update(input as never)
        .eq('id', id)

      if (updateError) throw updateError

      setSponsorships(prev => prev.map(s =>
        s.id === id ? { ...s, ...input } : s
      ))

      return true
    } catch (err) {
      console.error('Failed to update sponsorship:', err)
      setError('협찬 수정에 실패했습니다.')
      return false
    }
  }, [supabase])

  const deleteSponsorship = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('sponsorships')
        .update({ deleted_at: new Date().toISOString() } as never)
        .eq('id', id)

      if (deleteError) throw deleteError

      setSponsorships(prev => prev.filter(s => s.id !== id))
      return true
    } catch (err) {
      console.error('Failed to delete sponsorship:', err)
      setError('협찬 삭제에 실패했습니다.')
      return false
    }
  }, [supabase])

  return {
    sponsorships,
    isLoading,
    error,
    addSponsorship,
    updateSponsorship,
    deleteSponsorship,
    refetch: fetchSponsorships,
  }
}
