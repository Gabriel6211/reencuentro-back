import { Response } from 'express'
import { AuthenticatedRequest } from '../middleware/auth'
import { uploadFile, UploadFileData } from '../services/uploadService'

/**
 * Handles file upload request
 */
export async function uploadFileController(
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' })
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const fileData: UploadFileData = {
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    }

    const result = await uploadFile(fileData, req.user.id)

    return res.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return res.status(500).json({
      error: 'Failed to upload file',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
