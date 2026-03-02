import express from 'express'
import { authenticateUser } from '../middleware/auth'
import { upload } from '../middleware/upload'
import { processPostCreateMultipart } from '../middleware/postCreateMultipart'
import {
  validateCreatePost,
  validatePostId,
  validateUpdatePost,
  validateUpdatePostStatus,
} from '../middleware/posts'
import {
  createPostController,
  getPostsController,
  getPostByIdController,
  updatePostController,
  deletePostController,
  updatePostStatusController,
} from '../controllers/postsController'

const router = express.Router()

const uploadImages = upload.array('images', 10)

/**
 * POST /api/posts
 * Create a new post (lost / found / adoption).
 * Accepts:
 * - multipart/form-data: form fields (title, content, location, post_type, date_lost_or_found, ...) + optional "images" (up to 10 files). Images are uploaded to R2 and URLs saved on the post.
 * - application/json: same fields with image_urls (array of URLs) for pre-uploaded images.
 */
router.post(
  '/',
  authenticateUser,
  (req, res, next) => {
    if (req.is('multipart/form-data')) {
      return uploadImages(req, res, (err: unknown) => {
        if (err) return next(err)
        next()
      })
    }
    next()
  },
  processPostCreateMultipart,
  validateCreatePost,
  createPostController
)

/**
 * GET /api/posts
 * List posts. Query: ?post_type=lost|found|adoption&status=active|found|reunited|adopted
 */
router.get('/', getPostsController)

/**
 * PATCH /api/posts/:id/status
 * Change status: lost→found, found→reunited, adoption→adopted
 * Body: { "status": "found" | "reunited" | "adopted" }
 */
router.patch(
  '/:id/status',
  authenticateUser,
  validatePostId,
  validateUpdatePostStatus,
  updatePostStatusController
)

/**
 * PATCH /api/posts/:id
 * Update post (description, title, image_urls, etc.). Partial update.
 */
router.patch('/:id', authenticateUser, validatePostId, validateUpdatePost, updatePostController)

/**
 * GET /api/posts/:id
 * Get post by id
 */
router.get('/:id', validatePostId, getPostByIdController)

/**
 * DELETE /api/posts/:id
 * Delete a post
 */
router.delete('/:id', authenticateUser, validatePostId, deletePostController)

export default router
