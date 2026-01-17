/**
 * 조달 방법
 */
export type SourceType = 'purchase' | 'rental' | 'make' | 'borrow' | 'sponsorship'

/**
 * 상태
 */
export type ItemStatus = 'needed' | 'acquired' | 'ready'

/**
 * 소품
 */
export interface Prop {
  id: string
  project_id: string
  scene_id: string | null
  name: string
  description: string | null
  quantity: number
  source: SourceType
  cost: string | null
  supplier: string | null
  status: ItemStatus
  image_url: string | null
  reference_url: string | null
  notes: string | null
  sequence: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

/**
 * 의상
 */
export interface Wardrobe {
  id: string
  project_id: string
  character_id: string | null
  scene_id: string | null
  name: string
  description: string | null
  source: SourceType
  cost: string | null
  supplier: string | null
  status: ItemStatus
  size: string | null
  image_url: string | null
  reference_url: string | null
  notes: string | null
  sequence: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

/**
 * 소품 생성 입력
 */
export interface CreatePropInput {
  project_id: string
  name: string
  scene_id?: string
  quantity?: number
  source?: SourceType
}

/**
 * 소품 수정 입력
 */
export interface UpdatePropInput {
  scene_id?: string | null
  name?: string
  description?: string | null
  quantity?: number
  source?: SourceType
  cost?: string | null
  supplier?: string | null
  status?: ItemStatus
  notes?: string | null
}

/**
 * 의상 생성 입력
 */
export interface CreateWardrobeInput {
  project_id: string
  name: string
  character_id?: string
  scene_id?: string
  source?: SourceType
}

/**
 * 의상 수정 입력
 */
export interface UpdateWardrobeInput {
  character_id?: string | null
  scene_id?: string | null
  name?: string
  description?: string | null
  source?: SourceType
  cost?: string | null
  supplier?: string | null
  status?: ItemStatus
  size?: string | null
  notes?: string | null
}

/**
 * 조달 방법 라벨
 */
export const sourceLabels: Record<SourceType, string> = {
  purchase: '구매',
  rental: '대여',
  make: '제작',
  borrow: '빌림',
  sponsorship: '협찬',
}

/**
 * 상태 라벨
 */
export const itemStatusLabels: Record<ItemStatus, string> = {
  needed: '필요',
  acquired: '확보',
  ready: '준비완료',
}
