// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { r2Client, R2_BUCKET } from '@/lib/r2/client'

// 서버사이드 Supabase 클라이언트 (service role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const { storagePath } = await request.json()

  if (!token || !storagePath) {
    return NextResponse.json({ error: 'Token and storagePath are required' }, { status: 400 })
  }

  try {
    // 공유 토큰이 유효한지 확인
    const { data: project, error: projectError } = await supabase
      .rpc('get_shared_project', { p_share_token: token })
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Invalid or expired share link' }, { status: 404 })
    }

    // 해당 파일이 이 프로젝트에 속하는지 확인
    const { data: file, error: fileError } = await supabase
      .from('project_files')
      .select('id')
      .eq('project_id', project.id)
      .eq('storage_path', storagePath)
      .is('deleted_at', null)
      .single()

    if (fileError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // R2 signed URL 생성 (짧은 만료 시간 - 뷰어용)
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: storagePath,
    })

    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 1800 }) // 30분

    return NextResponse.json({ signedUrl })
  } catch (err) {
    console.error('Share signed URL error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
