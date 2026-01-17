import { FileText } from 'lucide-react'
import type { Module } from '@/lib/modules/module-types'

/**
 * 씬 마스터 모듈
 */
export const sceneMasterModule: Module = {
  id: 'scene-master',
  name: '씬 마스터',
  shortName: '씬',
  icon: FileText,
  department: '연출',
  description: '시나리오 기반 씬 목록을 관리합니다.',

  phase: 'master',
  basePath: '/scenes',

  enabled: true,
  version: '1.0.0',

  tables: [
    'scenes',
    'scene_characters',
  ],

  exports: {
    pdf: false,
    excel: true,
  },
}

// 타입 및 훅 re-export
export * from './types'
export { useScenes } from './hooks/use-scenes'
