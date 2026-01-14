import { S3Client } from '@aws-sdk/client-s3'

// Lazy initialization to avoid build-time errors
let _r2Client: S3Client | null = null

export function getR2Client() {
  if (!_r2Client) {
    _r2Client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })
  }
  return _r2Client
}

// Keep the old export for backwards compatibility (but prefer getR2Client)
export const r2Client = {
  get client() {
    return getR2Client()
  }
}

export const R2_BUCKET = process.env.R2_BUCKET_NAME || ''
