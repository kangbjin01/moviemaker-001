/**
 * 캐릭터 타입
 */
export type CharacterType = 'main' | 'supporting' | 'minor' | 'extra'

/**
 * 캐릭터
 */
export interface Character {
  id: string
  project_id: string
  name: string
  description: string | null
  actor_id: string | null
  character_type: CharacterType
  sequence: number
  created_at: string
  updated_at: string
  deleted_at: string | null
  // 조인된 데이터
  actor?: {
    id: string
    name: string
  } | null
}

/**
 * 캐릭터 생성 입력
 */
export interface CreateCharacterInput {
  project_id: string
  name: string
  description?: string
  actor_id?: string
  character_type?: CharacterType
}

/**
 * 캐릭터 수정 입력
 */
export interface UpdateCharacterInput {
  name?: string
  description?: string | null
  actor_id?: string | null
  character_type?: CharacterType
  sequence?: number
}

/**
 * 캐릭터 타입 라벨
 */
export const characterTypeLabels: Record<CharacterType, string> = {
  main: '주연',
  supporting: '조연',
  minor: '단역',
  extra: '엑스트라',
}
