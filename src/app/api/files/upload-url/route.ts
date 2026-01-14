import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getR2Client, R2_BUCKET } from '@/lib/r2/client'

export async function POST(request: NextRequest) {
  try {
    const { fileName, contentType, storagePath } = await request.json()

    if (!fileName || !storagePath) {
      return NextResponse.json(
        { error: 'fileName and storagePath are required' },
        { status: 400 }
      )
    }

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: storagePath,
      ContentType: contentType || 'application/octet-stream',
    })

    const signedUrl = await getSignedUrl(getR2Client(), command, { expiresIn: 3600 })

    return NextResponse.json({ uploadUrl: signedUrl })
  } catch (error) {
    console.error('Failed to generate upload URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    )
  }
}
