import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { ENV } from './config/env.js'
import { connectDB } from './config/db.js'
import { clerkMiddleware } from '@clerk/express'
import { functions, inngest } from './config/inngest.js'
import { serve } from 'inngest/express'
import adminRoutes from './routes/admin.route.js'
import userRoutes from './routes/user.route.js'
import orderRoutes from './routes/order.route.js'
import reviewsRoutes from './routes/review.route.js'
import productsRoutes from './routes/product.route.js'
import cartRoutes from './routes/cart.route.js'
import cors from 'cors'

const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(express.json())
// adds auth object under the request
app.use(clerkMiddleware())

// Inngest webhook endpoint
app.use('/api/inngest', serve({ client: inngest, functions }))

app.use(cors({ origin: ENV.CLIENT_URL, credentials: true })) // credentials: true allows the browser to send the cookies to the server with the request

app.use('/api/admin', adminRoutes)
app.use('/api/users', userRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/reviews', reviewsRoutes)
app.use('/api/products', productsRoutes)
app.use('/api/cart', cartRoutes)

app.get('/api/health', (req, res) => {
  res.send('Hello, World!')
})

// Make our app ready for deployment
// Serve admin (React/Vite) build as static assets
if (ENV.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../admin/dist')))

  app.get('/{*any}', (req, res) => {
    res.sendFile(path.join(__dirname, '../../admin/dist/index.html'), (err) => {
      if (err) {
        res.status(500).send('Error loading application')
      }
    })
  })
}

const PORT = ENV.PORT || '3000'

// Connect to MongoDB before starting server
connectDB()
  .then(() => {
    console.log('Database is connected')
    app.listen(PORT, () => {
      console.log(`Server is running on port ${ENV.PORT}`)
    })
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err)
    process.exit(1)
  })
