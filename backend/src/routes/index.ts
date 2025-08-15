import { Router } from 'express'
import authRoutes from './auth'
import userRoutes from './users'
import nftRoutes from './nfts'
import collectionRoutes from './collections'
import searchRoutes from './search'
import analyticsRoutes from './analytics'

const router = Router()

// API version prefix
const API_VERSION = '/api/v1'

// Mount all routes
router.use(`${API_VERSION}/auth`, authRoutes)
router.use(`${API_VERSION}/users`, userRoutes)
router.use(`${API_VERSION}/nfts`, nftRoutes)
router.use(`${API_VERSION}/collections`, collectionRoutes)
router.use(`${API_VERSION}/search`, searchRoutes)
router.use(`${API_VERSION}/analytics`, analyticsRoutes)

// Health check route (no version prefix)
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Zorium Backend API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    apiVersion: 'v1',
    endpoints: {
      auth: `${API_VERSION}/auth`,
      users: `${API_VERSION}/users`,
      nfts: `${API_VERSION}/nfts`,
      collections: `${API_VERSION}/collections`,
      search: `${API_VERSION}/search`,
      analytics: `${API_VERSION}/analytics`
    }
  })
})

// API info route
router.get(`${API_VERSION}`, (req, res) => {
  res.json({
    name: 'Zorium Backend API',
    version: '1.0.0',
    description: 'Backend API for Zorium.fun NFT platform',
    endpoints: {
      auth: {
        'POST /auth/nonce/:address': 'Get nonce for wallet signature',
        'POST /auth/register': 'Register new user with wallet signature',
        'POST /auth/login': 'Login with wallet signature',
        'GET /auth/session': 'Get current session (requires auth)',
        'POST /auth/refresh': 'Refresh access token',
        'POST /auth/logout': 'Logout user'
      },
      users: {
        'GET /users/:address': 'Get user by address',
        'PUT /users/:address': 'Update user profile (requires auth)',
        'GET /users/:address/nfts': 'Get user NFTs',
        'GET /users/:address/collections': 'Get user collections',
        'POST /users/:address/follow': 'Toggle follow user (requires auth)',
        'GET /users/:address/followers': 'Get user followers',
        'GET /users/:address/following': 'Get users being followed',
        'GET /users/:address/stats': 'Get user statistics',
        'GET /users/search': 'Search users'
      },
      nfts: {
        'POST /nfts': 'Create NFT (requires auth)',
        'GET /nfts': 'List NFTs with filters',
        'GET /nfts/trending': 'Get trending NFTs',
        'GET /nfts/:id': 'Get NFT by ID',
        'PUT /nfts/:id': 'Update NFT (requires auth)',
        'DELETE /nfts/:id': 'Delete NFT (requires auth)',
        'POST /nfts/:id/like': 'Toggle like NFT (requires auth)',
        'GET /nfts/:id/comments': 'Get NFT comments',
        'POST /nfts/:id/comments': 'Add comment to NFT (requires auth)',
        'PUT /nfts/comments/:commentId': 'Update comment (requires auth)',
        'DELETE /nfts/comments/:commentId': 'Delete comment (requires auth)',
        'POST /nfts/:id/transfer': 'Transfer NFT ownership (requires auth)'
      },
      collections: {
        'POST /collections': 'Create collection (requires auth)',
        'GET /collections': 'List collections with filters',
        'GET /collections/trending': 'Get trending collections',
        'GET /collections/:id': 'Get collection by ID',
        'PUT /collections/:id': 'Update collection (requires auth)',
        'DELETE /collections/:id': 'Delete collection (requires auth)',
        'GET /collections/:id/nfts': 'Get collection NFTs',
        'GET /collections/:id/stats': 'Get collection statistics',
        'GET /collections/search': 'Search collections'
      },
      search: {
        'GET /search': 'Global search across all content',
        'GET /search/nfts': 'Advanced NFT search',
        'GET /search/suggestions': 'Get search suggestions',
        'GET /search/popular': 'Get popular search terms',
        'POST /search/attributes': 'Search NFTs by attributes'
      },
      analytics: {
        'GET /analytics/platform': 'Get platform statistics',
        'GET /analytics/users/growth': 'Get user growth analytics',
        'GET /analytics/marketplace': 'Get marketplace analytics',
        'GET /analytics/engagement': 'Get user engagement analytics',
        'GET /analytics/trending': 'Get trending data for homepage',
        'GET /analytics/admin': 'Get admin analytics (admin only)'
      }
    }
  })
})

export default router