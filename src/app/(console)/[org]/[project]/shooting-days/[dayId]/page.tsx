'use client'

import { useMemo, useCallback, useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { AppShell } from '@/components/layout'
import { ShotPlanTable, type ShotPlanItem } from '@/components/shooting-day'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { AddressInput } from '@/components/ui/address-input'
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
  CloudSun,
} from 'lucide-react'
import Link from 'next/link'
import { useShootingDay } from '@/lib/hooks/use-shooting-day'
import { debounce } from '@/lib/utils/debounce'
import { fetchWeatherInfo } from '@/lib/utils/weather'

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

  // 날씨 조회 상태
  const [isLoadingWeather, setIsLoadingWeather] = useState(false)
  const [localDate, setLocalDate] = useState('')
  const [localLocation, setLocalLocation] = useState('')

  // shootingDay 데이터 로드 시 초기값 설정
  useEffect(() => {
    if (shootingDay) {
      setLocalDate(shootingDay.shoot_date || '')
      setLocalLocation(shootingDay.base_location || '')
    }
  }, [shootingDay])

  // 날씨 자동 조회
  const handleFetchWeather = useCallback(async (date?: string, location?: string) => {
    const targetDate = date || localDate
    const targetLocation = location || localLocation

    if (!targetDate || !targetLocation) {
      alert('촬영일시와 촬영장소를 모두 입력해주세요.')
      return
    }

    setIsLoadingWeather(true)
    try {
      const weatherInfo = await fetchWeatherInfo(targetDate, targetLocation)
      if (weatherInfo) {
        updateShootingDay({
          weather: weatherInfo.weather,
          precipitation: weatherInfo.precipitation,
          temp_low: weatherInfo.tempLow,
          temp_high: weatherInfo.tempHigh,
          sunrise: weatherInfo.sunrise,
          sunset: weatherInfo.sunset,
        })
      } else {
        alert('날씨 정보를 가져올 수 없습니다. 주소를 확인해주세요.')
      }
    } catch (err) {
      console.error('Weather fetch error:', err)
      alert('날씨 정보 조회 중 오류가 발생했습니다.')
    } finally {
      setIsLoadingWeather(false)
    }
  }, [localDate, localLocation, updateShootingDay])

  // 주소 선택 시 처리
  const handleAddressSelect = useCallback((address: string) => {
    setLocalLocation(address)
    updateShootingDay({ base_location: address })

    // 날짜가 있으면 자동으로 날씨 조회
    if (localDate && address) {
      handleFetchWeather(localDate, address)
    }
  }, [localDate, handleFetchWeather, updateShootingDay])

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

        {/* Day Header Info - 기본 정보 */}
        <div className="border-b border-border bg-muted/30 px-6 py-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {/* Row 1 */}
                <tr className="border-b border-border/50">
                  <td className="bg-secondary/50 px-3 py-2 font-medium text-muted-foreground whitespace-nowrap w-24">촬영일시</td>
                  <td className="px-3 py-2 w-40">
                    <Input
                      type="date"
                      value={localDate}
                      onChange={(e) => {
                        setLocalDate(e.target.value)
                        debouncedUpdateHeader('shoot_date', e.target.value)
                      }}
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="bg-secondary/50 px-3 py-2 font-medium text-muted-foreground whitespace-nowrap w-24">집합시간</td>
                  <td className="px-3 py-2 w-28">
                    <Input
                      type="time"
                      defaultValue={shootingDay.call_time || ''}
                      onChange={(e) => debouncedUpdateHeader('call_time', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="bg-secondary/50 px-3 py-2 font-medium text-muted-foreground whitespace-nowrap w-24">일기예보</td>
                  <td className="px-3 py-2 w-28">
                    <Input
                      type="text"
                      placeholder="맑음"
                      defaultValue={shootingDay.weather || ''}
                      onChange={(e) => debouncedUpdateHeader('weather', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="bg-secondary/50 px-3 py-2 font-medium text-muted-foreground whitespace-nowrap w-24">최저온도</td>
                  <td className="px-3 py-2 w-20">
                    <Input
                      type="text"
                      placeholder="25"
                      defaultValue={shootingDay.temp_low || ''}
                      onChange={(e) => debouncedUpdateHeader('temp_low', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </td>
                </tr>
                {/* Row 2 */}
                <tr className="border-b border-border/50">
                  <td className="bg-secondary/50 px-3 py-2 font-medium text-muted-foreground whitespace-nowrap" rowSpan={2}>촬영장소</td>
                  <td className="px-3 py-2" rowSpan={2} colSpan={1}>
                    <div className="flex gap-2 items-center">
                      <AddressInput
                        value={localLocation}
                        onChange={handleAddressSelect}
                        placeholder="주소 검색 클릭"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleFetchWeather()}
                        disabled={isLoadingWeather}
                        className="h-8 whitespace-nowrap"
                      >
                        {isLoadingWeather ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CloudSun className="h-4 w-4 mr-1" />
                            날씨
                          </>
                        )}
                      </Button>
                    </div>
                  </td>
                  <td className="bg-secondary/50 px-3 py-2 font-medium text-muted-foreground whitespace-nowrap" rowSpan={2}>집합장소</td>
                  <td className="px-3 py-2" rowSpan={2}>
                    <Input
                      type="text"
                      placeholder="촬영 장소와 동일"
                      defaultValue={shootingDay.assembly_location || ''}
                      onChange={(e) => debouncedUpdateHeader('assembly_location', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="bg-secondary/50 px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">강수확률</td>
                  <td className="px-3 py-2">
                    <Input
                      type="text"
                      placeholder="45%"
                      defaultValue={shootingDay.precipitation || ''}
                      onChange={(e) => debouncedUpdateHeader('precipitation', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="bg-secondary/50 px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">최고온도</td>
                  <td className="px-3 py-2">
                    <Input
                      type="text"
                      placeholder="32"
                      defaultValue={shootingDay.temp_high || ''}
                      onChange={(e) => debouncedUpdateHeader('temp_high', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </td>
                </tr>
                {/* Row 3 */}
                <tr className="border-b border-border/50">
                  <td className="bg-secondary/50 px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      <Sun className="h-3 w-3 text-amber-500" />
                      일출시간
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="text"
                      placeholder="5시 46분"
                      defaultValue={shootingDay.sunrise || ''}
                      onChange={(e) => debouncedUpdateHeader('sunrise', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="bg-secondary/50 px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      <Sunset className="h-3 w-3 text-orange-500" />
                      일몰시간
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="text"
                      placeholder="19시 28분"
                      defaultValue={shootingDay.sunset || ''}
                      onChange={(e) => debouncedUpdateHeader('sunset', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </td>
                </tr>
                {/* Row 4 */}
                <tr>
                  <td className="bg-secondary/50 px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">촬영시간</td>
                  <td className="px-3 py-2">
                    <Input
                      type="time"
                      defaultValue={shootingDay.shooting_time_start || ''}
                      onChange={(e) => debouncedUpdateHeader('shooting_time_start', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="bg-secondary/50 px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">종료시간</td>
                  <td className="px-3 py-2">
                    <Input
                      type="time"
                      defaultValue={shootingDay.shooting_time_end || ''}
                      onChange={(e) => debouncedUpdateHeader('shooting_time_end', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="bg-secondary/50 px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">기타사항</td>
                  <td className="px-3 py-2" colSpan={3}>
                    <Input
                      type="text"
                      placeholder="기타 참고사항"
                      defaultValue={shootingDay.notes || ''}
                      onChange={(e) => debouncedUpdateHeader('notes', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
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
