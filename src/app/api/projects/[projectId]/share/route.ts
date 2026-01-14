// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 공유 링크 상태 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const supabase = await createClient()

  const { data: project, error } = await supabase
    .from('projects')
    .select('share_token, share_enabled')
    .eq('id', projectId)
    .single()

  if (error || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  return NextResponse.json({
    shareToken: project.share_token,
    shareEnabled: project.share_enabled || false,
  })
}

// 공유 링크 생성/토글
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const { action } = await request.json() // 'enable', 'disable', 'regenerate'
  const supabase = await createClient()

  // 현재 프로젝트 조회
  const { data: project, error: fetchError } = await supabase
    .from('projects')
    .select('share_token, share_enabled')
    .eq('id', projectId)
    .single()

  if (fetchError || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  let updateData: { share_token?: string; share_enabled?: boolean } = {}

  if (action === 'enable') {
    // 공유 활성화 (토큰 없으면 새로 생성)
    updateData.share_enabled = true
    if (!project.share_token) {
      updateData.share_token = crypto.randomUUID()
    }
  } else if (action === 'disable') {
    // 공유 비활성화
    updateData.share_enabled = false
  } else if (action === 'regenerate') {
    // 토큰 재생성
    updateData.share_token = crypto.randomUUID()
    updateData.share_enabled = true
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const { data: updated, error: updateError } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', projectId)
    .select('share_token, share_enabled')
    .single()

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update share settings' }, { status: 500 })
  }

  return NextResponse.json({
    shareToken: updated.share_token,
    shareEnabled: updated.share_enabled,
  })
}
