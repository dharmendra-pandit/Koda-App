import { Router } from 'express'
import {
  getMe,
  updateProfile,
  uploadAvatar,
  searchUsers,
  getUserById,
  followUser,
  unfollowUser,
  getUserDoubts,
  getFeed,
  getFollowers,
  getFollowing,
  getUserFeed,
} from '../controllers/user.controller.js'
import authMiddleware from '../middlewares/auth.js'
import validateRequest, { validateQuery } from '../middlewares/validate.js'
import upload from '../middlewares/upload.js'
import {
  updateProfileSchema,
  searchSchema,
} from '../validators/user.validator.js'

const router = Router()

// All routes require authentication
router.use(authMiddleware)

router.get('/me', getMe)
router.get('/feed', getFeed)
router.put('/update', validateRequest(updateProfileSchema), updateProfile)
router.post('/avatar', upload.single('avatar'), uploadAvatar)
router.get('/search', validateQuery(searchSchema), searchUsers)
router.get('/:id', getUserById)
router.get('/:id/doubts', getUserDoubts)
router.post('/:id/follow', followUser)
router.post('/:id/unfollow', unfollowUser)
router.get('/:id/followers', getFollowers)
router.get('/:id/following', getFollowing)
router.get('/:id/feed', getUserFeed)

export default router
