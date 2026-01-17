/**
 * 샷 타입
 */
export type ShotType = 'WS' | 'FS' | 'MS' | 'MCU' | 'CU' | 'ECU' | 'OTS' | 'POV' | 'INSERT' | 'OTHER'

/**
 * 카메라 무브먼트
 */
export type CameraMovement = 'FIX' | 'PAN' | 'TILT' | 'DOLLY' | 'TRACK' | 'CRANE' | 'HANDHELD' | 'STEADICAM' | 'ZOOM' | 'OTHER'

/**
 * 카메라 앵글
 */
export type CameraAngle = 'EYE' | 'HIGH' | 'LOW' | 'DUTCH' | 'BIRD' | 'WORM' | 'OTHER'

/**
 * 샷
 */
export interface Shot {
  id: string
  project_id: string
  scene_id: string | null
  shot_number: string
  shot_type: ShotType | null
  shot_size: string | null
  camera_movement: CameraMovement | null
  camera_angle: CameraAngle | null
  description: string | null
  dialogue: string | null
  action: string | null
  storyboard_url: string | null
  reference_url: string | null
  duration_seconds: number | null
  sequence: number
  created_at: string
  updated_at: string
  deleted_at: string | null
  // 조인
  scene?: {
    id: string
    scene_number: string
    scene_name: string | null
  } | null
}

/**
 * 샷 생성 입력
 */
export interface CreateShotInput {
  project_id: string
  scene_id?: string
  shot_number: string
  shot_type?: ShotType
  camera_movement?: CameraMovement
  camera_angle?: CameraAngle
  description?: string
}

/**
 * 샷 수정 입력
 */
export interface UpdateShotInput {
  scene_id?: string | null
  shot_number?: string
  shot_type?: ShotType | null
  shot_size?: string | null
  camera_movement?: CameraMovement | null
  camera_angle?: CameraAngle | null
  description?: string | null
  dialogue?: string | null
  action?: string | null
  storyboard_url?: string | null
  reference_url?: string | null
  duration_seconds?: number | null
  sequence?: number
}

/**
 * 샷 타입 라벨
 */
export const shotTypeLabels: Record<ShotType, string> = {
  WS: 'Wide Shot',
  FS: 'Full Shot',
  MS: 'Medium Shot',
  MCU: 'Medium Close-Up',
  CU: 'Close-Up',
  ECU: 'Extreme Close-Up',
  OTS: 'Over the Shoulder',
  POV: 'Point of View',
  INSERT: 'Insert',
  OTHER: '기타',
}

/**
 * 카메라 무브먼트 라벨
 */
export const cameraMovementLabels: Record<CameraMovement, string> = {
  FIX: 'Fix (고정)',
  PAN: 'Pan (패닝)',
  TILT: 'Tilt (틸트)',
  DOLLY: 'Dolly (달리)',
  TRACK: 'Track (트래킹)',
  CRANE: 'Crane (크레인)',
  HANDHELD: 'Handheld (핸드헬드)',
  STEADICAM: 'Steadicam (스테디캠)',
  ZOOM: 'Zoom (줌)',
  OTHER: '기타',
}

/**
 * 카메라 앵글 라벨
 */
export const cameraAngleLabels: Record<CameraAngle, string> = {
  EYE: 'Eye Level (눈높이)',
  HIGH: 'High Angle (하이앵글)',
  LOW: 'Low Angle (로우앵글)',
  DUTCH: 'Dutch Angle (더치앵글)',
  BIRD: "Bird's Eye (부감)",
  WORM: "Worm's Eye (앙감)",
  OTHER: '기타',
}
