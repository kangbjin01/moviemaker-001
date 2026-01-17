'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Character, CreateCharacterInput, UpdateCharacterInput } from '../types'

export function useCharacters(projectId: string | null) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // 캐릭터 목록 조회
  const fetchCharacters = useCallback(async () => {
    if (!projectId) {
      setCharacters([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('characters')
        .select('*')
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('sequence', { ascending: true })
        .order('name', { ascending: true })

      if (fetchError) throw fetchError

      setCharacters((data as Character[]) || [])
    } catch (err) {
      console.error('Failed to fetch characters:', err)
      setError('캐릭터 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [projectId, supabase])

  useEffect(() => {
    fetchCharacters()
  }, [fetchCharacters])

  // 캐릭터 추가
  const addCharacter = useCallback(async (input: CreateCharacterInput): Promise<Character | null> => {
    try {
      // 현재 최대 sequence 조회
      const { data: maxSeq } = await supabase
        .from('characters')
        .select('sequence')
        .eq('project_id', input.project_id)
        .is('deleted_at', null)
        .order('sequence', { ascending: false })
        .limit(1)
        .single()

      const newSequence = ((maxSeq as { sequence: number } | null)?.sequence || 0) + 1

      const { data, error: insertError } = await supabase
        .from('characters')
        .insert({
          ...input,
          sequence: newSequence,
          character_type: input.character_type || 'main',
        } as never)
        .select('*')
        .single()

      if (insertError) throw insertError

      const newCharacter = data as Character
      setCharacters(prev => [...prev, newCharacter])
      return newCharacter
    } catch (err) {
      console.error('Failed to add character:', err)
      setError('캐릭터 추가에 실패했습니다.')
      return null
    }
  }, [supabase])

  // 캐릭터 수정
  const updateCharacter = useCallback(async (id: string, input: UpdateCharacterInput): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('characters')
        .update(input as never)
        .eq('id', id)

      if (updateError) throw updateError

      // 로컬 상태 업데이트
      setCharacters(prev => prev.map(char =>
        char.id === id ? { ...char, ...input } : char
      ))

      return true
    } catch (err) {
      console.error('Failed to update character:', err)
      setError('캐릭터 수정에 실패했습니다.')
      return false
    }
  }, [supabase])

  // 캐릭터 삭제 (soft delete)
  const deleteCharacter = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('characters')
        .update({ deleted_at: new Date().toISOString() } as never)
        .eq('id', id)

      if (deleteError) throw deleteError

      setCharacters(prev => prev.filter(char => char.id !== id))
      return true
    } catch (err) {
      console.error('Failed to delete character:', err)
      setError('캐릭터 삭제에 실패했습니다.')
      return false
    }
  }, [supabase])

  return {
    characters,
    isLoading,
    error,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    refetch: fetchCharacters,
  }
}
