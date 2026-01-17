import { Gift } from 'lucide-react'
import type { Module } from '@/lib/modules/module-types'

/**
 * 협찬 관리 모듈
 */
export const sponsorshipModule: Module = {
  id: 'sponsorship',
  name: '협찬 관리',
  shortName: '협찬',
  icon: Gift,
  department: '제작',
  description: '협찬사 및 협찬 내용을 관리합니다.',

  phase: 'pre',
  basePath: '/sponsorship',

  enabled: true,
  version: '1.0.0',

  tables: [
    'sponsorships',
  ],

  exports: {
    pdf: false,
    excel: true,
  },
}

export * from './types'
export { useSponsorships } from './hooks/use-sponsorships'
