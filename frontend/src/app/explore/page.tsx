'use client'

import { useState, useEffect } from 'react'
import SearchBar from '@/components/explore/SearchBar'
import FilterPanel from '@/components/explore/FilterPanel'
import SortDropdown from '@/components/explore/SortDropdown'
import CategoryFilter from '@/components/explore/CategoryFilter'
import NFTCard from '@/components/nft/NFTCard'
import NFTCardExpanded from '@/components/nft/NFTCardExpanded'
import UserLink from '@/components/common/UserLink'
import { Filter, LayoutGrid, LayoutList } from 'lucide-react'

// Mock data - in real app this would come from API
const mockNFTs = [
  {
    id: 1,
    title: 'Aurora Dreams',
    creator: 'artisan_01',
    creatorAddress: '0x1234...5678',
    image: '/images/placeholder-nft.jpg',
    price: '0.000111',
    promoted: true,
    likes: 24,
    mints: 12,
    networkId: 8453,
    category: 'Art',
    description: 'A mesmerizing digital artwork that captures the essence of aurora borealis with vibrant colors and ethereal beauty.',
    mintEndTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    comments: [
      { id: 1, user: 'crypto_fan', userAddress: '0xc1a2b3...4d5e', text: 'Amazing artwork! Love the colors 🎨', timestamp: '2m ago' },
      { id: 2, user: 'nft_collector', userAddress: '0xf6g7h8...9i0j', text: 'This is going straight to my collection!', timestamp: '5m ago' },
      { id: 3, user: 'artist_pro', userAddress: '0xk1l2m3...4n5o', text: 'Incredible detail work', timestamp: '10m ago' }
    ]
  },
  {
    id: 2,
    title: 'Digital Waves',
    creator: 'cryptoart',
    creatorAddress: '0xabcd...efgh',
    image: '/images/placeholder-nft.jpg',
    price: '0.000222',
    promoted: false,
    likes: 18,
    mints: 8,
    networkId: 7777777,
    category: 'Photography',
    description: 'Stunning ocean waves captured at the perfect moment, showcasing the raw power and beauty of nature.',
    mintEndTime: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString(), // 23 hours from now
    comments: [
      { id: 1, user: 'wave_rider', userAddress: '0xp1q2r3...4s5t', text: 'Perfect timing on this shot!', timestamp: '1h ago' },
      { id: 2, user: 'photo_lover', userAddress: '0xu6v7w8...9x0y', text: 'The composition is stunning', timestamp: '2h ago' }
    ]
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
    networkId: 1,
    category: 'Art',
    description: 'An electrifying neon artwork that glows with futuristic energy and cyberpunk aesthetics.',
    mintEndTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days from now
    comments: [
      { id: 1, user: 'neon_fan', userAddress: '0xa1b2c3...4d5e', text: 'The glow effect is incredible! How did you achieve this?', timestamp: '30m ago' },
      { id: 2, user: 'tech_artist', userAddress: '0xf6g7h8...9i0j', text: 'Masterpiece! 🔥', timestamp: '45m ago' }
    ]
  },
  {
    id: 4,
    title: 'Cyber Samurai',
    creator: 'futuristic',
    creatorAddress: '0x5555...6666',
    image: '/images/placeholder-nft.jpg',
    price: '0.000333',
    promoted: false,
    likes: 42,
    mints: 23,
    networkId: 137,
    category: 'Art',
    description: 'A masterful blend of traditional samurai culture with futuristic cyberpunk elements, creating a unique digital warrior.',
    mintEndTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // ended 1 hour ago
    comments: [
      { id: 1, user: 'samurai_soul', userAddress: '0xz1x2c3...4v5b', text: 'Epic blend of traditional and futuristic!', timestamp: '15m ago' },
      { id: 2, user: 'cyber_punk', userAddress: '0xn6m7l8...9k0j', text: 'This belongs in a museum', timestamp: '20m ago' },
      { id: 3, user: 'warrior_fan', userAddress: '0xh1g2f3...4e5d', text: 'The detail on the armor is insane', timestamp: '25m ago' }
    ]
  },
  {
    id: 5,
    title: 'Ocean Depths',
    creator: 'naturephoto',
    creatorAddress: '0x7777...8888',
    image: '/images/placeholder-nft.jpg',
    price: '0.000150',
    promoted: false,
    likes: 31,
    mints: 15,
    networkId: 10,
    category: 'Photography',
    description: 'Deep underwater photography revealing the mysterious beauty of ocean depths and marine life.',
    mintEndTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
    comments: [
      { id: 1, user: 'ocean_explorer', userAddress: '0xc1b2a3...4z5y', text: 'Makes me want to dive right in!', timestamp: '3h ago' }
    ]
  },
  {
    id: 6,
    title: 'Mountain Peak',
    creator: 'landscape_pro',
    creatorAddress: '0x9999...aaaa',
    image: '/images/placeholder-nft.jpg',
    price: '0.000180',
    promoted: false,
    likes: 28,
    mints: 11,
    networkId: 42161,
    category: 'Photography',
    description: 'Breathtaking mountain landscape captured during golden hour, showcasing majestic peaks and natural grandeur.',
    mintEndTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    comments: [
      { id: 1, user: 'mountain_climber', userAddress: '0xw1v2u3...4t5s', text: 'Breathtaking view! Which peak is this?', timestamp: '1h ago' },
      { id: 2, user: 'nature_lover', userAddress: '0xr1q2p3...4o5n', text: 'Perfect golden hour lighting', timestamp: '1.5h ago' }
    ]
  }
]

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [showFilters, setShowFilters] = useState(false)
  const [priceRange, setPriceRange] = useState([0, 1])
  const [onlyPromoted, setOnlyPromoted] = useState(false)
  const [selectedNetwork, setSelectedNetwork] = useState<string | number>('all')
  const [timeRemaining, setTimeRemaining] = useState('all')

  // Close filters on mobile when clicking outside or on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showFilters) {
        setShowFilters(false)
      }
    }

    const handleResize = () => {
      // Close mobile filters on desktop resize
      if (window.innerWidth >= 1024 && showFilters) {
        // On desktop, let filters stay open
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', handleResize)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleResize)
    }
  }, [showFilters])

  // Helper function to calculate time remaining in hours
  const getTimeRemainingHours = (mintEndTime: string | undefined) => {
    if (!mintEndTime) return null
    const now = new Date()
    const endTime = new Date(mintEndTime)
    const diffMs = endTime.getTime() - now.getTime()
    return diffMs / (1000 * 60 * 60) // Convert to hours
  }

  // Filter and sort NFTs based on current filters
  const filteredNFTs = mockNFTs
    .filter(nft => {
      // Search filter
      if (searchQuery && !nft.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !nft.creator.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      
      // Category filter
      if (selectedCategory !== 'All' && nft.category !== selectedCategory) {
        return false
      }
      
      // Promoted filter
      if (onlyPromoted && !nft.promoted) {
        return false
      }
      
      // Price filter
      const price = parseFloat(nft.price)
      if (price < priceRange[0] || price > priceRange[1]) {
        return false
      }

      // Network filter
      if (selectedNetwork !== 'all' && nft.networkId !== selectedNetwork) {
        return false
      }

      // Time remaining filter
      if (timeRemaining !== 'all') {
        const hoursRemaining = getTimeRemainingHours(nft.mintEndTime)
        
        switch (timeRemaining) {
          case '1hour':
            if (!hoursRemaining || hoursRemaining <= 0 || hoursRemaining > 1) return false
            break
          case '24hours':
            if (!hoursRemaining || hoursRemaining <= 0 || hoursRemaining > 24) return false
            break
          case '7days':
            if (!hoursRemaining || hoursRemaining <= 0 || hoursRemaining > 168) return false
            break
          case 'ended':
            if (!hoursRemaining || hoursRemaining > 0) return false
            break
        }
      }
      
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return parseFloat(a.price) - parseFloat(b.price)
        case 'price-high':
          return parseFloat(b.price) - parseFloat(a.price)
        case 'popular':
          return b.likes - a.likes
        case 'mints':
          return b.mints - a.mints
        case 'newest':
        default:
          return b.id - a.id
      }
    })

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-background-secondary border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">Explore NFTs</h1>
              <p className="text-text-secondary">Discover unique digital assets from creators worldwide</p>
            </div>
            
            {/* Search and Controls */}
            <div className="flex flex-col sm:flex-row gap-3 lg:w-2/3 xl:w-1/2">
              <div className="flex-1">
                <SearchBar 
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                />
              </div>
              
              <div className="flex gap-2">
                {/* Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    showFilters 
                      ? 'bg-purple-primary text-white border-purple-primary' 
                      : 'bg-background-primary text-text-secondary border-border hover:border-purple-primary hover:text-text-primary'
                  }`}
                >
                  <Filter size={18} />
                  <span className="hidden sm:inline">Filters</span>
                </button>
                
                {/* View Mode Toggle */}
                <div className="flex bg-background-primary border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-purple-primary text-white' 
                        : 'text-text-secondary hover:text-text-primary hover:bg-background-secondary'
                    }`}
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-purple-primary text-white' 
                        : 'text-text-secondary hover:text-text-primary hover:bg-background-secondary'
                    }`}
                  >
                    <LayoutList size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Categories */}
        <div className="mb-6">
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>

        <div className="flex gap-6 relative">
          {/* Mobile Filter Overlay */}
          {showFilters && (
            <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setShowFilters(false)} />
          )}
          
          {/* Filters Sidebar */}
          {showFilters && (
            <div className={`
              lg:w-80 lg:flex-shrink-0 lg:relative lg:bg-transparent
              fixed lg:static top-0 left-0 h-full lg:h-auto w-80 max-w-[90vw]
              bg-background-primary z-50 lg:z-auto
              transform lg:transform-none transition-transform duration-300
              ${showFilters ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
              border-r lg:border-r-0 border-border lg:border-none
              overflow-y-auto lg:overflow-visible
            `}>
              <div className="p-4 lg:p-0">
                {/* Mobile close button */}
                <div className="lg:hidden flex justify-between items-center mb-4 pb-4 border-b border-border">
                  <h2 className="text-lg font-semibold text-text-primary">Filters</h2>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="p-2 text-text-secondary hover:text-text-primary"
                  >
                    ×
                  </button>
                </div>
                
                <FilterPanel
                  priceRange={priceRange}
                  onPriceRangeChange={setPriceRange}
                  onlyPromoted={onlyPromoted}
                  onOnlyPromotedChange={setOnlyPromoted}
                  selectedNetwork={selectedNetwork}
                  onNetworkChange={setSelectedNetwork}
                  timeRemaining={timeRemaining}
                  onTimeRemainingChange={setTimeRemaining}
                />
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Sort and Results Count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-text-secondary">
                {filteredNFTs.length} NFT{filteredNFTs.length !== 1 ? 's' : ''} found
              </p>
              
              <SortDropdown 
                sortBy={sortBy}
                onSortChange={setSortBy}
              />
            </div>

            {/* NFTs Grid */}
            {filteredNFTs.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-text-secondary mb-4">
                  <Filter size={48} className="mx-auto opacity-50" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">No NFTs found</h3>
                <p className="text-text-secondary">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className={
                viewMode === 'grid' 
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-8"
              }>
                {filteredNFTs.map((nft) => (
                  <div key={nft.id} className={viewMode === 'list' ? 'max-w-4xl mx-auto' : ''}>
                    {viewMode === 'list' ? (
                      <div className="bg-background-primary border border-border rounded-2xl overflow-hidden">
                        <NFTCardExpanded nft={nft} />
                        {/* Comments Section */}
                        {nft.comments && nft.comments.length > 0 && (
                          <div className="border-t border-border p-6">
                            <h4 className="text-lg font-semibold text-text-primary mb-4">Comments</h4>
                            <div className="space-y-4">
                              {nft.comments.slice(0, 2).map((comment) => (
                                <div key={comment.id} className="flex gap-3">
                                  <div className="w-10 h-10 bg-purple-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-semibold text-purple-primary">
                                      {comment.user.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <UserLink
                                        address={comment.userAddress}
                                        username={comment.user}
                                        className="text-sm font-medium text-text-primary hover:text-purple-primary truncate"
                                      />
                                      <span className="text-xs text-text-secondary">
                                        {comment.timestamp}
                                      </span>
                                    </div>
                                    <p className="text-sm text-text-secondary leading-relaxed">
                                      {comment.text}
                                    </p>
                                  </div>
                                </div>
                              ))}
                              {nft.comments.length > 2 && (
                                <button className="text-sm text-purple-primary hover:text-purple-hover font-medium">
                                  View all {nft.comments.length} comments
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <NFTCard nft={nft} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Load More Button */}
            {filteredNFTs.length > 0 && (
              <div className="text-center mt-12">
                <button className="btn-secondary">
                  Load More NFTs
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}