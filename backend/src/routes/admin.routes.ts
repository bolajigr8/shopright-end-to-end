import { Router } from 'express'
import {
  createProduct,
  getAllCustomers,
  getAllOrders,
  getAllProducts,
  getDashboardStats,
  updateOrderStatus,
  updateProduct,
  deleteProduct,
} from '../controllers/admin.controller.js'
import { upload } from '../middleware/multer.middleware.js'
import { adminOnly, protectRoute } from '../middleware/auth.midlleware.js'

const router = Router()

// Apply authentication and admin middleware to all routes
router.use(...protectRoute, adminOnly)

router.post('/products', upload.array('images', 3), createProduct)
router.get('/products', getAllProducts)
router.put('/products/:id', upload.array('images', 3), updateProduct)
router.delete('/products/:id', deleteProduct)

router.get('/orders', getAllOrders)
router.patch('/orders/:orderId/status', updateOrderStatus)

router.get('/customers', getAllCustomers)

router.get('/stats', getDashboardStats)

export default router
