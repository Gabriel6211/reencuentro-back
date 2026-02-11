import { Response, NextFunction } from 'express'
import { uploadFile } from '../services/uploadService'
import type { AuthenticatedRequest } from './auth'

const MAX_IMAGES = 10

/**
 * Runs after multer when creating a post with multipart/form-data.
 * Uploads each file to R2, sets req.body.image_urls to the returned URLs.
 * If no files, sets req.body.image_urls = [].
 * Supports both multipart (with optional images) and JSON (body already has image_urls).
 */
export async function processPostCreateMultipart(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const files = (req as any).files as Express.Multer.File[] | undefined
    const userId = req.user?.id
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    if (Array.isArray(files) && files.length > 0) {
      if (files.length > MAX_IMAGES) {
        res.status(400).json({
          error: `Maximum ${MAX_IMAGES} images allowed per post`,
        })
        return
      }
      const urls: string[] = []
      for (const file of files) {
        const result = await uploadFile(
          {
            buffer: file.buffer,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
          },
          userId
        )
        urls.push(result.url)
      }
      req.body = req.body || {}
      req.body.image_urls = urls
    } else if (req.is('multipart/form-data')) {
      req.body = req.body || {}
      if (req.body.image_urls === undefined) {
        req.body.image_urls = []
      }
    }

    next()
  } catch (err) {
    console.error('processPostCreateMultipart', err)
    res.status(500).json({
      error: 'Failed to upload images',
      details: err instanceof Error ? err.message : 'Unknown error',
    })
  }
}
