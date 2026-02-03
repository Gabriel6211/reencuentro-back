import express from 'express'
import { authenticateUser } from '../middleware/auth'
import { upload } from '../middleware/upload'
import { uploadFileController } from '../controllers/uploadController'

const router = express.Router()

/**
 * POST /api/upload
 * Upload a file to R2 bucket
 * Requires authentication
 */
router.post(
  '/',
  authenticateUser,
  upload.single('file'),
  uploadFileController
)

export default router
