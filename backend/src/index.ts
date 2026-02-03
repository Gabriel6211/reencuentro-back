import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { readdirSync } from 'fs'
import { join } from 'path'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Dynamically load all routes
async function loadRoutes() {
  const routesPath = join(__dirname, 'routes')
  const routeFiles = readdirSync(routesPath).filter(
    file => (file.endsWith('.ts') || file.endsWith('.js')) && file !== 'index.ts' && file !== 'index.js'
  )

  const routePromises = routeFiles.map(async (file) => {
    const routeName = file.replace(/\.(ts|js)$/, '')
    const routePath = `/api/${routeName}`
    
    try {
      // Remove .ts/.js extension for import (works in both dev and production)
      const routeModule = await import(`./routes/${routeName}`)
      if (routeModule.default) {
        app.use(routePath, routeModule.default)
        console.log(`✅ Route registered: ${routePath}`)
      } else {
        console.warn(`⚠️  Route ${routeName} does not export a default router`)
      }
    } catch (error) {
      console.error(`❌ Failed to load route ${routePath}:`, error)
    }
  })

  await Promise.all(routePromises)
}

// Start server after routes are loaded
loadRoutes().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`)
    console.log(`📡 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`)
  })
}).catch((error) => {
  console.error('Failed to load routes:', error)
  process.exit(1)
})
