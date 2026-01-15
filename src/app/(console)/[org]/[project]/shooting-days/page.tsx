// @ts-nocheck
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { AppShell } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Calendar, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface ShootingDay {
  id: string
  day_number: number | null
  shoot_date: string
  status: string
  shot_count?: number
}

export default function ShootingDaysPage() {
  const params = useParams()
  const org = params.org as string
  const project = params.project as string

  const [shootingDays, setShootingDays] = useState<ShootingDay[]>([])
  const [projectId, setProjectId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  // Memoize supabase client to prevent infinite loops
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function fetchData() {
      // First get project ID
      const { data: projectData } = await supabase
        .from('projects')
        .select('id')
        .eq('slug', project)
        .single<{ id: string }>()

      if (!projectData?.id) {
        setIsLoading(false)
        return
      }

      setProjectId(projectData.id)

      // Then get shooting days
      const { data: days } = await supabase
        .from('shooting_days')
        .select(`
          id,
          day_number,
          shoot_date,
          status
        `)
        .eq('project_id', projectData.id)
        .is('deleted_at', null)
        .order('day_number', { ascending: true })
        .returns<Array<{ id: string; day_number: number; shoot_date: string; status: string }>>()

      // Get shot counts for each day
      const daysWithCounts = await Promise.all(
        (days || []).map(async (day) => {
          const { count } = await supabase
            .from('shot_plan_items')
            .select('*', { count: 'exact', head: true })
            .eq('shooting_day_id', day.id)
            .is('deleted_at', null)

          return { ...day, shot_count: count || 0 }
        })
      )

      setShootingDays(daysWithCounts)
      setIsLoading(false)
    }

    fetchData()
  }, [org, project, supabase])

  const handleCreateDay = async () => {
    if (!projectId) return

    setIsCreating(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Get max day number from database to avoid duplicates
      const { data: maxDayData } = await supabase
        .from('shooting_days')
        .select('day_number')
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('day_number', { ascending: false })
        .limit(1)
        .single()

      const nextDayNumber = (maxDayData?.day_number || 0) + 1
      const today = new Date().toISOString().split('T')[0]

      const { data: newDay, error } = await supabase
        .from('shooting_days')
        .insert([{
          project_id: projectId,
          day_number: nextDayNumber,
          shoot_date: today,
          status: 'draft',
          created_by: user?.id,
        }] as any)
        .select()
        .single()

      if (error) {
        console.error('Failed to create shooting day:', error)
        alert('회차 생성에 실패했습니다: ' + error.message)
        setIsCreating(false)
        return
      }

      if (newDay?.id) {
        // Navigate to new day
        window.location.href = `/${org}/${project}/shooting-days/${newDay.id}`
      }
    } catch (err) {
      console.error('Error creating shooting day:', err)
      alert('회차 생성 중 오류가 발생했습니다')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <AppShell org={org} project={project} title="일일촬영계획표">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">일일촬영계획표</h1>
            <p className="text-sm text-muted-foreground">
              촬영 회차별 계획표를 관리합니다
            </p>
          </div>
          <Button onClick={handleCreateDay} disabled={isCreating}>
            {isCreating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            새 회차 추가
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : shootingDays.length > 0 ? (
          <div className="space-y-3">
            {shootingDays.map((day) => (
              <Link
                key={day.id}
                href={`/${org}/${project}/shooting-days/${day.id}`}
                className="flex items-center justify-between rounded-lg border border-border bg-background p-4 transition-colors hover:bg-secondary"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{day.day_number || '-'}회차</span>
                      <Badge variant={day.status === 'published' ? 'default' : 'secondary'}>
                        {day.status === 'published' ? '저장됨' : '작성중'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {day.shoot_date}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{day.shot_count}컷</p>
                  <p className="text-sm text-muted-foreground">계획됨</p>
                </div>
              </Link>
            ))}
            {/* 새 회차 추가 카드 */}
            <button
              onClick={handleCreateDay}
              disabled={isCreating}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background p-4 transition-colors hover:bg-secondary disabled:opacity-50"
            >
              {isCreating ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <Plus className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="text-muted-foreground">새 회차 추가</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
            <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 font-semibold">아직 촬영 계획이 없습니다</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              첫 번째 촬영 계획표를 만들어보세요
            </p>
            <Button onClick={handleCreateDay} disabled={isCreating}>
              {isCreating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              첫 회차 만들기
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  )
}
