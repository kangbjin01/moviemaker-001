import { FileText } from 'lucide-react'
import type { Module } from '@/lib/modules/module-types'

/**
 * 시나리오 모듈
 */
export const scenarioModule: Module = {
  id: 'scenario',
  name: '시나리오',
  shortName: '시나리오',
  icon: FileText,
  department: '연출',
  description: '시나리오(대본)를 작성하고 관리합니다.',

  phase: 'pre',
  basePath: '/scenario',

  enabled: true,
  version: '1.0.0',

  tables: [
    'scenarios',
  ],

  exports: {
    pdf: true,
    excel: false,
  },
}

export * from './types'
export { useScenarios } from './hooks/use-scenarios'
