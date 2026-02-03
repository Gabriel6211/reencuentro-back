import { uploadToR2 } from '../lib/r2/upload'

// Configuration constants
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]

export const VALID_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']

export interface UploadFileData {
  buffer: Buffer
  originalname: string
  mimetype: string
  size: number
}

export interface UploadResult {
  url: string
  key: string
  size: number
  type: string
}

/**
 * Validates file extension matches MIME type
 */
export function validateFileExtension(filename: string): boolean {
  const fileExtension = filename.split('.').pop()?.toLowerCase()
  return fileExtension !== undefined && VALID_EXTENSIONS.includes(fileExtension)
}

/**
 * Generates a unique, secure key for the file
 * Format: user_id/timestamp-randomhash.extension
 */
export function generateFileKey(userId: string, originalName: string): string {
  const timestamp = Date.now()
  const randomHash = Math.random().toString(36).substring(2, 15)
  const sanitizedFileName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `uploads/${userId}/${timestamp}-${randomHash}-${sanitizedFileName}`
}

/**
 * Uploads a file to R2 bucket
 */
export async function uploadFile(
  file: UploadFileData,
  userId: string
): Promise<UploadResult> {
  // Validate file extension
  if (!validateFileExtension(file.originalname)) {
    throw new Error('Invalid file extension.')
  }

  // Generate file key
  const key = generateFileKey(userId, file.originalname)

  // Upload to R2 with user metadata
  const url = await uploadToR2({
    key,
    body: file.buffer,
    contentType: file.mimetype,
    metadata: {
      originalName: file.originalname,
      uploadedBy: userId,
      uploadedAt: new Date().toISOString(),
      fileSize: file.size.toString(),
    },
  })

  return {
    url,
    key,
    size: file.size,
    type: file.mimetype,
  }
}
