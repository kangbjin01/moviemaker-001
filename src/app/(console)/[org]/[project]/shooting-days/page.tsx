'use client'

import { useState, useEffect } from 'react'
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

  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      // First get project ID
      const { data: projectData } = await supabase
        .from('projects')
        .select('id')
        .eq('slug', project)
        .single()

      if (!projectData) {
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
        .order('shoot_date', { ascending: true })

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

    const { data: { user } } = await supabase.auth.getUser()

    // Get next day number
    const nextDayNumber = shootingDays.length + 1

    // Create new shooting day with today's date
    const today = new Date().toISOString().split('T')[0]

    const { data: newDay, error } = await supabase
      .from('shooting_days')
      .insert({
        project_id: projectId,
        day_number: nextDayNumber,
        shoot_date: today,
        status: 'draft',
        created_by: user?.id,
      })
      .select()
      .single()

    setIsCreating(false)

    if (newDay) {
      // Navigate to new day
      window.location.href = `/${org}/${project}/shooting-days/${newDay.id}`
    }
  }

  return (
    <AppShell org={org} project={project} title="Shooting Days">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Shooting Days</h1>
            <p className="text-sm text-muted-foreground">
              Manage your daily shooting schedules
            </p>
          </div>
          <Button onClick={handleCreateDay} disabled={isCreating}>
            {isCreating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            New Day
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
                      <span className="font-semibold">Day {day.day_number || '-'}</span>
                      <Badge variant={day.status === 'published' ? 'default' : 'secondary'}>
                        {day.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {day.shoot_date}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{day.shot_count} shots</p>
                  <p className="text-sm text-muted-foreground">planned</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
            <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 font-semibold">No shooting days yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Create your first shooting day schedule
            </p>
            <Button onClick={handleCreateDay} disabled={isCreating}>
              {isCreating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create Shooting Day
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  )
}
