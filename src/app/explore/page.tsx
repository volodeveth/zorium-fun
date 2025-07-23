'use client'

import { useState } from 'react'
import SearchBar from '@/components/explore/SearchBar'
import FilterPanel from '@/components/explore/FilterPanel'
import SortDropdown from '@/components/explore/SortDropdown'
import CategoryFilter from '@/components/explore/CategoryFilter'
import NFTCard from '@/components/nft/NFTCard'
import { Filter, LayoutGrid, LayoutList } from 'lucide-react'

// Mock data - in real app this would come from API
const mockNFTs = [
  {
    id: 1,
    title: 'Aurora Dreams',
    creator: 'artisan_01',
    image: '/images/placeholder-nft.jpg',
    price: '0.000111',
    promoted: true,
    likes: 24,
    mints: 12,
    category: 'Art'
  },
  {
    id: 2,
    title: 'Digital Waves',
    creator: 'cryptoart',
    image: '/images/placeholder-nft.jpg',
    price: '0.000222',
    promoted: false,
    likes: 18,
    mints: 8,
    category: 'Photography'
  },
  {
    id: 3,
    title: 'Neon Glow',
    creator: 'pixelmaster',
    image: '/images/placeholder-nft.jpg',
    price: '0.000111',
    promoted: true,
    likes: 35,
    mints: 19,
    category: 'Art'
  },
  {
    id: 4,
    title: 'Cyber Samurai',
    creator: 'futuristic',
    image: '/images/placeholder-nft.jpg',
    price: '0.000333',
    promoted: false,
    likes: 42,
    mints: 23,
    category: 'Art'
  },
  {
    id: 5,
    title: 'Ocean Depths',
    creator: 'naturephoto',
    image: '/images/placeholder-nft.jpg',
    price: '0.000150',
    promoted: false,
    likes: 31,
    mints: 15,
    category: 'Photography'
  },
  {
    id: 6,
    title: 'Mountain Peak',
    creator: 'landscape_pro',
    image: '/images/placeholder-nft.jpg',
    price: '0.000180',
    promoted: false,
    likes: 28,
    mints: 11,
    category: 'Photography'
  }
]

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [priceRange, setPriceRange] = useState([0, 1])
  const [onlyPromoted, setOnlyPromoted] = useState(false)

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

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-80 flex-shrink-0">
              <FilterPanel
                priceRange={priceRange}
                onPriceRangeChange={setPriceRange}
                onlyPromoted={onlyPromoted}
                onOnlyPromotedChange={setOnlyPromoted}
              />
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1">
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
                  : "space-y-4"
              }>
                {filteredNFTs.map((nft) => (
                  <div key={nft.id}>
                    <NFTCard nft={nft} />
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