/**
 * 로케이션 마스터 타입 정의
 */

export interface Location {
  id: string
  project_id: string

  // 기본 정보
  name: string                  // 장소명
  address: string | null        // 주소

  // 지도 좌표
  latitude: number | null
  longitude: number | null

  // 담당자 정보
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null

  // 장소 상세
  rental_fee: string | null
  parking_available: boolean
  power_available: boolean

  // 사전탐방 노트
  notes: string | null
  lighting_notes: string | null   // 조명 관련
  camera_notes: string | null     // 촬영 관련
  art_notes: string | null        // 미술 관련
  sound_notes: string | null      // 음향 관련

  // 이미지
  images: string[]               // R2 키 배열

  // 메타
  sequence: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface CreateLocationInput {
  project_id: string
  name: string
  address?: string
  latitude?: number
  longitude?: number
  contact_name?: string
  contact_phone?: string
  contact_email?: string
  rental_fee?: string
  parking_available?: boolean
  power_available?: boolean
  notes?: string
}

export interface UpdateLocationInput {
  name?: string
  address?: string | null
  latitude?: number | null
  longitude?: number | null
  contact_name?: string | null
  contact_phone?: string | null
  contact_email?: string | null
  rental_fee?: string | null
  parking_available?: boolean
  power_available?: boolean
  notes?: string | null
  lighting_notes?: string | null
  camera_notes?: string | null
  art_notes?: string | null
  sound_notes?: string | null
  images?: string[]
  sequence?: number
}

// 사전탐방 체크리스트 항목
export interface ScoutingChecklist {
  lighting: {
    sunPosition: string      // 해 위치
    naturalLight: string     // 자연광 상태
    powerOutlets: string     // 전원 위치
    notes: string
  }
  camera: {
    possibleAngles: string   // 가능한 앵글
    restrictions: string     // 제약사항
    notes: string
  }
  art: {
    propsPlacement: string   // 소품 배치
    setDressing: string      // 세트 드레싱
    notes: string
  }
  sound: {
    ambientNoise: string     // 주변 소음
    echoLevel: string        // 울림 정도
    notes: string
  }
}
