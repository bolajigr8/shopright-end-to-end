import { Router } from 'express'
import { protectRoute } from '../middleware/auth.midlleware.js'
import {
  createReview,
  deleteReview,
} from '../controllers/reviews.controller.js'

const router = Router()

router.use(protectRoute)

router.post('/', createReview)
router.delete('/:reviewId', deleteReview)

export default router
