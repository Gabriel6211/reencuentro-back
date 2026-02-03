import multer from 'multer'
import { MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from '../services/uploadService'

/**
 * Multer middleware configuration for file uploads
 */
export const upload = multer({
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(
        new Error(
          'Invalid file type. Only images (JPG, JPEG, PNG, WebP) are allowed.'
        )
      )
    }
  },
})
