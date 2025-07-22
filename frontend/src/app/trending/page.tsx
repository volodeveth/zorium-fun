'use client'

import { useState } from 'react'
import { TrendingUp, Crown, Trophy, Medal, Award, Zap, Users, DollarSign } from 'lucide-react'
import NFTCard from '@/components/nft/NFTCard'
import Button from '@/components/common/Button'

// Mock trending data with time-based metrics
const mockTrendingData = {
  '5min': [
    { id: 1, title: 'Cyber Punk 2077', creator: 'pixel_master', image: '/images/placeholder-nft.jpg', price: '0.000333', likes: 89, mints: 45, change: '+234%', volume: '1.45 ETH', rank: 1 },
    { id: 2, title: 'Neon Dreams', creator: 'artisan_01', image: '/images/placeholder-nft.jpg', price: '0.000222', likes: 67, mints: 34, change: '+156%', volume: '0.98 ETH', rank: 2 },
    { id: 3, title: 'Digital Aurora', creator: 'crypto_art', image: '/images/placeholder-nft.jpg', price: '0.000111', likes: 45, mints: 28, change: '+89%', volume: '0.67 ETH', rank: 3 },
  ],
  '1hour': [
    { id: 4, title: 'Ocean Depths', creator: 'nature_pro', image: '/images/placeholder-nft.jpg', price: '0.000444', likes: 123, mints: 67, change: '+89%', volume: '2.34 ETH', rank: 1 },
    { id: 5, title: 'Mountain Peak', creator: 'landscape', image: '/images/placeholder-nft.jpg', price: '0.000333', likes: 98, mints: 54, change: '+67%', volume: '1.89 ETH', rank: 2 },
    { id: 6, title: 'Sunset Glory', creator: 'photo_king', image: '/images/placeholder-nft.jpg', price: '0.000222', likes: 76, mints: 43, change: '+45%', volume: '1.23 ETH', rank: 3 },
  ],
  '24hours': [
    { id: 7, title: 'Abstract Vision', creator: 'modern_art', image: '/images/placeholder-nft.jpg', price: '0.000555', likes: 234, mints: 123, change: '+45%', volume: '5.67 ETH', rank: 1 },
    { id: 8, title: 'Urban Life', creator: 'street_photo', image: '/images/placeholder-nft.jpg', price: '0.000333', likes: 198, mints: 98, change: '+34%', volume: '4.32 ETH', rank: 2 },
    { id: 9, title: 'Future Tech', creator: 'tech_guru', image: '/images/placeholder-nft.jpg', price: '0.000444', likes: 167, mints: 87, change: '+23%', volume: '3.89 ETH', rank: 3 },
  ],
  '7days': [
    { id: 10, title: 'Cosmic Journey', creator: 'space_art', image: '/images/placeholder-nft.jpg', price: '0.000777', likes: 456, mints: 234, change: '+23%', volume: '12.34 ETH', rank: 1 },
    { id: 11, title: 'Ancient Wisdom', creator: 'history_buff', image: '/images/placeholder-nft.jpg', price: '0.000666', likes: 389, mints: 198, change: '+18%', volume: '9.87 ETH', rank: 2 },
    { id: 12, title: 'Digital Renaissance', creator: 'classic_art', image: '/images/placeholder-nft.jpg', price: '0.000555', likes: 334, mints: 167, change: '+12%', volume: '7.65 ETH', rank: 3 },
  ]
}

type TimeFilter = keyof typeof mockTrendingData

export default function TrendingPage() {
  const [selectedTime, setSelectedTime] = useState<TimeFilter>('24hours')
  
  const timeFilters = [
    { key: '5min' as TimeFilter, label: '5 Minutes', icon: Zap },
    { key: '1hour' as TimeFilter, label: '1 Hour', icon: TrendingUp },
    { key: '24hours' as TimeFilter, label: '24 Hours', icon: Users },
    { key: '7days' as TimeFilter, label: '7 Days', icon: DollarSign }
  ]

  const currentTrending = mockTrendingData[selectedTime]
  
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="text-yellow-400" size={24} />
      case 2: return <Trophy className="text-gray-400" size={24} />
      case 3: return <Medal className="text-amber-600" size={24} />
      default: return <Award className="text-purple-primary" size={20} />
    }
  }

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black'
      case 2: return 'bg-gradient-to-r from-gray-300 to-gray-500 text-black'
      case 3: return 'bg-gradient-to-r from-amber-400 to-amber-600 text-black'
      default: return 'bg-purple-primary text-white'
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-background-secondary border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-text-primary mb-4 flex items-center justify-center gap-3">
              <TrendingUp className="text-purple-primary" size={40} />
              Trending NFTs
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Discover the hottest NFTs rising in popularity across different time periods
            </p>
          </div>

          {/* Time Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-2">
            {timeFilters.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSelectedTime(key)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  selectedTime === key
                    ? 'bg-purple-primary text-white shadow-lg scale-105'
                    : 'bg-background-primary text-text-secondary hover:bg-background-tertiary hover:text-text-primary border border-border'
                }`}
              >
                <Icon size={20} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Top 3 Spotlight */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-text-primary mb-6 text-center">
            🏆 Top 3 Trending
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {currentTrending.slice(0, 3).map((nft) => (
              <div key={nft.id} className="relative">
                {/* Rank Badge */}
                <div className={`absolute -top-3 -left-3 z-10 w-12 h-12 rounded-full ${getRankBadge(nft.rank)} flex items-center justify-center font-bold text-lg shadow-lg`}>
                  #{nft.rank}
                </div>
                
                {/* Rank Icon */}
                <div className="absolute -top-2 -right-2 z-10">
                  {getRankIcon(nft.rank)}
                </div>

                {/* Enhanced NFT Card */}
                <div className="relative overflow-hidden rounded-xl bg-background-secondary border-2 border-purple-primary/30 hover:border-purple-primary/60 transition-all duration-300 hover:scale-105 shadow-xl">
                  {/* Trending Badge */}
                  <div className="absolute top-4 left-4 z-20 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <TrendingUp size={12} />
                    {nft.change}
                  </div>

                  <div className="aspect-square bg-gradient-to-br from-purple-primary/20 to-blue-500/20 flex items-center justify-center text-text-secondary">
                    NFT Preview
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-text-primary mb-1">{nft.title}</h3>
                    <p className="text-text-secondary text-sm mb-3">by @{nft.creator}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-text-secondary">Price:</span>
                        <div className="font-semibold text-text-primary">{nft.price} ETH</div>
                      </div>
                      <div>
                        <span className="text-text-secondary">Volume:</span>
                        <div className="font-semibold text-purple-primary">{nft.volume}</div>
                      </div>
                      <div>
                        <span className="text-text-secondary">Mints:</span>
                        <div className="font-semibold text-text-primary">{nft.mints}</div>
                      </div>
                      <div>
                        <span className="text-text-secondary">Likes:</span>
                        <div className="font-semibold text-text-primary">{nft.likes}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Full Rankings */}
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            Complete Rankings
          </h2>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-background-secondary rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="text-green-500" size={20} />
                <span className="text-text-secondary text-sm">Avg Change</span>
              </div>
              <div className="text-xl font-bold text-green-500">+89%</div>
            </div>
            
            <div className="bg-background-secondary rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="text-purple-primary" size={20} />
                <span className="text-text-secondary text-sm">Total Volume</span>
              </div>
              <div className="text-xl font-bold text-text-primary">24.5 ETH</div>
            </div>
            
            <div className="bg-background-secondary rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Users className="text-blue-500" size={20} />
                <span className="text-text-secondary text-sm">Total Mints</span>
              </div>
              <div className="text-xl font-bold text-text-primary">1,234</div>
            </div>
            
            <div className="bg-background-secondary rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="text-yellow-500" size={20} />
                <span className="text-text-secondary text-sm">Active Now</span>
              </div>
              <div className="text-xl font-bold text-text-primary">89</div>
            </div>
          </div>

          {/* Rankings List */}
          <div className="space-y-4">
            {currentTrending.map((nft, index) => (
              <div key={nft.id} className="bg-background-secondary rounded-xl p-4 border border-border hover:border-purple-primary/50 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className={`w-10 h-10 rounded-full ${getRankBadge(nft.rank)} flex items-center justify-center font-bold`}>
                      #{nft.rank}
                    </div>
                    
                    {/* NFT Info */}
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-primary/20 to-blue-500/20 rounded-lg flex items-center justify-center text-text-secondary text-xs">
                        NFT
                      </div>
                      <div>
                        <h3 className="font-semibold text-text-primary">{nft.title}</h3>
                        <p className="text-text-secondary text-sm">by @{nft.creator}</p>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-8">
                    <div className="text-center">
                      <div className="text-text-secondary text-xs">Change</div>
                      <div className="font-semibold text-green-500">{nft.change}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-text-secondary text-xs">Volume</div>
                      <div className="font-semibold text-text-primary">{nft.volume}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-text-secondary text-xs">Mints</div>
                      <div className="font-semibold text-text-primary">{nft.mints}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-text-secondary text-xs">Price</div>
                      <div className="font-semibold text-purple-primary">{nft.price} ETH</div>
                    </div>
                  </div>

                  {/* Action */}
                  <Button size="sm" variant="outline">
                    View NFT
                  </Button>
                </div>

                {/* Mobile Stats */}
                <div className="md:hidden mt-4 grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-text-secondary text-xs">Change</div>
                    <div className="font-semibold text-green-500 text-sm">{nft.change}</div>
                  </div>
                  <div>
                    <div className="text-text-secondary text-xs">Volume</div>
                    <div className="font-semibold text-text-primary text-sm">{nft.volume}</div>
                  </div>
                  <div>
                    <div className="text-text-secondary text-xs">Mints</div>
                    <div className="font-semibold text-text-primary text-sm">{nft.mints}</div>
                  </div>
                  <div>
                    <div className="text-text-secondary text-xs">Price</div>
                    <div className="font-semibold text-purple-primary text-sm">{nft.price} ETH</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-8">
            <Button variant="secondary" size="lg">
              Load More Trending NFTs
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}