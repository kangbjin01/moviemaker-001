import { Calendar } from 'lucide-react'
import type { Module } from '@/lib/modules/module-types'

/**
 * 촬영 스케줄 모듈
 */
export const shootingScheduleModule: Module = {
  id: 'shooting-schedule',
  name: '촬영 스케줄',
  shortName: '스케줄',
  icon: Calendar,
  department: '제작',
  description: '촬영 일정을 계획하고 관리합니다.',

  phase: 'pre',
  basePath: '/schedule',

  enabled: true,
  version: '1.0.0',

  tables: [
    'shooting_schedule',
    'shooting_schedule_scenes',
  ],

  exports: {
    pdf: true,
    excel: true,
  },
}

export * from './types'
export { useShootingSchedule } from './hooks/use-shooting-schedule'
