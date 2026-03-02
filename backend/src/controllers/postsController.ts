import { Response } from 'express'
import {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  updatePostStatus,
  GetPostsFilters,
} from '../services/postsService'
import { Post, PostStatus, PostType } from '../types'
import { AuthenticatedRequest } from '../middleware/auth'

export async function createPostController(req: AuthenticatedRequest, res: Response) {
  try {
    const post = req.body as Post
    const userId = req.user?.id
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    const result = await createPost(post, userId)
    res.status(201).json(result)
  } catch (err) {
    console.error('createPost', err)
    res.status(500).json({ error: 'Failed to create post' })
  }
}

export async function getPostsController(req: AuthenticatedRequest, res: Response) {
  try {
    const filters: GetPostsFilters = {}
    const postType = req.query.post_type as string | undefined
    const status = req.query.status as string | undefined
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const offset = (page - 1) * limit
    if (postType && ['lost', 'found', 'adoption'].includes(postType)) {
      filters.post_type = postType as PostType
    }
    if (status && ['active', 'found', 'reunited', 'adopted'].includes(status)) {
      filters.status = status as PostStatus
    }
    const result = await getPosts(filters, offset, limit)
    res.status(200).json(result)
  } catch (err) {
    console.error('getPosts', err)
    res.status(500).json({ error: 'Failed to get posts' })
  }
}

export async function getPostByIdController(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string
    const result = await getPostById(id)
    if (!result) {
      res.status(404).json({ error: 'Post not found' })
      return
    }
    res.status(200).json(result)
  } catch (err) {
    console.error('getPostById', err)
    res.status(500).json({ error: 'Failed to get post' })
  }
}

export async function updatePostController(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string
    const updates = req.body as Partial<Post>
    const result = await updatePost(id, updates)
    if (!result) {
      res.status(404).json({ error: 'Post not found' })
      return
    }
    res.status(200).json(result)
  } catch (err) {
    console.error('updatePost', err)
    res.status(500).json({ error: 'Failed to update post' })
  }
}

export async function deletePostController(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string
    const deleted = await deletePost(id)
    if (!deleted) {
      res.status(404).json({ error: 'Post not found' })
      return
    }
    res.status(200).json({ message: 'Post deleted' })
  } catch (err) {
    console.error('deletePost', err)
    res.status(500).json({ error: 'Failed to delete post' })
  }
}

export async function updatePostStatusController(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string
    const status = (req.body as { status: PostStatus }).status
    const result = await updatePostStatus(id, status)
    res.status(200).json(result)
  } catch (err: unknown) {
    const e = err as Error & { statusCode?: number }
    console.error('updatePostStatus', err)
    if (e.statusCode === 404) {
      res.status(404).json({ error: e.message ?? 'Post not found' })
      return
    }
    if (e.statusCode === 400) {
      res.status(400).json({ error: e.message ?? 'Invalid status transition' })
      return
    }
    res.status(500).json({ error: 'Failed to update post status' })
  }
}
