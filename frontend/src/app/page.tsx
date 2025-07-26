'use client'

import Link from 'next/link'
import { TrendingUp, Users, DollarSign, Zap, ChevronLeft, ChevronRight } from 'lucide-react'
import NFTCard from '@/components/nft/NFTCard'
import { useState, useEffect, useCallback } from 'react'

// Generate mock NFTs for demo
const generateMockNFT = (id: number) => ({
  id,
  title: `NFT #${id}`,
  creator: `creator_${id}`,
  creatorAddress: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 4)}`,
  image: '/images/placeholder-nft.jpg',
  price: '0.000111',
  promoted: Math.random() > 0.8,
  likes: Math.floor(Math.random() * 50) + 1,
  mints: Math.floor(Math.random() * 30) + 1,
  networkId: [8453, 7777777, 1, 137][Math.floor(Math.random() * 4)]
})

const allFeaturedNFTs = [
  {
    id: 1,
    title: 'Aurora',
    creator: 'artisan_01',
    creatorAddress: '0x1234...5678',
    image: '/images/placeholder-nft.jpg',
    price: '0.000111',
    promoted: true,
    likes: 24,
    mints: 12,
    networkId: 8453
  },
  {
    id: 2,
    title: 'Digital Wave', 
    creator: 'cryptoart',
    creatorAddress: '0xabcd...efgh',
    image: '/images/placeholder-nft.jpg',
    price: '0.000111',
    promoted: true,
    likes: 18,
    mints: 8,
    networkId: 7777777
  },
  {
    id: 3,
    title: 'Neon Glow',
    creator: 'pixelmaster',
    creatorAddress: '0x9876...5432',
    image: '/images/placeholder-nft.jpg',
    price: '0.000111',
    promoted: true,
    likes: 35,
    mints: 19,
    networkId: 1
  },
  {
    id: 4,
    title: 'Cyber Samurai',
    creator: 'futuristic',
    creatorAddress: '0x5555...6666',
    image: '/images/placeholder-nft.jpg',
    price: '0.000111',
    promoted: true,
    likes: 42,
    mints: 23,
    networkId: 137
  },
  {
    id: 5,
    title: 'Quantum Dreams',
    creator: 'dreamweaver',
    creatorAddress: '0x7777...8888',
    image: '/images/placeholder-nft.jpg',
    price: '0.000111',
    promoted: true,
    likes: 28,
    mints: 15,
    networkId: 8453
  },
  {
    id: 6,
    title: 'Electric Storm',
    creator: 'stormcaster',
    creatorAddress: '0x9999...0000',
    image: '/images/placeholder-nft.jpg',
    price: '0.000111',
    promoted: true,
    likes: 51,
    mints: 31,
    networkId: 1
  }
]

// Shuffle array function
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const mockStats = {
  totalNFTs: 15420,
  activeUsers: 8650,
  volume24h: 1234.56,
  volume7d: 8901.23
}

export default function HomePage() {
  const [latestNFTs, setLatestNFTs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [featuredNFTs, setFeaturedNFTs] = useState<any[]>([])
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0)

  // Initialize featured NFTs with random shuffle
  useEffect(() => {
    const shuffled = shuffleArray(allFeaturedNFTs)
    setFeaturedNFTs(shuffled)
  }, [])

  // Load initial NFTs
  useEffect(() => {
    loadMoreNFTs()
  }, [])

  const loadMoreNFTs = useCallback(async () => {
    if (loading) return
    
    setLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      const newNFTs = Array.from({ length: 20 }, (_, i) => 
        generateMockNFT(page * 20 + i + 100)
      )
      
      setLatestNFTs(prev => [...prev, ...newNFTs])
      setPage(prev => prev + 1)
      setLoading(false)
      
      // Stop loading after 5 pages for demo
      if (page >= 4) {
        setHasMore(false)
      }
    }, 500)
  }, [page, loading])

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop + 1000 >=
        document.documentElement.scrollHeight
      ) {
        if (hasMore && !loading) {
          loadMoreNFTs()
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hasMore, loading, loadMoreNFTs])

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

  return (
    <div className="min-h-screen">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {getCurrentNFTPair().map((nft, index) => (
                  <div key={`${nft.id}-${currentCarouselIndex}`}>
                    <NFTCard nft={nft} />
                  </div>
                ))}
              </div>
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
              <div className="text-xl font-bold text-text-primary">15,420</div>
              <div className="text-text-secondary text-sm">Total NFTs</div>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-1">
                <Users className="text-purple-primary" size={24} />
              </div>
              <div className="text-xl font-bold text-text-primary">8,650</div>
              <div className="text-text-secondary text-sm">Active Users</div>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-1">
                <DollarSign className="text-purple-primary" size={24} />
              </div>
              <div className="text-xl font-bold text-text-primary">{mockStats.volume24h} ETH</div>
              <div className="text-text-secondary text-sm">24h Volume</div>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-1">
                <TrendingUp className="text-purple-primary" size={24} />
              </div>
              <div className="text-xl font-bold text-text-primary">{mockStats.volume7d} ETH</div>
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
          
          {/* End of content indicator */}
          {!hasMore && latestNFTs.length > 0 && (
            <div className="text-center mt-8 text-text-secondary">
              No more NFTs to load
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