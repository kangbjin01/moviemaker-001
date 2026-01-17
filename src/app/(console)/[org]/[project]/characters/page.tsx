'use client'

import { useState, useEffect, useRef } from 'react'
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
  User,
  Star,
  UserCheck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  useCharacters,
  type CharacterType,
} from '@/modules/character-master'
import { cn } from '@/lib/utils/cn'

// 한글 입력을 위한 EditableInput 컴포넌트
function EditableInput({
  value,
  onSave,
  placeholder,
  className,
}: {
  value: string | null
  onSave: (value: string) => void
  placeholder?: string
  className?: string
}) {
  const [localValue, setLocalValue] = useState(String(value ?? ''))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLocalValue(String(value ?? ''))
  }, [value])

  const handleBlur = () => {
    if (localValue !== String(value ?? '')) {
      onSave(localValue)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur()
    }
  }

  return (
    <Input
      ref={inputRef}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={className}
    />
  )
}

// 캐릭터 타입 아이콘
function CharacterTypeIcon({ type }: { type: CharacterType }) {
  switch (type) {
    case 'main':
      return <Star className="h-4 w-4 text-amber-500" />
    case 'supporting':
      return <UserCheck className="h-4 w-4 text-blue-500" />
    default:
      return <User className="h-4 w-4 text-muted-foreground" />
  }
}

export default function CharactersPage() {
  const params = useParams()
  const org = params.org as string
  const project = params.project as string

  const [projectId, setProjectId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddingCharacter, setIsAddingCharacter] = useState(false)
  const [newCharacterName, setNewCharacterName] = useState('')

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

  const { characters, isLoading, addCharacter, updateCharacter, deleteCharacter } = useCharacters(projectId)

  // 검색 필터링
  const filteredCharacters = characters.filter(char => {
    const query = searchQuery.toLowerCase()
    return (
      char.name.toLowerCase().includes(query) ||
      char.description?.toLowerCase().includes(query)
    )
  })

  // 새 캐릭터 추가
  const handleAddCharacter = async () => {
    if (!projectId || !newCharacterName.trim()) return

    await addCharacter({
      project_id: projectId,
      name: newCharacterName.trim(),
    })

    setNewCharacterName('')
    setIsAddingCharacter(false)
  }

  // 캐릭터 필드 업데이트
  const handleUpdateCharacter = async (id: string, field: string, value: string | null) => {
    await updateCharacter(id, { [field]: value || null })
  }

  if (isLoading) {
    return (
      <AppShell org={org} project={project} title="캐릭터">
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell org={org} project={project} title="캐릭터">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">캐릭터</h1>
            <p className="text-sm text-muted-foreground">
              총 {characters.length}명의 등장인물
            </p>
          </div>
          <Button onClick={() => setIsAddingCharacter(true)}>
            <Plus className="mr-2 h-4 w-4" />
            캐릭터 추가
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="캐릭터명, 설명, 배우명 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Add Character Form */}
        {isAddingCharacter && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">새 캐릭터 추가</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium">캐릭터명</label>
                  <Input
                    placeholder="예: 민수, 영희"
                    value={newCharacterName}
                    onChange={(e) => setNewCharacterName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCharacter()}
                    autoFocus
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={handleAddCharacter} disabled={!newCharacterName.trim()}>
                    추가
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddingCharacter(false)}>
                    취소
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Characters Table */}
        <div className="rounded-lg border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="w-10 px-3 py-3"></th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">캐릭터명</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">설명</th>
                <th className="w-28 px-3 py-3 text-center text-xs font-medium text-muted-foreground">역할</th>
                <th className="w-10 px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredCharacters.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    {searchQuery ? '검색 결과가 없습니다' : '캐릭터를 추가해주세요'}
                  </td>
                </tr>
              ) : (
                filteredCharacters.map((character) => (
                  <tr key={character.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="px-3 py-2">
                      <CharacterTypeIcon type={character.character_type} />
                    </td>
                    <td className="px-3 py-2">
                      <EditableInput
                        value={character.name}
                        onSave={(v) => handleUpdateCharacter(character.id, 'name', v)}
                        className="h-8 w-32 text-sm font-medium"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <EditableInput
                        value={character.description}
                        onSave={(v) => handleUpdateCharacter(character.id, 'description', v)}
                        placeholder="캐릭터 설명"
                        className="h-8 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <select
                        value={character.character_type}
                        onChange={(e) => handleUpdateCharacter(character.id, 'character_type', e.target.value)}
                        className="h-8 w-24 rounded border border-input bg-background px-2 text-sm"
                      >
                        <option value="main">주연</option>
                        <option value="supporting">조연</option>
                        <option value="minor">단역</option>
                        <option value="extra">엑스트라</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                        onClick={() => deleteCharacter(character.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Quick Add */}
        {!isAddingCharacter && characters.length > 0 && (
          <button
            onClick={() => setIsAddingCharacter(true)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            캐릭터 추가
          </button>
        )}
      </div>
    </AppShell>
  )
}
