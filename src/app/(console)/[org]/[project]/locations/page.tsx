'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { AppShell } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Plus,
  Search,
  Loader2,
  Trash2,
  MapPin,
  Phone,
  Mail,
  Car,
  Zap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLocations, type Location } from '@/modules/location-master'
import { cn } from '@/lib/utils/cn'

export default function LocationsPage() {
  const params = useParams()
  const org = params.org as string
  const project = params.project as string

  const [projectId, setProjectId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddingLocation, setIsAddingLocation] = useState(false)
  const [newLocationName, setNewLocationName] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const supabase = createClient()

  // 프로젝트 ID 조회
  useEffect(() => {
    async function fetchProjectId() {
      const { data } = await supabase
        .from('projects')
        .select('id')
        .eq('slug', project)
        .single<{ id: string }>()

      if (data) {
        setProjectId(data.id)
      }
    }
    fetchProjectId()
  }, [project, supabase])

  const { locations, isLoading, addLocation, updateLocation, deleteLocation } = useLocations(projectId)

  // 검색 필터링
  const filteredLocations = locations.filter(loc => {
    const query = searchQuery.toLowerCase()
    return (
      loc.name.toLowerCase().includes(query) ||
      loc.address?.toLowerCase().includes(query)
    )
  })

  // 새 로케이션 추가
  const handleAddLocation = async () => {
    if (!projectId || !newLocationName.trim()) return

    const newLoc = await addLocation({
      project_id: projectId,
      name: newLocationName.trim(),
    })

    if (newLoc) {
      setExpandedId(newLoc.id)
    }

    setNewLocationName('')
    setIsAddingLocation(false)
  }

  // 로케이션 필드 업데이트
  const handleUpdateLocation = async (id: string, field: string, value: string | boolean | null) => {
    await updateLocation(id, { [field]: value })
  }

  if (isLoading) {
    return (
      <AppShell org={org} project={project} title="로케이션">
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell org={org} project={project} title="로케이션">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">로케이션</h1>
            <p className="text-sm text-muted-foreground">
              총 {locations.length}개 장소
            </p>
          </div>
          <Button onClick={() => setIsAddingLocation(true)}>
            <Plus className="mr-2 h-4 w-4" />
            로케이션 추가
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="장소명, 주소 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Add Location Form */}
        {isAddingLocation && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">새 로케이션 추가</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium">장소명</label>
                  <Input
                    placeholder="예: 강남 카페, 한강공원"
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddLocation()}
                    autoFocus
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={handleAddLocation} disabled={!newLocationName.trim()}>
                    추가
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddingLocation(false)}>
                    취소
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Locations List */}
        <div className="space-y-4">
          {filteredLocations.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {searchQuery ? '검색 결과가 없습니다' : '로케이션을 추가해주세요'}
            </div>
          ) : (
            filteredLocations.map((location) => (
              <Card key={location.id} className="overflow-hidden">
                {/* Header */}
                <div
                  className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-muted/50"
                  onClick={() => setExpandedId(expandedId === location.id ? null : location.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium">{location.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {location.address || '주소 미입력'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {location.parking_available && (
                        <span className="flex items-center gap-1">
                          <Car className="h-4 w-4" /> 주차
                        </span>
                      )}
                      {location.power_available && (
                        <span className="flex items-center gap-1">
                          <Zap className="h-4 w-4" /> 전력
                        </span>
                      )}
                    </div>
                    {expandedId === location.id ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedId === location.id && (
                  <div className="border-t border-border px-4 py-4">
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* 기본 정보 */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-muted-foreground">기본 정보</h4>

                        <div className="space-y-3">
                          <div>
                            <label className="mb-1 block text-xs text-muted-foreground">장소명</label>
                            <Input
                              value={location.name}
                              onChange={(e) => handleUpdateLocation(location.id, 'name', e.target.value)}
                              className="h-9"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs text-muted-foreground">주소</label>
                            <Input
                              value={location.address || ''}
                              onChange={(e) => handleUpdateLocation(location.id, 'address', e.target.value)}
                              placeholder="주소 입력"
                              className="h-9"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs text-muted-foreground">대관료</label>
                            <Input
                              value={location.rental_fee || ''}
                              onChange={(e) => handleUpdateLocation(location.id, 'rental_fee', e.target.value)}
                              placeholder="예: 무료, 50만원/일"
                              className="h-9"
                            />
                          </div>

                          <div className="flex gap-4">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={location.parking_available}
                                onChange={(e) => handleUpdateLocation(location.id, 'parking_available', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300"
                              />
                              <span className="text-sm">주차 가능</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={location.power_available}
                                onChange={(e) => handleUpdateLocation(location.id, 'power_available', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300"
                              />
                              <span className="text-sm">전력 가능</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* 담당자 정보 */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-muted-foreground">담당자 정보</h4>

                        <div className="space-y-3">
                          <div>
                            <label className="mb-1 block text-xs text-muted-foreground">담당자 이름</label>
                            <Input
                              value={location.contact_name || ''}
                              onChange={(e) => handleUpdateLocation(location.id, 'contact_name', e.target.value)}
                              placeholder="담당자 이름"
                              className="h-9"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs text-muted-foreground">연락처</label>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <Input
                                value={location.contact_phone || ''}
                                onChange={(e) => handleUpdateLocation(location.id, 'contact_phone', e.target.value)}
                                placeholder="010-0000-0000"
                                className="h-9"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="mb-1 block text-xs text-muted-foreground">이메일</label>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <Input
                                value={location.contact_email || ''}
                                onChange={(e) => handleUpdateLocation(location.id, 'contact_email', e.target.value)}
                                placeholder="email@example.com"
                                className="h-9"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 사전탐방 노트 */}
                      <div className="space-y-4 md:col-span-2">
                        <h4 className="text-sm font-medium text-muted-foreground">사전탐방 노트</h4>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs text-muted-foreground">조명 (해 위치, 조명 설치)</label>
                            <textarea
                              value={location.lighting_notes || ''}
                              onChange={(e) => handleUpdateLocation(location.id, 'lighting_notes', e.target.value)}
                              placeholder="조명 관련 메모..."
                              className="h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs text-muted-foreground">촬영 (앵글, 제약사항)</label>
                            <textarea
                              value={location.camera_notes || ''}
                              onChange={(e) => handleUpdateLocation(location.id, 'camera_notes', e.target.value)}
                              placeholder="촬영 관련 메모..."
                              className="h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs text-muted-foreground">미술 (소품 배치)</label>
                            <textarea
                              value={location.art_notes || ''}
                              onChange={(e) => handleUpdateLocation(location.id, 'art_notes', e.target.value)}
                              placeholder="미술 관련 메모..."
                              className="h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs text-muted-foreground">음향 (주변 소음)</label>
                            <textarea
                              value={location.sound_notes || ''}
                              onChange={(e) => handleUpdateLocation(location.id, 'sound_notes', e.target.value)}
                              placeholder="음향 관련 메모..."
                              className="h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs text-muted-foreground">일반 메모</label>
                          <textarea
                            value={location.notes || ''}
                            onChange={(e) => handleUpdateLocation(location.id, 'notes', e.target.value)}
                            placeholder="기타 메모..."
                            className="h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <div className="mt-6 flex justify-end border-t border-border pt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => deleteLocation(location.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        삭제
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Quick Add */}
        {!isAddingLocation && locations.length > 0 && (
          <button
            onClick={() => setIsAddingLocation(true)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            로케이션 추가
          </button>
        )}
      </div>
    </AppShell>
  )
}
