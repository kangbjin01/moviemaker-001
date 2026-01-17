/**
 * 장비 카테고리
 */
export type EquipmentCategory = 'camera' | 'lens' | 'lighting' | 'grip' | 'sound' | 'etc'

/**
 * 장비 상태
 */
export type EquipmentStatus = 'planned' | 'reserved' | 'rented' | 'returned'

/**
 * 장비
 */
export interface Equipment {
  id: string
  project_id: string
  category: EquipmentCategory
  name: string
  quantity: number
  specification: string | null
  rental_company: string | null
  rental_cost: string | null
  department: string | null
  responsible_person: string | null
  status: EquipmentStatus
  notes: string | null
  sequence: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

/**
 * 장비 생성 입력
 */
export interface CreateEquipmentInput {
  project_id: string
  category: EquipmentCategory
  name: string
  quantity?: number
  department?: string
}

/**
 * 장비 수정 입력
 */
export interface UpdateEquipmentInput {
  category?: EquipmentCategory
  name?: string
  quantity?: number
  specification?: string | null
  rental_company?: string | null
  rental_cost?: string | null
  department?: string | null
  responsible_person?: string | null
  status?: EquipmentStatus
  notes?: string | null
}

/**
 * 카테고리 라벨
 */
export const equipmentCategoryLabels: Record<EquipmentCategory, string> = {
  camera: '카메라',
  lens: '렌즈',
  lighting: '조명',
  grip: '그립',
  sound: '음향',
  etc: '기타',
}

/**
 * 상태 라벨
 */
export const equipmentStatusLabels: Record<EquipmentStatus, string> = {
  planned: '계획',
  reserved: '예약',
  rented: '렌탈중',
  returned: '반납',
}
