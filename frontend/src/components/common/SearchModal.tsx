'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, User, Image, Grid3X3, Clock, TrendingUp } from 'lucide-react'
import Modal from '@/components/common/Modal'

interface SearchResult {
  id: string
  type: 'nft' | 'collection' | 'user'
  title: string
  subtitle: string
  image?: string
  price?: string
  verified?: boolean
}

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [popularSearches] = useState<string[]>([
    'Bored Ape Yacht Club',
    'CryptoPunks',
    'Azuki',
    'Doodles',
    'Art Blocks'
  ])
  
  const searchInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Mock search data
  const mockResults: SearchResult[] = [
    {
      id: '1',
      type: 'nft',
      title: 'Bored Ape #1234',
      subtitle: 'Bored Ape Yacht Club',
      image: '/api/placeholder/400/400',
      price: '12.5 ETH',
      verified: true
    },
    {
      id: '2',
      type: 'collection',
      title: 'CryptoPunks',
      subtitle: '10,000 items · Floor: 45.2 ETH',
      image: '/api/placeholder/400/400',
      verified: true
    },
    {
      id: '3',
      type: 'user',
      title: 'cryptoartist.eth',
      subtitle: '1.2K followers · 45 NFTs',
      image: '/api/placeholder/400/400',
      verified: true
    },
    {
      id: '4',
      type: 'nft',
      title: 'Azuki #5678',
      subtitle: 'Azuki Collection',
      image: '/api/placeholder/400/400',
      price: '8.2 ETH'
    },
    {
      id: '5',
      type: 'collection',
      title: 'Art Blocks Curated',
      subtitle: '2.1K items · Floor: 0.8 ETH',
      image: '/api/placeholder/400/400',
      verified: true
    }
  ]

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  // Perform search
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setResults([])
      return
    }

    if (searchQuery.trim().length < 2) {
      return
    }

    setIsLoading(true)
    
    // Simulate API call
    const timeoutId = setTimeout(() => {
      const filtered = mockResults.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setResults(filtered)
      setIsLoading(false)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const handleSearchSubmit = (query: string) => {
    if (query.trim()) {
      // Save to recent searches
      const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5)
      setRecentSearches(updated)
      localStorage.setItem('recentSearches', JSON.stringify(updated))
      
      // Navigate to search results
      router.push(`/explore?search=${encodeURIComponent(query)}`)
      onClose()
    }
  }

  const handleResultClick = (result: SearchResult) => {
    handleSearchSubmit(result.title)
    
    // Navigate based on result type
    switch (result.type) {
      case 'nft':
        router.push(`/nft/${result.id}`)
        break
      case 'collection':
        router.push(`/collections/${result.id}`)
        break
      case 'user':
        router.push(`/profile/${result.id}`)
        break
    }
    onClose()
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('recentSearches')
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'nft':
        return <Image size={16} className="text-blue-500" />
      case 'collection':
        return <Grid3X3 size={16} className="text-purple-500" />
      case 'user':
        return <User size={16} className="text-green-500" />
      default:
        return <Search size={16} className="text-text-secondary" />
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="p-0">
        {/* Search Input */}
        <div className="relative p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={20} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearchSubmit(searchQuery)
                }
              }}
              placeholder="Search NFTs, collections, users..."
              className="w-full pl-10 pr-10 py-3 bg-background-secondary border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading && (
            <div className="p-8 text-center">
              <div className="inline-block w-6 h-6 border-2 border-purple-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-text-secondary mt-2">Searching...</p>
            </div>
          )}

          {!isLoading && searchQuery && results.length === 0 && (
            <div className="p-8 text-center">
              <Search size={48} className="text-text-secondary mx-auto mb-4" />
              <p className="text-text-primary font-medium">No results found</p>
              <p className="text-text-secondary text-sm">Try different keywords or check your spelling</p>
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div className="p-2">
              <p className="text-text-secondary text-sm px-3 py-2 font-medium">
                {results.length} result{results.length !== 1 ? 's' : ''} found
              </p>
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-background-secondary transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-background-tertiary flex items-center justify-center flex-shrink-0">
                    {result.image ? (
                      <img
                        src={result.image}
                        alt={result.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getResultIcon(result.type)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-text-primary font-medium truncate">{result.title}</h3>
                      {result.verified && (
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                    <p className="text-text-secondary text-sm truncate">{result.subtitle}</p>
                  </div>
                  {result.price && (
                    <div className="text-text-primary font-medium text-sm">
                      {result.price}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Recent & Popular Searches (when no search query) */}
          {!searchQuery && (
            <div className="p-4 space-y-6">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-text-primary font-medium flex items-center gap-2">
                      <Clock size={16} />
                      Recent Searches
                    </h3>
                    <button
                      onClick={clearRecentSearches}
                      className="text-text-secondary hover:text-text-primary text-sm transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearchSubmit(search)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-background-secondary transition-colors text-left"
                      >
                        <Clock size={16} className="text-text-secondary" />
                        <span className="text-text-primary">{search}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Searches */}
              <div>
                <h3 className="text-text-primary font-medium mb-3 flex items-center gap-2">
                  <TrendingUp size={16} />
                  Popular Searches
                </h3>
                <div className="space-y-1">
                  {popularSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearchSubmit(search)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-background-secondary transition-colors text-left"
                    >
                      <TrendingUp size={16} className="text-text-secondary" />
                      <span className="text-text-primary">{search}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}