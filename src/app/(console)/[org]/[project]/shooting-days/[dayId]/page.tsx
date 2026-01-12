'use client'

import { useMemo, useCallback, useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { AppShell } from '@/components/layout'
import {
  ShotPlanTable,
  ScheduleSection,
  StaffEquipmentSection,
  CastSection,
  type ShotPlanItem,
} from '@/components/shooting-day'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { AddressInput } from '@/components/ui/address-input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  ArrowLeft,
  FileSpreadsheet,
  FileText,
  Send,
  Sun,
  Sunset,
  Loader2,
  CloudSun,
  ClipboardList,
  Calendar,
  Users,
  UserCircle,
  Film,
} from 'lucide-react'
import Link from 'next/link'
import { useShootingDay } from '@/lib/hooks/use-shooting-day'
import { useShootingDayDetails } from '@/lib/hooks/use-shooting-day-details'
import { useProjectPeople } from '@/lib/hooks/use-project-people'
import { createClient } from '@/lib/supabase/client'
import { debounce } from '@/lib/utils/debounce'
import { fetchWeatherInfo } from '@/lib/utils/weather'
import { generateShootingDayPDF } from '@/lib/pdf/generate-pdf'
import { generateShootingDayExcel } from '@/lib/excel/generate-excel'

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

  // 추가 섹션 데이터 (Supabase 연결)
  const {
    scheduleItems,
    staffItems,
    equipmentItems,
    castItems,
    updateScheduleItems,
    addScheduleItem,
    deleteScheduleItem,
    updateStaffItems,
    addStaffItem,
    deleteStaffItem,
    updateEquipmentItems,
    updateCastItems,
    addCastItem,
    deleteCastItem,
  } = useShootingDayDetails(dayId)

  // 프로젝트 정보 가져오기
  const [projectId, setProjectId] = useState<string | null>(null)
  const [projectName, setProjectName] = useState<string>('')
  const supabase = createClient()

  useEffect(() => {
    async function fetchProjectInfo() {
      const { data } = await supabase
        .from('projects')
        .select('id, name')
        .eq('slug', project)
        .single<{ id: string; name: string }>()
      if (data) {
        setProjectId(data.id)
        setProjectName(data.name)
      }
    }
    fetchProjectInfo()
  }, [project, supabase])

  // 프로젝트 피플 데이터
  const { people: projectPeople } = useProjectPeople(projectId || '')

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

  // 피플에서 스태프 불러오기
  const handleImportStaff = useCallback(
    async (people: { id: string; name: string; role: string | null; phone: string | null }[]) => {
      for (const person of people) {
        await addStaffItem()
      }
      // 새로 추가된 스태프에 데이터 설정
      const newStaffItems = [...staffItems]
      people.forEach((person, index) => {
        const newIndex = staffItems.length + index
        if (newStaffItems[newIndex]) {
          newStaffItems[newIndex] = {
            ...newStaffItems[newIndex],
            name: person.name,
            role: person.role || '',
            phone: person.phone || '',
          }
        }
      })
      // 직접 업데이트 (한 번에)
      const importedStaff = people.map((person, index) => ({
        id: crypto.randomUUID(),
        name: person.name,
        role: person.role || '',
        phone: person.phone || '',
        sequence: staffItems.length + index + 1,
      }))
      updateStaffItems([...staffItems, ...importedStaff])
    },
    [staffItems, updateStaffItems]
  )

  // 피플에서 캐스트 불러오기
  const handleImportCast = useCallback(
    async (people: { id: string; name: string; role: string | null; phone: string | null }[]) => {
      const importedCast = people.map((person, index) => ({
        id: crypto.randomUUID(),
        character_name: '',
        actor_name: person.name,
        call_time: '',
        call_location: '',
        scenes: '',
        costume_props: '',
        phone: person.phone || '',
        sequence: castItems.length + index + 1,
      }))
      updateCastItems([...castItems, ...importedCast])
    },
    [castItems, updateCastItems]
  )

  const handleExportPDF = async () => {
    if (!shootingDay) return

    try {
      // Map the data to PDF format
      const pdfData = {
        projectName: projectName,
        dayNumber: shootingDay.day_number,
        shootDate: shootingDay.shoot_date,
        callTime: shootingDay.call_time,
        weather: shootingDay.weather,
        tempLow: shootingDay.temp_low,
        tempHigh: shootingDay.temp_high,
        baseLocation: shootingDay.base_location,
        assemblyLocation: shootingDay.assembly_location,
        precipitation: shootingDay.precipitation,
        sunrise: shootingDay.sunrise,
        sunset: shootingDay.sunset,
        shootingTimeStart: shootingDay.shooting_time_start,
        shootingTimeEnd: shootingDay.shooting_time_end,
        notes: shootingDay.notes,

        shotPlanItems: items.map(item => ({
          sequence: item.sequence,
          scene_number: item.scene_number,
          cut_number: item.cut_number,
          scene_time: item.scene_time,
          scene_location_type: item.scene_location_type,
          start_time: item.start_time,
          end_time: item.end_time,
          location: item.location,
          content: item.content,
          notes: item.notes,
        })),

        scheduleItems: scheduleItems.map(item => ({
          sequence: item.sequence,
          time: item.time,
          title: item.title,
          description: item.description,
        })),

        staffItems: staffItems.map(item => ({
          role: item.role,
          name: item.name,
          phone: item.phone,
        })),

        equipmentItems: equipmentItems.map(item => ({
          department: item.department,
          content: item.content,
        })),

        castItems: castItems.map(item => ({
          character_name: item.character_name,
          actor_name: item.actor_name,
          call_time: item.call_time,
          call_location: item.call_location,
          scenes: item.scenes,
          costume_props: item.costume_props,
          phone: item.phone,
        })),
      }

      const result = await generateShootingDayPDF(pdfData)

      if (result.success) {
        console.log('PDF generated successfully')
      } else {
        alert('PDF 생성 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('PDF export error:', error)
      alert('PDF 생성 중 오류가 발생했습니다.')
    }
  }

  const handleExportExcel = async () => {
    if (!shootingDay) return

    try {
      // Map the data to Excel format (same as PDF)
      const excelData = {
        projectName: projectName,
        dayNumber: shootingDay.day_number,
        shootDate: shootingDay.shoot_date,
        callTime: shootingDay.call_time,
        weather: shootingDay.weather,
        tempLow: shootingDay.temp_low,
        tempHigh: shootingDay.temp_high,
        baseLocation: shootingDay.base_location,
        assemblyLocation: shootingDay.assembly_location,
        precipitation: shootingDay.precipitation,
        sunrise: shootingDay.sunrise,
        sunset: shootingDay.sunset,
        shootingTimeStart: shootingDay.shooting_time_start,
        shootingTimeEnd: shootingDay.shooting_time_end,
        notes: shootingDay.notes,

        shotPlanItems: items.map(item => ({
          sequence: item.sequence,
          scene_number: item.scene_number,
          cut_number: item.cut_number,
          scene_time: item.scene_time,
          scene_location_type: item.scene_location_type,
          start_time: item.start_time,
          end_time: item.end_time,
          location: item.location,
          content: item.content,
          notes: item.notes,
        })),

        scheduleItems: scheduleItems.map(item => ({
          sequence: item.sequence,
          time: item.time,
          title: item.title,
          description: item.description,
        })),

        staffItems: staffItems.map(item => ({
          role: item.role,
          name: item.name,
          phone: item.phone,
        })),

        equipmentItems: equipmentItems.map(item => ({
          department: item.department,
          content: item.content,
        })),

        castItems: castItems.map(item => ({
          character_name: item.character_name,
          actor_name: item.actor_name,
          call_time: item.call_time,
          call_location: item.call_location,
          scenes: item.scenes,
          costume_props: item.costume_props,
          phone: item.phone,
        })),
      }

      const result = await generateShootingDayExcel(excelData)

      if (result.success) {
        console.log('Excel generated successfully')
      } else {
        alert('Excel 생성 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('Excel export error:', error)
      alert('Excel 생성 중 오류가 발생했습니다.')
    }
  }

  const handlePublish = async () => {
    await publish()
  }

  if (isLoading) {
    return (
      <AppShell org={org} project={project} title="로딩중...">
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    )
  }

  if (error || !shootingDay) {
    return (
      <AppShell org={org} project={project} title="오류">
        <div className="flex h-full flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">{error || '촬영 계획표를 찾을 수 없습니다'}</p>
          <Button asChild variant="outline">
            <Link href={`/${org}/${project}/shooting-days`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로
            </Link>
          </Button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell org={org} project={project} title={`${shootingDay.day_number || ''}회차`}>
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
                    {shootingDay.day_number || '-'}회차
                  </h1>
                  <Badge variant={shootingDay.status === 'published' ? 'default' : 'secondary'}>
                    {shootingDay.status === 'published' ? '저장됨' : '작성중'}
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
                저장
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="basic" className="flex flex-1 flex-col overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-border bg-background px-6 py-3">
            <TabsList>
              <TabsTrigger value="basic" icon={<ClipboardList className="h-4 w-4" />}>
                기본정보
              </TabsTrigger>
              <TabsTrigger value="shotplan" icon={<Film className="h-4 w-4" />}>
                촬영계획
              </TabsTrigger>
              <TabsTrigger value="schedule" icon={<Calendar className="h-4 w-4" />}>
                전체일정
              </TabsTrigger>
              <TabsTrigger value="staff" icon={<Users className="h-4 w-4" />}>
                스태프/장비
              </TabsTrigger>
              <TabsTrigger value="cast" icon={<UserCircle className="h-4 w-4" />}>
                캐스트
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab 1: Basic Info */}
          <TabsContent value="basic" className="flex-1 overflow-y-auto px-6 py-4">
              {/* 기본 정보 테이블 */}
              <div className="overflow-x-auto rounded-lg border border-border bg-card">
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
                          value={shootingDay.weather || ''}
                          onChange={(e) => debouncedUpdateHeader('weather', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </td>
                      <td className="bg-secondary/50 px-3 py-2 font-medium text-muted-foreground whitespace-nowrap w-24">최저온도</td>
                      <td className="px-3 py-2 w-20">
                        <Input
                          type="text"
                          placeholder="25"
                          value={shootingDay.temp_low || ''}
                          onChange={(e) => debouncedUpdateHeader('temp_low', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </td>
                    </tr>
                    {/* Row 2 */}
                    <tr className="border-b border-border/50">
                      <td className="bg-secondary/50 px-3 py-2 font-medium text-muted-foreground whitespace-nowrap" rowSpan={2}>촬영장소</td>
                      <td className="px-3 py-2" rowSpan={2}>
                        <div className="flex gap-2 items-center">
                          <AddressInput
                            value={localLocation}
                            onChange={handleAddressSelect}
                            placeholder="주소 검색"
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
                          value={shootingDay.precipitation || ''}
                          onChange={(e) => debouncedUpdateHeader('precipitation', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </td>
                      <td className="bg-secondary/50 px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">최고온도</td>
                      <td className="px-3 py-2">
                        <Input
                          type="text"
                          placeholder="32"
                          value={shootingDay.temp_high || ''}
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
                          value={shootingDay.sunrise || ''}
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
                          value={shootingDay.sunset || ''}
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
            </TabsContent>

          {/* Tab 2: Shot Plan */}
          <TabsContent value="shotplan" className="flex-1 overflow-y-auto px-6 py-4">
            <ShotPlanTable
              items={items}
              onChange={handleItemsChange}
              onAddRow={addItem}
              onDeleteRow={deleteItem}
              availableCast={projectPeople.filter(p => p.is_cast).map(p => ({
                id: p.id,
                name: p.name,
              }))}
            />
          </TabsContent>

          {/* Tab 3: Schedule */}
          <TabsContent value="schedule" className="flex-1 overflow-y-auto px-6 py-4">
            <ScheduleSection
                items={scheduleItems}
                onChange={updateScheduleItems}
                onAddRow={addScheduleItem}
                onDeleteRow={deleteScheduleItem}
            />
          </TabsContent>

          {/* Tab 4: Staff & Equipment */}
          <TabsContent value="staff" className="flex-1 overflow-y-auto px-6 py-4">
            <StaffEquipmentSection
                staff={staffItems}
                equipment={equipmentItems}
                onStaffChange={updateStaffItems}
                onEquipmentChange={updateEquipmentItems}
                onAddStaff={addStaffItem}
                onDeleteStaff={deleteStaffItem}
                availablePeople={projectPeople.filter(p => !p.is_cast).map(p => ({
                  id: p.id,
                  name: p.name,
                  role: p.role,
                  department: p.department,
                  phone: p.phone,
                }))}
                onImportStaff={handleImportStaff}
            />
          </TabsContent>

          {/* Tab 5: Cast */}
          <TabsContent value="cast" className="flex-1 overflow-y-auto px-6 py-4">
            <CastSection
                items={castItems}
                onChange={updateCastItems}
                onAddRow={addCastItem}
                onDeleteRow={deleteCastItem}
                availableCast={projectPeople.filter(p => p.is_cast).map(p => ({
                  id: p.id,
                  name: p.name,
                  role: p.role,
                  phone: p.phone,
                }))}
                onImportCast={handleImportCast}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
