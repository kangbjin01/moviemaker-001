import { Users } from 'lucide-react'
import type { Module } from '@/lib/modules/module-types'

/**
 * 캐릭터 마스터 모듈
 */
export const characterMasterModule: Module = {
  id: 'character-master',
  name: '캐릭터',
  shortName: '캐릭터',
  icon: Users,
  department: '연출',
  description: '시나리오 속 캐릭터(등장인물)를 관리합니다.',

  phase: 'master',
  basePath: '/characters',

  enabled: true,
  version: '1.0.0',

  tables: [
    'characters',
    'scene_characters',
  ],

  exports: {
    pdf: false,
    excel: true,
  },
}

// 타입 및 훅 re-export
export * from './types'
export { useCharacters } from './hooks/use-characters'
