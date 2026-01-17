import { LucideIcon } from 'lucide-react'

/**
 * 모듈 정의 인터페이스
 * 각 문서 모듈은 이 인터페이스를 구현해야 함
 */
export interface Module {
  // 기본 정보
  id: string                    // 'daily-call-sheet', 'scene-breakdown'
  name: string                  // '일일촬영계획표', '씬 브레이크다운'
  shortName: string             // '일촬표', '브레이크다운' (사이드바용)
  icon: LucideIcon              // Calendar, FileText 등
  department: Department        // '연출', '제작' 등
  description: string           // 모듈 설명

  // 프로덕션 단계
  phase: ProductionPhase        // 'master', 'pre', 'production', 'post'

  // 라우팅
  basePath: string              // '/shooting-days', '/scene-breakdown'

  // 상태
  enabled: boolean              // 활성화 여부
  version: string               // '1.0.0'

  // 데이터베이스
  tables: string[]              // 관련 테이블 목록

  // 내보내기 지원
  exports: {
    pdf: boolean
    excel: boolean
  }
}

/**
 * 프로덕션 단계
 */
export type ProductionPhase =
  | 'master'      // 기본 정보 (씬, 로케이션, 캐릭터 등)
  | 'pre'         // 프리 프로덕션
  | 'production'  // 현장 (촬영)
  | 'post'        // 포스트 프로덕션

/**
 * 부서 타입
 */
export type Department =
  | '연출'
  | '제작'
  | '촬영'
  | '조명'
  | '미술'
  | '의상'
  | '분장'
  | '음향'
  | '공통'

/**
 * 모듈 카테고리
 */
export interface ModuleCategory {
  id: string
  name: string
  department: Department
  modules: Module[]
}

/**
 * 모듈 설정
 */
export interface ModuleConfig {
  // 프로젝트별 활성화된 모듈 ID 목록
  enabledModules: string[]
}

/**
 * 모듈 네비게이션 아이템
 */
export interface ModuleNavItem {
  id: string
  name: string
  href: string
  icon: LucideIcon
  badge?: string | number
}

/**
 * 모듈 메타데이터 (사이드바/대시보드용)
 */
export function getModuleNavItem(
  module: Module,
  org: string,
  project: string
): ModuleNavItem {
  return {
    id: module.id,
    name: module.shortName,
    href: `/${org}/${project}${module.basePath}`,
    icon: module.icon,
  }
}
