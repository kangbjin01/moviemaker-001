/**
 * 협찬 카테고리
 */
export type SponsorshipCategory = 'product' | 'service' | 'location' | 'food' | 'vehicle' | 'etc'

/**
 * 협찬 상태
 */
export type SponsorshipStatus = 'contacted' | 'negotiating' | 'confirmed' | 'rejected' | 'completed'

/**
 * 협찬
 */
export interface Sponsorship {
  id: string
  project_id: string
  company_name: string
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
  category: SponsorshipCategory | null
  description: string | null
  value: string | null
  proposal_sent_at: string | null
  proposal_url: string | null
  status: SponsorshipStatus
  contract_terms: string | null
  exposure_requirements: string | null
  notes: string | null
  sequence: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

/**
 * 협찬 생성 입력
 */
export interface CreateSponsorshipInput {
  project_id: string
  company_name: string
  category?: SponsorshipCategory
  description?: string
}

/**
 * 협찬 수정 입력
 */
export interface UpdateSponsorshipInput {
  company_name?: string
  contact_name?: string | null
  contact_phone?: string | null
  contact_email?: string | null
  category?: SponsorshipCategory | null
  description?: string | null
  value?: string | null
  proposal_sent_at?: string | null
  proposal_url?: string | null
  status?: SponsorshipStatus
  contract_terms?: string | null
  exposure_requirements?: string | null
  notes?: string | null
}

/**
 * 카테고리 라벨
 */
export const sponsorshipCategoryLabels: Record<SponsorshipCategory, string> = {
  product: '제품',
  service: '서비스',
  location: '장소',
  food: '식음료',
  vehicle: '차량',
  etc: '기타',
}

/**
 * 상태 라벨
 */
export const sponsorshipStatusLabels: Record<SponsorshipStatus, string> = {
  contacted: '컨택',
  negotiating: '협의중',
  confirmed: '확정',
  rejected: '거절',
  completed: '완료',
}
