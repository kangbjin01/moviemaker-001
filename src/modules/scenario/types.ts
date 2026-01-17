/**
 * 시나리오 상태
 */
export type ScenarioStatus = 'draft' | 'review' | 'approved' | 'locked'

/**
 * 시나리오
 */
export interface Scenario {
  id: string
  project_id: string
  title: string
  version: string
  content: string | null
  writer: string | null
  genre: string | null
  logline: string | null
  synopsis: string | null
  file_url: string | null
  file_name: string | null
  status: ScenarioStatus
  created_at: string
  updated_at: string
  deleted_at: string | null
}

/**
 * 시나리오 생성 입력
 */
export interface CreateScenarioInput {
  project_id: string
  title: string
  version?: string
  content?: string
  writer?: string
  genre?: string
  logline?: string
  synopsis?: string
}

/**
 * 시나리오 수정 입력
 */
export interface UpdateScenarioInput {
  title?: string
  version?: string
  content?: string
  writer?: string
  genre?: string
  logline?: string
  synopsis?: string
  file_url?: string | null
  file_name?: string | null
  status?: ScenarioStatus
}

/**
 * 상태 라벨
 */
export const scenarioStatusLabels: Record<ScenarioStatus, string> = {
  draft: '작성중',
  review: '검토중',
  approved: '승인됨',
  locked: '확정',
}
