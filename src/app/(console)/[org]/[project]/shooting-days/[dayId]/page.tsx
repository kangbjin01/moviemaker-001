'use client'

import { useMemo, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { AppShell } from '@/components/layout'
import { ShotPlanTable, type ShotPlanItem } from '@/components/shooting-day'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  FileSpreadsheet,
  FileText,
  Send,
  Clock,
  MapPin,
  Sun,
  Sunset,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { useShootingDay } from '@/lib/hooks/use-shooting-day'
import { debounce } from '@/lib/utils/debounce'

export default function ShootingDayPage() {
  const params = useParams()
  const org = params.org as string
  const project = params.project as string
  const dayId = params.dayId as string

  const {
    shootingDay,
    items,
    isLoading,
    error,
    updateShootingDay,
    updateItems,
    addItem,
    deleteItem,
    publish,
  } = useShootingDay(dayId)

  // Debounced update for header fields
  const debouncedUpdateHeader = useMemo(
    () => debounce((field: string, value: string) => {
      updateShootingDay({ [field]: value || null })
    }, 500),
    [updateShootingDay]
  )

  // Debounced update for items
  const debouncedUpdateItems = useMemo(
    () => debounce((newItems: ShotPlanItem[]) => {
      updateItems(newItems)
    }, 500),
    [updateItems]
  )

  const handleItemsChange = useCallback((newItems: ShotPlanItem[]) => {
    debouncedUpdateItems(newItems)
  }, [debouncedUpdateItems])

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    console.log('Exporting PDF...')
  }

  const handleExportExcel = () => {
    // TODO: Implement Excel export
    console.log('Exporting Excel...')
  }

  const handlePublish = async () => {
    await publish()
  }

  if (isLoading) {
    return (
      <AppShell org={org} project={project} title="Loading...">
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    )
  }

  if (error || !shootingDay) {
    return (
      <AppShell org={org} project={project} title="Error">
        <div className="flex h-full flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">{error || 'Shooting day not found'}</p>
          <Button asChild variant="outline">
            <Link href={`/${org}/${project}/shooting-days`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to list
            </Link>
          </Button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell org={org} project={project} title={`Day ${shootingDay.day_number || ''}`}>
      <div className="flex h-full flex-col">
        {/* Page Header */}
        <div className="border-b border-border bg-background px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/${org}/${project}/shooting-days`}
                className="rounded-lg p-2 hover:bg-secondary"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold">
                    Day {shootingDay.day_number || '-'}
                  </h1>
                  <Badge variant={shootingDay.status === 'published' ? 'default' : 'secondary'}>
                    {shootingDay.status}
                    {shootingDay.status === 'published' && ` v${shootingDay.version}`}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {shootingDay.shoot_date}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <FileText className="mr-2 h-4 w-4" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportExcel}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel
              </Button>
              <Button size="sm" onClick={handlePublish}>
                <Send className="mr-2 h-4 w-4" />
                Publish
              </Button>
            </div>
          </div>
        </div>

        {/* Day Header Info */}
        <div className="border-b border-border bg-muted/30 px-6 py-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Shoot Date
              </label>
              <Input
                type="date"
                defaultValue={shootingDay.shoot_date}
                onChange={(e) => debouncedUpdateHeader('shoot_date', e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Clock className="h-3 w-3" />
                Call Time
              </label>
              <Input
                type="time"
                defaultValue={shootingDay.call_time || ''}
                onChange={(e) => debouncedUpdateHeader('call_time', e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Shooting Start
              </label>
              <Input
                type="time"
                defaultValue={shootingDay.shooting_time_start || ''}
                onChange={(e) => debouncedUpdateHeader('shooting_time_start', e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Shooting End
              </label>
              <Input
                type="time"
                defaultValue={shootingDay.shooting_time_end || ''}
                onChange={(e) => debouncedUpdateHeader('shooting_time_end', e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <MapPin className="h-3 w-3" />
                Base Location
              </label>
              <Input
                type="text"
                placeholder="Location"
                defaultValue=""
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Weather
              </label>
              <Input
                type="text"
                defaultValue={shootingDay.weather || ''}
                onChange={(e) => debouncedUpdateHeader('weather', e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          {/* Sunrise/Sunset Info */}
          <div className="mt-4 flex items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Sun className="h-4 w-4 text-amber-500" />
              Sunrise: {shootingDay.sunrise || '--:--'}
            </span>
            <span className="flex items-center gap-1">
              <Sunset className="h-4 w-4 text-orange-500" />
              Sunset: {shootingDay.sunset || '--:--'}
            </span>
          </div>
        </div>

        {/* Shot Plan Table */}
        <div className="flex-1 overflow-y-auto p-6">
          <ShotPlanTable
            items={items}
            onChange={handleItemsChange}
            onAddRow={addItem}
            onDeleteRow={deleteItem}
          />
        </div>
      </div>
    </AppShell>
  )
}
