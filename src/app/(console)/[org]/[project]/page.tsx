'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Plus, FileText, Clock } from 'lucide-react'
import Link from 'next/link'

export default function ProjectPage() {
  const params = useParams()
  const org = params.org as string
  const project = params.project as string

  // TODO: Fetch actual project data
  const stats = {
    shootingDays: 12,
    scenes: 45,
    upcomingDays: 3,
  }

  return (
    <AppShell org={org} project={project} title={project}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{project}</h1>
            <p className="text-sm text-muted-foreground">Project Overview</p>
          </div>
          <Button asChild>
            <Link href={`/${org}/${project}/shooting-days`}>
              <Plus className="mr-2 h-4 w-4" />
              New Shooting Day
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Shooting Days</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.shootingDays}</div>
              <p className="text-xs text-muted-foreground">Total scheduled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Scenes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.scenes}</div>
              <p className="text-xs text-muted-foreground">In registry</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcomingDays}</div>
              <p className="text-xs text-muted-foreground">Days this week</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Shooting Days</CardTitle>
            <CardDescription>Your latest shooting day schedules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Placeholder items */}
              {[1, 2, 3].map((day) => (
                <Link
                  key={day}
                  href={`/${org}/${project}/shooting-days`}
                  className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-secondary"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-sm font-semibold">
                      #{day}
                    </div>
                    <div>
                      <p className="font-medium">Day {day}</p>
                      <p className="text-sm text-muted-foreground">
                        Click to view shooting days
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Draft
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
