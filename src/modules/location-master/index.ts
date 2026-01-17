import { MapPin } from 'lucide-react'
import type { Module } from '@/lib/modules/module-types'

/**
 * 로케이션 마스터 모듈
 */
export const locationMasterModule: Module = {
  id: 'location-master',
  name: '로케이션',
  shortName: '로케이션',
  icon: MapPin,
  department: '제작',
  description: '촬영 장소 정보를 관리합니다.',

  phase: 'master',
  basePath: '/locations',

  enabled: true,
  version: '1.0.0',

  tables: [
    'locations',
  ],

  exports: {
    pdf: false,
    excel: true,
  },
}

// 타입 및 훅 re-export
export * from './types'
export { useLocations } from './hooks/use-locations'
