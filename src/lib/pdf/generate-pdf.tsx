import { pdf } from '@react-pdf/renderer'
import { ShootingDayPDF } from './shooting-day-pdf'

interface ShootingDayData {
  projectName: string
  dayNumber: number | null
  shootDate: string
  callTime: string | null
  weather: string | null
  tempLow: string | null
  tempHigh: string | null
  baseLocation: string | null
  assemblyLocation: string | null
  precipitation: string | null
  sunrise: string | null
  sunset: string | null
  shootingTimeStart: string | null
  shootingTimeEnd: string | null
  notes: string | null

  shotPlanItems: Array<{
    sequence: number
    scene_number: string | null
    cut_number: string | null
    scene_time: string | null
    scene_location_type: string | null
    start_time: string | null
    end_time: string | null
    location: string | null
    content: string
    notes: string | null
  }>

  scheduleItems: Array<{
    sequence: number
    time: string
    title: string
    description: string
  }>

  staffItems: Array<{
    role: string
    name: string
    phone: string
  }>

  equipmentItems: Array<{
    department: string
    content: string
  }>

  castItems: Array<{
    character_name: string
    actor_name: string
    call_time: string
    call_location: string
    scenes: string
    costume_props: string
    phone: string
  }>
}

export async function generateShootingDayPDF(data: ShootingDayData) {
  try {
    // PDF 생성
    const blob = await pdf(<ShootingDayPDF data={data} />).toBlob()

    // 파일명 생성
    const fileName = `${data.projectName}_${data.dayNumber || ''}회차_일일촬영계획표_${data.shootDate}.pdf`

    // 다운로드
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    return { success: true }
  } catch (error) {
    console.error('PDF generation error:', error)
    return { success: false, error }
  }
}
