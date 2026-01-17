/**
 * 스케줄 상태
 */
export type ScheduleStatus = 'planned' | 'confirmed' | 'completed' | 'cancelled'

/**
 * 촬영 스케줄
 */
export interface ShootingSchedule {
  id: string
  project_id: string
  shoot_date: string
  day_number: number | null
  status: ScheduleStatus
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  // 조인된 씬 목록
  scenes?: ScheduleScene[]
}

/**
 * 스케줄-씬 연결
 */
export interface ScheduleScene {
  id: string
  schedule_id: string
  scene_id: string
  sequence: number
  estimated_start: string | null
  estimated_duration: number | null
  notes: string | null
  created_at: string
  // 조인된 씬 정보
  scene?: {
    id: string
    scene_number: string
    scene_name: string | null
  }
}

/**
 * 스케줄 생성 입력
 */
export interface CreateScheduleInput {
  project_id: string
  shoot_date: string
  day_number?: number
}

/**
 * 스케줄 수정 입력
 */
export interface UpdateScheduleInput {
  shoot_date?: string
  day_number?: number | null
  status?: ScheduleStatus
  notes?: string | null
}

/**
 * 상태 라벨
 */
export const scheduleStatusLabels: Record<ScheduleStatus, string> = {
  planned: '계획',
  confirmed: '확정',
  completed: '완료',
  cancelled: '취소',
}
