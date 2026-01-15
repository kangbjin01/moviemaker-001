'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Plus, FileText, Clock, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface ShootingDay {
  id: string
  day_number: number | null
  shoot_date: string | null
  status: string
}

interface Stats {
  shootingDays: number
  totalCuts: number
  upcomingDays: number
}

export default function ProjectPage() {
  const params = useParams()
  const org = params.org as string
  const project = params.project as string

  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    shootingDays: 0,
    totalCuts: 0,
    upcomingDays: 0,
  })
  const [recentDays, setRecentDays] = useState<ShootingDay[]>([])
  const [projectName, setProjectName] = useState(project)

  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)

      // Get project info
      const { data: projectData } = await supabase
        .from('projects')
        .select('id, name')
        .eq('slug', project)
        .single<{ id: string; name: string }>()

      if (!projectData) {
        setIsLoading(false)
        return
      }

      setProjectName(projectData.name)
      const projectId = projectData.id

      // Get shooting days count
      const { count: shootingDaysCount } = await supabase
        .from('shooting_days')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .is('deleted_at', null)

      // Get total cuts count
      const { data: shootingDays } = await supabase
        .from('shooting_days')
        .select('id')
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .returns<Array<{ id: string }>>()

      let totalCuts = 0
      if (shootingDays && shootingDays.length > 0) {
        const dayIds = shootingDays.map(d => d.id)
        const { count: cutsCount } = await supabase
          .from('shot_plan_items')
          .select('*', { count: 'exact', head: true })
          .in('shooting_day_id', dayIds)
        totalCuts = cutsCount || 0
      }

      // Get upcoming days (shoot_date >= today)
      const today = new Date().toISOString().split('T')[0]
      const { count: upcomingCount } = await supabase
        .from('shooting_days')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .gte('shoot_date', today)

      // Get recent shooting days
      const { data: recentShootingDays } = await supabase
        .from('shooting_days')
        .select('id, day_number, shoot_date, status')
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(5)

      setStats({
        shootingDays: shootingDaysCount || 0,
        totalCuts,
        upcomingDays: upcomingCount || 0,
      })
      setRecentDays(recentShootingDays || [])
      setIsLoading(false)
    }

    fetchData()
  }, [project, supabase])

  if (isLoading) {
    return (
      <AppShell org={org} project={project} title={project}>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell org={org} project={project} title={projectName}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{projectName}</h1>
            <p className="text-sm text-muted-foreground">프로젝트 개요</p>
          </div>
          <Button asChild>
            <Link href={`/${org}/${project}/shooting-days`}>
              <Plus className="mr-2 h-4 w-4" />
              새 촬영일 추가
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">촬영일</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.shootingDays}</div>
              <p className="text-xs text-muted-foreground">전체 일정</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">컷</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCuts}</div>
              <p className="text-xs text-muted-foreground">등록됨</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">예정</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcomingDays}</div>
              <p className="text-xs text-muted-foreground">다가오는 촬영</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>최근 촬영일</CardTitle>
            <CardDescription>최근 추가된 촬영 일정</CardDescription>
          </CardHeader>
          <CardContent>
            {recentDays.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <p>아직 촬영일이 없습니다</p>
                <Button asChild variant="outline" className="mt-4">
                  <Link href={`/${org}/${project}/shooting-days`}>
                    <Plus className="mr-2 h-4 w-4" />
                    촬영일 추가하기
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentDays.map((day) => (
                  <Link
                    key={day.id}
                    href={`/${org}/${project}/shooting-days/${day.id}`}
                    className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-secondary"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-sm font-semibold">
                        #{day.day_number || '-'}
                      </div>
                      <div>
                        <p className="font-medium">{day.day_number ? `${day.day_number}회차` : '회차 미정'}</p>
                        <p className="text-sm text-muted-foreground">
                          {day.shoot_date || '날짜 미정'}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {day.status === 'published' ? '저장됨' : '작성중'}
                    </div>
                  </Link>
                ))}
                {recentDays.length > 0 && (
                  <Link
                    href={`/${org}/${project}/shooting-days`}
                    className="block text-center text-sm text-muted-foreground hover:underline"
                  >
                    전체 보기 →
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
