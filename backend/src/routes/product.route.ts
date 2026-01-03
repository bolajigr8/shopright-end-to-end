import { Router } from 'express'
import { protectRoute } from '../middleware/auth.midlleware.js'
import { getProductById } from '../controllers/products.controller.js'
import { getAllProducts } from '../controllers/admin.controller.js'

const router = Router()

router.get('/', protectRoute, getAllProducts)
router.get('/:id', protectRoute, getProductById)

export default router
