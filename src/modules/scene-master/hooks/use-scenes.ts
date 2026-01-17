'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Scene, CreateSceneInput, UpdateSceneInput } from '../types'

export function useScenes(projectId: string | null) {
  const [scenes, setScenes] = useState<Scene[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // 씬 목록 조회
  const fetchScenes = useCallback(async () => {
    if (!projectId) {
      setScenes([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('scenes')
        .select(`
          *,
          location:locations(id, name)
        `)
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('sequence', { ascending: true })
        .order('scene_number', { ascending: true })

      if (fetchError) throw fetchError

      setScenes(data || [])
    } catch (err) {
      console.error('Failed to fetch scenes:', err)
      setError('씬 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [projectId, supabase])

  useEffect(() => {
    fetchScenes()
  }, [fetchScenes])

  // 씬 추가
  const addScene = useCallback(async (input: CreateSceneInput): Promise<Scene | null> => {
    try {
      // 현재 최대 sequence 조회
      const { data: maxSeq } = await supabase
        .from('scenes')
        .select('sequence')
        .eq('project_id', input.project_id)
        .is('deleted_at', null)
        .order('sequence', { ascending: false })
        .limit(1)
        .single<{ sequence: number }>()

      const newSequence = ((maxSeq as { sequence: number } | null)?.sequence || 0) + 1

      const { data, error: insertError } = await supabase
        .from('scenes')
        .insert({
          ...input,
          sequence: newSequence,
        } as never)
        .select(`
          *,
          location:locations(id, name)
        `)
        .single()

      if (insertError) throw insertError

      setScenes(prev => [...prev, data as Scene])
      return data as Scene
    } catch (err) {
      console.error('Failed to add scene:', err)
      setError('씬 추가에 실패했습니다.')
      return null
    }
  }, [supabase])

  // 씬 수정
  const updateScene = useCallback(async (id: string, input: UpdateSceneInput): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('scenes')
        .update(input as never)
        .eq('id', id)

      if (updateError) throw updateError

      // 로컬 상태 업데이트
      setScenes(prev => prev.map(scene =>
        scene.id === id ? { ...scene, ...input } : scene
      ))

      return true
    } catch (err) {
      console.error('Failed to update scene:', err)
      setError('씬 수정에 실패했습니다.')
      return false
    }
  }, [supabase])

  // 씬 삭제 (soft delete)
  const deleteScene = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('scenes')
        .update({ deleted_at: new Date().toISOString() } as never)
        .eq('id', id)

      if (deleteError) throw deleteError

      setScenes(prev => prev.filter(scene => scene.id !== id))
      return true
    } catch (err) {
      console.error('Failed to delete scene:', err)
      setError('씬 삭제에 실패했습니다.')
      return false
    }
  }, [supabase])

  // 씬 순서 변경
  const reorderScenes = useCallback(async (reorderedScenes: Scene[]): Promise<boolean> => {
    try {
      // 로컬 상태 먼저 업데이트 (낙관적 업데이트)
      setScenes(reorderedScenes)

      // DB 업데이트
      const updates = reorderedScenes.map((scene, index) => ({
        id: scene.id,
        sequence: index + 1,
      }))

      for (const update of updates) {
        await supabase
          .from('scenes')
          .update({ sequence: update.sequence } as never)
          .eq('id', update.id)
      }

      return true
    } catch (err) {
      console.error('Failed to reorder scenes:', err)
      setError('씬 순서 변경에 실패했습니다.')
      // 실패 시 다시 불러오기
      fetchScenes()
      return false
    }
  }, [supabase, fetchScenes])

  return {
    scenes,
    isLoading,
    error,
    addScene,
    updateScene,
    deleteScene,
    reorderScenes,
    refetch: fetchScenes,
  }
}
