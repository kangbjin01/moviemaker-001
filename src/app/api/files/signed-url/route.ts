import { NextRequest, NextResponse } from 'next/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { r2Client, R2_BUCKET } from '@/lib/r2/client'

export async function POST(request: NextRequest) {
  try {
    const { storagePath, expiresIn = 3600 } = await request.json()

    if (!storagePath) {
      return NextResponse.json(
        { error: 'storagePath is required' },
        { status: 400 }
      )
    }

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: storagePath,
    })

    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn })

    return NextResponse.json({ signedUrl })
  } catch (error) {
    console.error('Failed to generate signed URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate signed URL' },
      { status: 500 }
    )
  }
}
