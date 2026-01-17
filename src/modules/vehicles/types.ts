/**
 * 차량 타입
 */
export type VehicleType = 'car' | 'van' | 'truck' | 'bus' | 'special'

/**
 * 차량 상태
 */
export type VehicleStatus = 'planned' | 'reserved' | 'in_use' | 'returned'

/**
 * 차량
 */
export interface Vehicle {
  id: string
  project_id: string
  vehicle_type: VehicleType
  name: string
  plate_number: string | null
  rental_company: string | null
  rental_cost: string | null
  rental_start: string | null
  rental_end: string | null
  driver_name: string | null
  driver_phone: string | null
  status: VehicleStatus
  notes: string | null
  sequence: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

/**
 * 차량 생성 입력
 */
export interface CreateVehicleInput {
  project_id: string
  vehicle_type: VehicleType
  name: string
}

/**
 * 차량 수정 입력
 */
export interface UpdateVehicleInput {
  vehicle_type?: VehicleType
  name?: string
  plate_number?: string | null
  rental_company?: string | null
  rental_cost?: string | null
  rental_start?: string | null
  rental_end?: string | null
  driver_name?: string | null
  driver_phone?: string | null
  status?: VehicleStatus
  notes?: string | null
}

/**
 * 차량 타입 라벨
 */
export const vehicleTypeLabels: Record<VehicleType, string> = {
  car: '승용차',
  van: '승합차',
  truck: '트럭',
  bus: '버스',
  special: '특수차량',
}

/**
 * 상태 라벨
 */
export const vehicleStatusLabels: Record<VehicleStatus, string> = {
  planned: '계획',
  reserved: '예약',
  in_use: '사용중',
  returned: '반납',
}
