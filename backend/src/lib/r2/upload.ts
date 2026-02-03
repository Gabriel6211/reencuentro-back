import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getR2Client } from './client'

function getBucketName(): string {
  const bucketName = process.env.R2_BUCKET_NAME
  if (!bucketName) {
    throw new Error('R2_BUCKET_NAME is not set in your .env file')
  }
  return bucketName
}

export interface UploadOptions {
  key: string
  body: Buffer | Uint8Array | string
  contentType?: string
  metadata?: Record<string, string>
}

/**
 * Upload a file to R2 bucket
 */
export async function uploadToR2(options: UploadOptions): Promise<string> {
  const { key, body, contentType, metadata } = options
  const client = getR2Client()

  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    Body: body,
    ContentType: contentType,
    Metadata: metadata,
  })

  await client.send(command)

  // Return the public URL if R2_PUBLIC_URL is set, otherwise return the key
  const publicUrl = process.env.R2_PUBLIC_URL
  if (publicUrl) {
    return `${publicUrl}/${key}`
  }

  return key
}
