/**
 * 씬 마스터 타입 정의
 */

export interface Scene {
  id: string
  project_id: string
  scene_number: string        // '1', '2', '2A'
  scene_name: string | null   // '카페 내부'
  time_of_day: TimeOfDay | null
  location_type: LocationType | null
  location_id: string | null
  description: string | null
  page_count: number | null   // 1.5
  estimated_duration: number | null  // 분
  sequence: number
  created_at: string
  updated_at: string
  deleted_at: string | null

  // 조인된 데이터
  location?: {
    id: string
    name: string
  } | null
  characters?: SceneCharacter[]
}

export interface SceneCharacter {
  id: string
  scene_id: string
  character_id: string
  notes: string | null
  character?: {
    id: string
    name: string
    character_type: CharacterType
  }
}

export type TimeOfDay = 'D' | 'N' | 'M' | 'E'
export type LocationType = 'I' | 'E'
export type CharacterType = 'main' | 'supporting' | 'minor' | 'extra'

export const TIME_OF_DAY_LABELS: Record<TimeOfDay, string> = {
  D: '낮 (Day)',
  N: '밤 (Night)',
  M: '아침 (Morning)',
  E: '저녁 (Evening)',
}

export const TIME_OF_DAY_SHORT: Record<TimeOfDay, string> = {
  D: 'D',
  N: 'N',
  M: 'M',
  E: 'E',
}

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  I: '실내 (Interior)',
  E: '실외 (Exterior)',
}

export const LOCATION_TYPE_SHORT: Record<LocationType, string> = {
  I: 'I',
  E: 'E',
}

export const CHARACTER_TYPE_LABELS: Record<CharacterType, string> = {
  main: '주연',
  supporting: '조연',
  minor: '단역',
  extra: '엑스트라',
}

export interface CreateSceneInput {
  project_id: string
  scene_number: string
  scene_name?: string
  time_of_day?: TimeOfDay
  location_type?: LocationType
  location_id?: string
  description?: string
  page_count?: number
  estimated_duration?: number
}

export interface UpdateSceneInput {
  scene_number?: string
  scene_name?: string
  time_of_day?: TimeOfDay | null
  location_type?: LocationType | null
  location_id?: string | null
  description?: string
  page_count?: number | null
  estimated_duration?: number | null
  sequence?: number
}
