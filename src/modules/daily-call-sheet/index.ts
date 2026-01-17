import { Calendar } from 'lucide-react'
import type { Module } from '@/lib/modules/module-types'

/**
 * 일일촬영계획표 모듈
 */
export const dailyCallSheetModule: Module = {
  id: 'daily-call-sheet',
  name: '일일촬영계획표',
  shortName: '일일촬영계획표',
  icon: Calendar,
  department: '연출',
  description: '촬영일별 상세 계획서를 작성하고 관리합니다.',

  phase: 'production',
  basePath: '/shooting-days',

  enabled: true,
  version: '1.0.0',

  tables: [
    'shooting_days',
    'shot_plan_items',
    'shooting_day_schedules',
    'shooting_day_staff',
    'shooting_day_equipment',
    'shooting_day_cast',
  ],

  exports: {
    pdf: true,
    excel: true,
  },
}
