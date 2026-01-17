import type { Module, ModuleNavItem, ProductionPhase } from '@/lib/modules/module-types'
import { getModuleNavItem } from '@/lib/modules/module-types'

// 모듈 임포트
import { dailyCallSheetModule } from './daily-call-sheet'
import { sceneMasterModule } from './scene-master'
import { locationMasterModule } from './location-master'
import { characterMasterModule } from './character-master'
import { scenarioModule } from './scenario'
import { shotListModule } from './shot-list'
import { equipmentModule } from './equipment'
import { propsWardrobeModule } from './props-wardrobe'
import { sponsorshipModule } from './sponsorship'
import { vehiclesModule } from './vehicles'
import { shootingScheduleModule } from './shooting-schedule'

/**
 * 등록된 모든 모듈
 */
export const modules: Module[] = [
  // 기본 정보 (Master)
  sceneMasterModule,
  locationMasterModule,
  characterMasterModule,
  // 프리 프로덕션 (Pre)
  scenarioModule,
  shotListModule,
  equipmentModule,
  propsWardrobeModule,
  sponsorshipModule,
  vehiclesModule,
  shootingScheduleModule,
  // 현장 (Production)
  dailyCallSheetModule,
]

/**
 * 모듈 ID로 모듈 찾기
 */
export function getModule(id: string): Module | undefined {
  return modules.find(m => m.id === id)
}

/**
 * 활성화된 모듈만 가져오기
 */
export function getEnabledModules(): Module[] {
  return modules.filter(m => m.enabled)
}

/**
 * 부서별 모듈 가져오기
 */
export function getModulesByDepartment(department: string): Module[] {
  return modules.filter(m => m.department === department && m.enabled)
}

/**
 * 사이드바 네비게이션 아이템 생성
 */
export function getModuleNavItems(org: string, project: string): ModuleNavItem[] {
  return getEnabledModules().map(module => getModuleNavItem(module, org, project))
}

/**
 * 모듈 존재 여부 확인
 */
export function hasModule(id: string): boolean {
  return modules.some(m => m.id === id && m.enabled)
}

/**
 * 단계별 모듈 가져오기
 */
export function getModulesByPhase(phase: ProductionPhase): Module[] {
  return modules.filter(m => m.phase === phase && m.enabled)
}

/**
 * 단계별 그룹화된 모듈 가져오기
 */
export function getGroupedModules(): Record<ProductionPhase, Module[]> {
  const phases: ProductionPhase[] = ['master', 'pre', 'production', 'post']
  return phases.reduce((acc, phase) => {
    acc[phase] = getModulesByPhase(phase)
    return acc
  }, {} as Record<ProductionPhase, Module[]>)
}

/**
 * 단계 라벨
 */
export const phaseLabels: Record<ProductionPhase, string> = {
  master: '기본 정보',
  pre: '프리 프로덕션',
  production: '현장',
  post: '포스트',
}
