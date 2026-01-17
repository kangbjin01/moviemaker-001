import { Wrench } from 'lucide-react'
import type { Module } from '@/lib/modules/module-types'

/**
 * 장비 리스트 모듈
 */
export const equipmentModule: Module = {
  id: 'equipment',
  name: '장비 리스트',
  shortName: '장비',
  icon: Wrench,
  department: '촬영',
  description: '촬영/조명/음향 장비를 관리합니다.',

  phase: 'pre',
  basePath: '/equipment',

  enabled: true,
  version: '1.0.0',

  tables: [
    'equipment',
  ],

  exports: {
    pdf: false,
    excel: true,
  },
}

export * from './types'
export { useEquipment } from './hooks/use-equipment'
