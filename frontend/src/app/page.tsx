'use client'

import Link from 'next/link'
import { TrendingUp, Users, DollarSign, Zap, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import NFTCard from '@/components/nft/NFTCard'
import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'

// Transform backend NFT to frontend format
const transformNFT = (nft: any, promoted: boolean = false) => ({
  id: nft.id,
  title: nft.name,
  creator: nft.creator?.username || nft.creator?.displayName || `${nft.creator?.address?.slice(0, 6)}...${nft.creator?.address?.slice(-4)}`,
  creatorAddress: nft.creator?.address || '0x0000...0000',
  image: nft.image || '/images/placeholder-nft.jpg',
  price: nft.price?.toString() || '0.000111',
  promoted,
  likes: nft.likeCount || 0,
  mints: Math.floor(Math.random() * 30) + 1, // Random for demo
  networkId: 8453, // Default to Base
  contractAddress: nft.contractAddress || `0x${Math.random().toString(16).substr(2, 40)}`,
  tokenId: nft.tokenId || Math.floor(Math.random() * 10000).toString()
})


// Shuffle array function
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

interface PlatformStats {
  totalNFTs: number
  activeUsers: number
  volume24h: number
  volume7d: number
}

export default function HomePage() {
  const [latestNFTs, setLatestNFTs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [featuredNFTs, setFeaturedNFTs] = useState<any[]>([])
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0)
  const [stats, setStats] = useState<PlatformStats>({
    totalNFTs: 0,
    activeUsers: 0,
    volume24h: 0,
    volume7d: 0
  })
  const [error, setError] = useState<string | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)

  // Load data on component mount
  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      setInitialLoading(true)
      setError(null)
      
      // Fetch NFTs and stats in parallel
      const [nftsResponse, statsResponse] = await Promise.all([
        api.nfts.getAll(),
        api.analytics.getStats()
      ])
      
      // Process NFTs
      if (nftsResponse.ok) {
        const nftsData = await nftsResponse.json()
        const allNFTs = nftsData.nfts || []
        
        // Separate featured (first 6) and latest NFTs
        const featuredData = allNFTs.slice(0, 6).map((nft: any) => transformNFT(nft, true))
        const latestData = allNFTs.slice(6, 26).map((nft: any) => transformNFT(nft, false))
        
        setFeaturedNFTs(shuffleArray(featuredData))
        setLatestNFTs(latestData)
      } else {
        setError('Failed to load NFTs')
      }
      
      // Process stats
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats({
          totalNFTs: statsData.totalNFTs || 0,
          activeUsers: statsData.activeUsers || 0,
          volume24h: statsData.volume24h || 0,
          volume7d: statsData.volume7d || 0
        })
      } else {
        // Use default stats if API fails
        setStats({
          totalNFTs: 150,
          activeUsers: 85,
          volume24h: 12.34,
          volume7d: 89.01
        })
      }
      
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Error connecting to backend')
      
      // Set default stats on error
      setStats({
        totalNFTs: 150,
        activeUsers: 85,
        volume24h: 12.34,
        volume7d: 89.01
      })
    } finally {
      setInitialLoading(false)
    }
  }

  const loadMoreNFTs = useCallback(async () => {
    if (loading) return
    
    setLoading(true)
    
    try {
      // Fetch more NFTs from API 
      const response = await api.nfts.getAll()
      
      if (response.ok) {
        const data = await response.json()
        const allNFTs = data.nfts || []
        
        // Get next batch of NFTs (skip already loaded ones)
        const startIndex = latestNFTs.length + 6 // +6 for featured NFTs
        const newNFTs = allNFTs.slice(startIndex, startIndex + 20).map((nft: any) => transformNFT(nft, false))
        
        if (newNFTs.length > 0) {
          setLatestNFTs(prev => [...prev, ...newNFTs])
        }
      }
    } catch (err) {
      console.error('Error loading more NFTs:', err)
    } finally {
      setLoading(false)
    }
  }, [loading, latestNFTs.length])

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop + 1000 >=
        document.documentElement.scrollHeight
      ) {
        if (!loading) {
          loadMoreNFTs()
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loading, loadMoreNFTs])

  // Carousel navigation functions
  const nextSlide = () => {
    setCurrentCarouselIndex((prev) => 
      prev >= featuredNFTs.length - 2 ? 0 : prev + 1
    )
  }

  const prevSlide = () => {
    setCurrentCarouselIndex((prev) => 
      prev <= 0 ? Math.max(0, featuredNFTs.length - 2) : prev - 1
    )
  }

  // Get current pair of NFTs for display
  const getCurrentNFTPair = () => {
    if (featuredNFTs.length === 0) return []
    return featuredNFTs.slice(currentCarouselIndex, currentCarouselIndex + 2)
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-purple-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">Loading Zorium.fun...</h2>
          <p className="text-text-secondary">Fetching the latest NFTs and platform data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Error Banner */}
      {error && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs">!</span>
            </div>
            <p className="text-yellow-700 dark:text-yellow-300 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Hero Section - Split Layout */}
      <section className="relative py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Text Content */}
            <div className="text-left">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                <span className="gradient-text">Create & Discover</span>
                <br />
                <span className="text-text-primary">NFTs on ZORIUM.FUN</span>
              </h1>
              <p className="text-lg text-text-secondary mb-8">
                Join the revolutionary NFT marketplace where creators earn, collectors discover, 
                and communities thrive with ZORIUM token features.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/explore" className="btn-primary text-lg px-8 py-4">
                  Explore NFTs
                </Link>
                <Link href="/create" className="btn-secondary text-lg px-8 py-4">
                  Create NFT
                </Link>
              </div>
            </div>
            
            {/* Right Side - Featured NFTs Carousel */}
            <div className="">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-text-primary">Featured NFTs</h3>
                <div className="flex gap-2">
                  <button
                    onClick={prevSlide}
                    className="p-2 rounded-full bg-background-secondary hover:bg-purple-primary/20 transition-colors"
                    disabled={featuredNFTs.length <= 2}
                  >
                    <ChevronLeft size={20} className="text-text-secondary hover:text-purple-primary" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="p-2 rounded-full bg-background-secondary hover:bg-purple-primary/20 transition-colors"
                    disabled={featuredNFTs.length <= 2}
                  >
                    <ChevronRight size={20} className="text-text-secondary hover:text-purple-primary" />
                  </button>
                </div>
              </div>
              {featuredNFTs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {getCurrentNFTPair().map((nft, index) => (
                    <div key={`${nft.id}-${currentCarouselIndex}`}>
                      <NFTCard nft={nft} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="aspect-square bg-background-secondary rounded-xl border border-border flex items-center justify-center">
                    <p className="text-text-secondary">No featured NFTs available</p>
                  </div>
                  <div className="aspect-square bg-background-secondary rounded-xl border border-border flex items-center justify-center">
                    <p className="text-text-secondary">Loading featured content...</p>
                  </div>
                </div>
              )}
              {featuredNFTs.length > 2 && (
                <div className="flex justify-center mt-4 gap-2">
                  {Array.from({ length: Math.max(1, featuredNFTs.length - 1) }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentCarouselIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentCarouselIndex
                          ? 'bg-purple-primary'
                          : 'bg-text-secondary/30'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Platform Stats - Reduced Height */}
      <section className="py-8 bg-background-secondary">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex justify-center mb-1">
                <Zap className="text-purple-primary" size={24} />
              </div>
              <div className="text-xl font-bold text-text-primary">{stats.totalNFTs.toLocaleString()}</div>
              <div className="text-text-secondary text-sm">Total NFTs</div>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-1">
                <Users className="text-purple-primary" size={24} />
              </div>
              <div className="text-xl font-bold text-text-primary">{stats.activeUsers.toLocaleString()}</div>
              <div className="text-text-secondary text-sm">Active Users</div>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-1">
                <DollarSign className="text-purple-primary" size={24} />
              </div>
              <div className="text-xl font-bold text-text-primary">{stats.volume24h} ETH</div>
              <div className="text-text-secondary text-sm">24h Volume</div>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-1">
                <TrendingUp className="text-purple-primary" size={24} />
              </div>
              <div className="text-xl font-bold text-text-primary">{stats.volume7d} ETH</div>
              <div className="text-text-secondary text-sm">7d Volume</div>
            </div>
          </div>
        </div>
      </section>


      {/* Latest Activity with Infinite Scroll */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-text-primary">Latest Activity</h2>
            <Link href="/trending" className="text-purple-primary hover:text-purple-hover transition-colors">
              View Trending →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {latestNFTs.map((nft, index) => (
              <div key={`activity-${nft.id}`}>
                <NFTCard nft={nft} />
              </div>
            ))}
          </div>
          
          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-center mt-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-primary"></div>
            </div>
          )}
          
          {/* Empty state */}
          {!loading && latestNFTs.length === 0 && (
            <div className="text-center py-12">
              <Zap className="h-16 w-16 text-text-secondary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">No NFTs Available</h3>
              <p className="text-text-secondary">Check back later for new content</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <div>
            <h2 className="text-4xl font-bold mb-6 text-text-primary">
              Ready to start your NFT journey?
            </h2>
            <p className="text-xl text-text-secondary mb-8">
              Join thousands of creators and collectors on zorium.fun
            </p>
            <Link href="/create" className="btn-primary text-lg px-8 py-4">
              Create Your First NFT
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}