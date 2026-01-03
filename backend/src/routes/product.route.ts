import { Router } from 'express'
import { getAllProducts } from '../controllers/admin.controller.js'
import { protectRoute } from '../middleware/auth.midlleware.js'
import { getProductById } from '../controllers/products.controller.js'

const router = Router()

router.get('/', protectRoute, getAllProducts)
router.get('/:id', protectRoute, getProductById)

export default router
