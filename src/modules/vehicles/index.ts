import { Car } from 'lucide-react'
import type { Module } from '@/lib/modules/module-types'

/**
 * 차량/이동 관리 모듈
 */
export const vehiclesModule: Module = {
  id: 'vehicles',
  name: '차량/이동',
  shortName: '차량',
  icon: Car,
  department: '제작',
  description: '촬영용 차량 및 이동 수단을 관리합니다.',

  phase: 'pre',
  basePath: '/vehicles',

  enabled: true,
  version: '1.0.0',

  tables: [
    'vehicles',
  ],

  exports: {
    pdf: false,
    excel: true,
  },
}

export * from './types'
export { useVehicles } from './hooks/use-vehicles'
