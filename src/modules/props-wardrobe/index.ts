import { Package } from 'lucide-react'
import type { Module } from '@/lib/modules/module-types'

/**
 * 소품/의상 모듈
 */
export const propsWardrobeModule: Module = {
  id: 'props-wardrobe',
  name: '소품/의상',
  shortName: '소품/의상',
  icon: Package,
  department: '미술',
  description: '소품과 의상을 관리합니다.',

  phase: 'pre',
  basePath: '/props',

  enabled: true,
  version: '1.0.0',

  tables: [
    'props',
    'wardrobe',
  ],

  exports: {
    pdf: false,
    excel: true,
  },
}

export * from './types'
export { useProps } from './hooks/use-props'
export { useWardrobe } from './hooks/use-wardrobe'
