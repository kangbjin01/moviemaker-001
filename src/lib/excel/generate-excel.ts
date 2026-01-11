import * as XLSX from 'xlsx'

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

function timeToExcel(timeStr: string | null): number | null {
  if (!timeStr) return null
  const [hours, minutes] = timeStr.split(':').map(Number)
  return (hours + minutes / 60) / 24
}

export async function generateShootingDayExcel(data: ShootingDayData) {
  try {
    // 템플릿 파일 fetch로 가져오기
    const response = await fetch('/template.xlsx')
    const arrayBuffer = await response.arrayBuffer()
    const templateWorkbook = XLSX.read(arrayBuffer, { type: 'array' })

    // '1회차' 시트 복사
    const templateSheet = templateWorkbook.Sheets['1회차']

    // 템플릿 시트를 깊은 복사
    const newWorkbook = XLSX.utils.book_new()
    const newSheet = XLSX.utils.sheet_to_json(templateSheet, { header: 1, defval: null }) as any[][]

    // 기본 정보 채우기 (0-based index)
    // Row 6 (index 6), Column E (index 4): 프로젝트명
    if (!newSheet[6]) newSheet[6] = []
    newSheet[6][4] = `${data.projectName} 일일촬영계획표`

    // Row 10 (index 10): 회차, 촬영일시, 집합시간
    if (!newSheet[10]) newSheet[10] = []
    newSheet[10][4] = data.dayNumber || '' // E11: 회차
    newSheet[10][10] = data.shootDate || '' // K11: 촬영일시
    const callTime = timeToExcel(data.callTime)
    if (callTime !== null) {
      newSheet[10][14] = callTime // O11: 집합시간
    }

    // Row 12 (index 12): 촬영장소, 집합장소
    if (!newSheet[12]) newSheet[12] = []
    newSheet[12][10] = data.baseLocation || '' // K13: 촬영장소
    newSheet[12][14] = data.assemblyLocation || '' // O13: 집합장소

    // Row 14 (index 14): Shooting Time 시작, 종료시간
    if (!newSheet[14]) newSheet[14] = []
    const startTime = timeToExcel(data.shootingTimeStart)
    const endTime = timeToExcel(data.shootingTimeEnd)
    if (startTime !== null) {
      newSheet[14][10] = startTime // K15: Shooting Time
    }
    if (endTime !== null) {
      newSheet[14][14] = endTime // O15: 종료시간
    }

    // 촬영 씬 데이터 채우기 (Row 21부터, index 20부터)
    const dataStartRow = 20 // 0-based index

    // 기존 데이터 행 제거 (21행부터 끝까지)
    newSheet.splice(dataStartRow + 1)

    // 새 데이터 추가
    data.shotPlanItems.forEach((item, index) => {
      const rowIndex = dataStartRow + 1 + index
      if (!newSheet[rowIndex]) {
        newSheet[rowIndex] = []
      }

      // 각 열에 데이터 채우기
      newSheet[rowIndex][4] = item.sequence // E: 촬영순서
      newSheet[rowIndex][5] = item.scene_number || '' // F: S#
      newSheet[rowIndex][6] = item.cut_number || '' // G: CUT
      newSheet[rowIndex][7] = item.scene_time || '' // H: M/D/E/N
      newSheet[rowIndex][8] = item.scene_location_type || '' // I: I/E

      const itemStartTime = timeToExcel(item.start_time)
      const itemEndTime = timeToExcel(item.end_time)
      if (itemStartTime !== null) {
        newSheet[rowIndex][9] = itemStartTime // J: 시작시간
      }
      if (itemEndTime !== null) {
        newSheet[rowIndex][10] = itemEndTime // K: 끝시간
      }

      newSheet[rowIndex][11] = item.location || '' // L: 촬영장소
      newSheet[rowIndex][14] = item.content || '' // O: 촬영내용
      newSheet[rowIndex][19] = item.notes || '' // T: 주요인물
    })

    // 배열을 시트로 변환
    const ws = XLSX.utils.aoa_to_sheet(newSheet)

    // 원본 템플릿의 스타일 정보 복사
    if (templateSheet['!merges']) {
      ws['!merges'] = [...templateSheet['!merges']]
    }
    if (templateSheet['!cols']) {
      ws['!cols'] = [...templateSheet['!cols']]
    }
    if (templateSheet['!rows']) {
      ws['!rows'] = [...templateSheet['!rows']]
    }

    // 시트를 워크북에 추가
    XLSX.utils.book_append_sheet(newWorkbook, ws, `${data.dayNumber || 1}회차`)

    // 파일 다운로드
    const fileName = `${data.projectName}_${data.dayNumber || ''}회차_일일촬영계획표_${data.shootDate}.xlsx`
    XLSX.writeFile(newWorkbook, fileName)

    return { success: true }
  } catch (error) {
    console.error('Excel generation error:', error)
    return { success: false, error }
  }
}
