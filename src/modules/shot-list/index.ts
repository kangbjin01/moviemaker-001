import { Video } from 'lucide-react'
import type { Module } from '@/lib/modules/module-types'

/**
 * 콘티/컷 리스트 모듈
 */
export const shotListModule: Module = {
  id: 'shot-list',
  name: '콘티/컷 리스트',
  shortName: '콘티',
  icon: Video,
  department: '연출',
  description: '씬별 샷 구성과 콘티를 관리합니다.',

  phase: 'pre',
  basePath: '/shots',

  enabled: true,
  version: '1.0.0',

  tables: [
    'shots',
  ],

  exports: {
    pdf: true,
    excel: true,
  },
}

export * from './types'
export { useShots } from './hooks/use-shots'
