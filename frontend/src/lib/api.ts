// Force cache invalidation - timestamp: 2025-08-07T15:05:00Z
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-2isonl1nx-volodeveths-projects.vercel.app'

// Log API URL for debugging
if (typeof window !== 'undefined') {
  console.log('🔗 API Configuration:', {
    API_BASE_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    fallback: 'https://backend-xzycmpb2o-volodeveths-projects.vercel.app'
  })
}

// Helper function to get auth headers
export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  return headers
}

// Authenticated fetch wrapper
export async function authenticatedFetch(endpoint: string, options: RequestInit = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`
  
  console.log('🌐 authenticatedFetch called:', {
    endpoint,
    API_BASE_URL,
    finalUrl: url,
    method: options.method || 'GET'
  })
  
  return fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  })
}

// API endpoints
export const api = {
  // Authentication
  auth: {
    getNonce: (address: string) => 
      fetch(`${API_BASE_URL}/api/auth/nonce/${address}`),
    
    register: (data: { address: string; email: string; username: string; signature: string }) =>
      authenticatedFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    login: (data: { address: string; signature: string }) =>
      authenticatedFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    getSession: () =>
      authenticatedFetch('/api/auth/session'),
    
    verifyEmail: (token: string) =>
      authenticatedFetch('/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token }),
      }),
  },
  
  // Users
  users: {
    getZrmBalance: (address: string) =>
      fetch(`${API_BASE_URL}/api/users/balance/${address}`),
  },
  
  // Collections (v2.0 - Factory + ERC-1155)
  collections: {
    // Get all collections with filters
    getAll: (params?: {
      chainId?: number;
      creator?: string;
      isPersonal?: boolean;
      sort?: 'newest' | 'oldest' | 'name' | 'activity';
      page?: number;
      limit?: number;
    }) => {
      const searchParams = new URLSearchParams()
      if (params?.chainId) searchParams.append('chainId', params.chainId.toString())
      if (params?.creator) searchParams.append('creator', params.creator)
      if (params?.isPersonal !== undefined) searchParams.append('isPersonal', params.isPersonal.toString())
      if (params?.sort) searchParams.append('sort', params.sort)
      if (params?.page) searchParams.append('page', params.page.toString())
      if (params?.limit) searchParams.append('limit', params.limit.toString())
      
      const query = searchParams.toString()
      return fetch(`${API_BASE_URL}/api/collections${query ? '?' + query : ''}`)
    },
    
    // Get collection by contract address
    getByAddress: (contractAddress: string) =>
      fetch(`${API_BASE_URL}/api/collections/contract/${contractAddress}`),
    
    // Get collections by creator address
    getByCreator: (address: string, page?: number, limit?: number) => {
      const params = new URLSearchParams()
      if (page) params.append('page', page.toString())
      if (limit) params.append('limit', limit.toString())
      
      const query = params.toString()
      return fetch(`${API_BASE_URL}/api/collections/user/${address}${query ? '?' + query : ''}`)
    },
    
    // Create new collection via factory
    create: (data: {
      name: string;
      symbol: string;
      description?: string;
      chainId: number;
      isPersonal?: boolean;
    }) =>
      authenticatedFetch('/api/collections/create', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    // Create personal collection with first NFT
    createPersonal: (data: {
      nftName: string;
      tokenURI: string;
      chainId: number;
      customPrice?: string;
      mintEndTime?: number;
    }) =>
      authenticatedFetch('/api/collections/create-personal', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    // Update collection metadata
    update: (contractAddress: string, data: {
      description?: string;
      image?: string;
      banner?: string;
      website?: string;
      discord?: string;
      twitter?: string;
    }) =>
      authenticatedFetch(`/api/collections/contract/${contractAddress}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    // Get collection NFTs (supports both legacy NFTs and new tokens)
    getNFTs: (id: string, page?: number, limit?: number) => {
      const params = new URLSearchParams()
      if (page) params.append('page', page.toString())
      if (limit) params.append('limit', limit.toString())
      
      const query = params.toString()
      return fetch(`${API_BASE_URL}/api/collections/${id}/nfts${query ? '?' + query : ''}`)
    },
    
    // Legacy support - get collection by UUID
    getById: (id: string) =>
      fetch(`${API_BASE_URL}/api/collections/${id}`),
    
    // Legacy support - update collection by UUID
    updateById: (id: string, data: {
      description?: string;
      image?: string;
      banner?: string;
      website?: string;
      discord?: string;
      twitter?: string;
    }) =>
      authenticatedFetch(`/api/collections/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },
  
  // NFTs
  nfts: {
    getAll: () => fetch(`${API_BASE_URL}/api/v1/nfts`),
    getTrending: () => fetch(`${API_BASE_URL}/api/v1/nfts/trending`),
    getById: (id: string) => fetch(`${API_BASE_URL}/api/v1/nfts/${id}`),
    like: (id: string, userAddress: string) =>
      authenticatedFetch(`/api/v1/nfts/${id}/like`, {
        method: 'POST',
        body: JSON.stringify({ userAddress }),
      }),
    
    mint: (data: {
      tokenId: string;
      contractAddress: string;
      chainId: number;
      name: string;
      description?: string;
      image: string;
      animationUrl?: string;
      attributes?: any[];
      creatorAddress: string;
      ownerAddress?: string;
      collectionId?: string;
      price?: string;
      currency?: string;
      maxSupply?: number;
      mintPrice?: string;
    }) =>
      authenticatedFetch('/api/v1/nfts/mint', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    // ERC-1155 token management (new v2.0 endpoints)
    createToken: (collectionAddress: string, data: {
      tokenURI: string;
      customPrice?: string;
      mintEndTime?: number;
    }) =>
      authenticatedFetch(`/api/v1/tokens/create`, {
        method: 'POST',
        body: JSON.stringify({ ...data, collectionAddress }),
      }),
    
    mintToken: (data: {
      collectionAddress: string;
      tokenId: string;
      amount: number;
      to: string;
      referrer?: string;
      value: string; // ETH value in wei
    }) =>
      authenticatedFetch('/api/v1/tokens/mint', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    getTokenInfo: (collectionAddress: string, tokenId: string) =>
      fetch(`${API_BASE_URL}/api/v1/tokens/${collectionAddress}/${tokenId}`),
    
    getTokenBalance: (collectionAddress: string, tokenId: string, owner: string) =>
      fetch(`${API_BASE_URL}/api/v1/tokens/${collectionAddress}/${tokenId}/balance/${owner}`),
  },
  
  // File Upload
  upload: {
    file: (file: string, name: string = 'file', type: string = 'image', useIPFS: boolean = true) =>
      authenticatedFetch('/api/upload', {
        method: 'POST',
        body: JSON.stringify({ file, name, type, useIPFS }),
      }),
    
    nftMetadata: (data: {
      name: string;
      description: string;
      imageFile: string;
      creatorAddress: string;
      attributes?: Array<{ trait_type: string; value: string | number }>;
      collection?: string;
      external_url?: string;
    }) => {
      console.log('🎯 nftMetadata called with API_BASE_URL:', API_BASE_URL)
      console.log('🌍 Environment:', {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NODE_ENV: process.env.NODE_ENV
      })
      
      return authenticatedFetch('/api/upload/nft-metadata', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
  },
  
  // Search
  search: {
    all: (query: string, limit: number = 20, offset: number = 0) =>
      fetch(`${API_BASE_URL}/api/v1/search?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`),
    
    nfts: (query: string, limit: number = 20, offset: number = 0) =>
      fetch(`${API_BASE_URL}/api/v1/search?q=${encodeURIComponent(query)}&type=nfts&limit=${limit}&offset=${offset}`),
    
    users: (query: string, limit: number = 20, offset: number = 0) =>
      fetch(`${API_BASE_URL}/api/v1/search?q=${encodeURIComponent(query)}&type=users&limit=${limit}&offset=${offset}`),
    
    collections: (query: string, limit: number = 20, offset: number = 0) =>
      fetch(`${API_BASE_URL}/api/v1/search?q=${encodeURIComponent(query)}&type=collections&limit=${limit}&offset=${offset}`),
  },
  
  // Analytics
  analytics: {
    getStats: () => fetch(`${API_BASE_URL}/api/v1/analytics/stats`),
    getViews: (period: string = '7d', nftId?: string) => {
      const params = new URLSearchParams({ period })
      if (nftId) params.append('nftId', nftId)
      return fetch(`${API_BASE_URL}/api/v1/analytics/views?${params}`)
    },
  },
  
  // View Tracking
  views: {
    track: (nftId: string, userAddress?: string, sessionId?: string) =>
      authenticatedFetch(`/api/v1/nfts/${nftId}/view`, {
        method: 'POST',
        body: JSON.stringify({ userAddress, sessionId }),
      }),
  },
  
  // Admin
  admin: {
    getStats: (adminAddress: string) =>
      authenticatedFetch('/api/v1/admin/stats', {
        headers: {
          ...getAuthHeaders(),
          'x-admin-address': adminAddress,
        },
      }),
    
    getFeeHistory: (adminAddress: string, limit = 50) =>
      authenticatedFetch(`/api/v1/admin/fee-history?limit=${limit}`, {
        headers: {
          ...getAuthHeaders(),
          'x-admin-address': adminAddress,
        },
      }),
    
    depositZRM: (adminAddress: string, amount: number, transactionHash: string) =>
      authenticatedFetch('/api/v1/admin/zrm/deposit', {
        method: 'POST',
        body: JSON.stringify({ amount, transactionHash }),
        headers: {
          ...getAuthHeaders(),
          'x-admin-address': adminAddress,
        },
      }),
    
    allocateZRM: (adminAddress: string, toAddress: string, amount: number, reason: string) =>
      authenticatedFetch('/api/v1/admin/zrm/allocate', {
        method: 'POST',
        body: JSON.stringify({ toAddress, amount, reason }),
        headers: {
          ...getAuthHeaders(),
          'x-admin-address': adminAddress,
        },
      }),
    
    withdraw: (adminAddress: string, type: 'ETH' | 'ZRM', amount: number, recipientAddress: string) =>
      authenticatedFetch('/api/v1/admin/withdraw', {
        method: 'POST',
        body: JSON.stringify({ type, amount, recipientAddress }),
        headers: {
          ...getAuthHeaders(),
          'x-admin-address': adminAddress,
        },
      }),
    
    cleanZRMData: (adminAddress: string) =>
      authenticatedFetch('/api/v1/admin/zrm/cleanup', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'x-admin-address': adminAddress,
        },
      }),
  },
}

export default api