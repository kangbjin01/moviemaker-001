// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 서버사이드 Supabase 클라이언트 (service role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  try {
    // 공유된 프로젝트 정보 조회
    const { data: project, error: projectError } = await supabase
      .rpc('get_shared_project', { p_share_token: token })
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Invalid or expired share link' }, { status: 404 })
    }

    // 공유된 프로젝트의 파일 목록 조회
    const { data: files, error: filesError } = await supabase
      .rpc('get_shared_project_files', { p_share_token: token })

    if (filesError) {
      return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
    }

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
      },
      files: files || [],
    })
  } catch (err) {
    console.error('Share API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
