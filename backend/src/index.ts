import express from 'express'
import { ENV } from './config/env'
import path from 'path'

const app = express()

const currentDir = path.resolve()

app.get('/api/health', (req, res) => {
  res.send('Hello, World!')
})

// Make our app ready for deployment
// Serve admin (React/Vite) build as static assets
if (ENV.NODE_ENV === 'production') {
  app.use(express.static(path.join(currentDir, '../admin/dist')))

  app.get('/{*any}', (req, res) => {
    res.sendFile(path.join(currentDir, '../admin', 'dist', 'index.html'))
  })
}

app.listen(ENV.PORT, () => {
  console.log(`Server is running on port ${ENV.PORT}`)
  console.log(`Dirname  ${currentDir}`)
})
