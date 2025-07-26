'use client'

import { useState } from 'react'
import Image from 'next/image'
import { TrendingUp, Crown, Trophy, Medal, Award, Zap, Clock, Calendar, CalendarDays, DollarSign, Users } from 'lucide-react'
import NFTCard from '@/components/nft/NFTCard'
import UserLink from '@/components/common/UserLink'
import Button from '@/components/common/Button'
import { getNetworkLogo, getNetworkName } from '@/lib/utils/networkHelpers'

// Mock trending data with time-based metrics - exactly 10 NFTs per period
const mockTrendingData = {
  '5min': [
    { id: 1, title: 'Cyber Punk 2077', creator: 'pixel_master', creatorAddress: '0x1234...5678', image: '/images/placeholder-nft.jpg', price: '0.000333', likes: 89, mints: 45, change: '+234%', volume: '1.45 ETH', rank: 1, networkId: 8453 },
    { id: 2, title: 'Neon Dreams', creator: 'artisan_01', creatorAddress: '0xabcd...efgh', image: '/images/placeholder-nft.jpg', price: '0.000222', likes: 67, mints: 34, change: '+156%', volume: '0.98 ETH', rank: 2, networkId: 7777777 },
    { id: 3, title: 'Digital Aurora', creator: 'crypto_art', creatorAddress: '0x9876...5432', image: '/images/placeholder-nft.jpg', price: '0.000111', likes: 45, mints: 28, change: '+89%', volume: '0.67 ETH', rank: 3, networkId: 1 },
    { id: 4, title: 'Quantum Leap', creator: 'future_tech', creatorAddress: '0x1111...2222', image: '/images/placeholder-nft.jpg', price: '0.000188', likes: 38, mints: 23, change: '+67%', volume: '0.54 ETH', rank: 4, networkId: 137 },
    { id: 5, title: 'Mystic Forest', creator: 'nature_soul', creatorAddress: '0x3333...4444', image: '/images/placeholder-nft.jpg', price: '0.000155', likes: 32, mints: 19, change: '+45%', volume: '0.41 ETH', rank: 5, networkId: 10 },
    { id: 6, title: 'Chrome Dreams', creator: 'metal_art', creatorAddress: '0x5555...6666', image: '/images/placeholder-nft.jpg', price: '0.000144', likes: 29, mints: 17, change: '+34%', volume: '0.38 ETH', rank: 6, networkId: 42161 },
    { id: 7, title: 'Pixel Warriors', creator: 'retro_gamer', creatorAddress: '0x7777...8888', image: '/images/placeholder-nft.jpg', price: '0.000133', likes: 26, mints: 15, change: '+23%', volume: '0.33 ETH', rank: 7, networkId: 8453 },
    { id: 8, title: 'Solar Flare', creator: 'space_explorer', creatorAddress: '0x9999...aaaa', image: '/images/placeholder-nft.jpg', price: '0.000122', likes: 23, mints: 13, change: '+18%', volume: '0.29 ETH', rank: 8, networkId: 7777777 },
    { id: 9, title: 'Deep Ocean', creator: 'marine_bio', creatorAddress: '0xbbbb...cccc', image: '/images/placeholder-nft.jpg', price: '0.000111', likes: 20, mints: 11, change: '+12%', volume: '0.25 ETH', rank: 9, networkId: 1 },
    { id: 10, title: 'City Lights', creator: 'urban_photographer', creatorAddress: '0xdddd...eeee', image: '/images/placeholder-nft.jpg', price: '0.000105', likes: 18, mints: 9, change: '+8%', volume: '0.21 ETH', rank: 10, networkId: 137 }
  ],
  '1hour': [
    { id: 11, title: 'Ocean Depths', creator: 'nature_pro', creatorAddress: '0x5555...6666', image: '/images/placeholder-nft.jpg', price: '0.000444', likes: 123, mints: 67, change: '+89%', volume: '2.34 ETH', rank: 1, networkId: 137 },
    { id: 12, title: 'Mountain Peak', creator: 'landscape', creatorAddress: '0x7777...8888', image: '/images/placeholder-nft.jpg', price: '0.000333', likes: 98, mints: 54, change: '+67%', volume: '1.89 ETH', rank: 2, networkId: 10 },
    { id: 13, title: 'Sunset Glory', creator: 'photo_king', creatorAddress: '0x9999...aaaa', image: '/images/placeholder-nft.jpg', price: '0.000222', likes: 76, mints: 43, change: '+45%', volume: '1.23 ETH', rank: 3, networkId: 42161 },
    { id: 14, title: 'Neon Nights', creator: 'night_owl', creatorAddress: '0x1010...1111', image: '/images/placeholder-nft.jpg', price: '0.000199', likes: 65, mints: 37, change: '+38%', volume: '1.08 ETH', rank: 4, networkId: 8453 },
    { id: 15, title: 'Abstract Mind', creator: 'mind_bender', creatorAddress: '0x1212...1313', image: '/images/placeholder-nft.jpg', price: '0.000177', likes: 58, mints: 32, change: '+29%', volume: '0.94 ETH', rank: 5, networkId: 7777777 },
    { id: 16, title: 'Golden Hour', creator: 'light_chaser', creatorAddress: '0x1414...1515', image: '/images/placeholder-nft.jpg', price: '0.000166', likes: 52, mints: 28, change: '+24%', volume: '0.83 ETH', rank: 6, networkId: 1 },
    { id: 17, title: 'Digital Waves', creator: 'wave_rider', creatorAddress: '0x1616...1717', image: '/images/placeholder-nft.jpg', price: '0.000155', likes: 47, mints: 25, change: '+19%', volume: '0.74 ETH', rank: 7, networkId: 137 },
    { id: 18, title: 'Retro Future', creator: 'time_traveler', creatorAddress: '0x1818...1919', image: '/images/placeholder-nft.jpg', price: '0.000144', likes: 42, mints: 22, change: '+15%', volume: '0.66 ETH', rank: 8, networkId: 10 },
    { id: 19, title: 'Crystal Palace', creator: 'gem_cutter', creatorAddress: '0x2020...2121', image: '/images/placeholder-nft.jpg', price: '0.000133', likes: 38, mints: 19, change: '+11%', volume: '0.58 ETH', rank: 9, networkId: 42161 },
    { id: 20, title: 'Fire Storm', creator: 'flame_master', creatorAddress: '0x2222...2323', image: '/images/placeholder-nft.jpg', price: '0.000122', likes: 35, mints: 17, change: '+7%', volume: '0.51 ETH', rank: 10, networkId: 8453 }
  ],
  '24hours': [
    { id: 21, title: 'Abstract Vision', creator: 'modern_art', creatorAddress: '0xbbbb...cccc', image: '/images/placeholder-nft.jpg', price: '0.000555', likes: 234, mints: 123, change: '+45%', volume: '5.67 ETH', rank: 1, networkId: 8453 },
    { id: 22, title: 'Urban Life', creator: 'street_photo', creatorAddress: '0xdddd...eeee', image: '/images/placeholder-nft.jpg', price: '0.000333', likes: 198, mints: 98, change: '+34%', volume: '4.32 ETH', rank: 2, networkId: 7777777 },
    { id: 23, title: 'Future Tech', creator: 'tech_guru', creatorAddress: '0xffff...0000', image: '/images/placeholder-nft.jpg', price: '0.000444', likes: 167, mints: 87, change: '+23%', volume: '3.89 ETH', rank: 3, networkId: 1 },
    { id: 24, title: 'Cosmic Energy', creator: 'star_gazer', creatorAddress: '0x2424...2525', image: '/images/placeholder-nft.jpg', price: '0.000388', likes: 145, mints: 76, change: '+19%', volume: '3.21 ETH', rank: 4, networkId: 137 },
    { id: 25, title: 'Ancient Runes', creator: 'historian', creatorAddress: '0x2626...2727', image: '/images/placeholder-nft.jpg', price: '0.000355', likes: 132, mints: 69, change: '+16%', volume: '2.87 ETH', rank: 5, networkId: 10 },
    { id: 26, title: 'Digital Zen', creator: 'peaceful_mind', creatorAddress: '0x2828...2929', image: '/images/placeholder-nft.jpg', price: '0.000299', likes: 118, mints: 62, change: '+13%', volume: '2.44 ETH', rank: 6, networkId: 42161 },
    { id: 27, title: 'Mechanical Soul', creator: 'robot_artist', creatorAddress: '0x3030...3131', image: '/images/placeholder-nft.jpg', price: '0.000277', likes: 106, mints: 55, change: '+10%', volume: '2.11 ETH', rank: 7, networkId: 8453 },
    { id: 28, title: 'Natural Flow', creator: 'water_spirit', creatorAddress: '0x3232...3333', image: '/images/placeholder-nft.jpg', price: '0.000255', likes: 94, mints: 49, change: '+8%', volume: '1.88 ETH', rank: 8, networkId: 7777777 },
    { id: 29, title: 'Electric Dreams', creator: 'voltage_artist', creatorAddress: '0x3434...3535', image: '/images/placeholder-nft.jpg', price: '0.000233', likes: 83, mints: 43, change: '+6%', volume: '1.65 ETH', rank: 9, networkId: 1 },
    { id: 30, title: 'Shadow Play', creator: 'dark_artist', creatorAddress: '0x3636...3737', image: '/images/placeholder-nft.jpg', price: '0.000211', likes: 72, mints: 38, change: '+4%', volume: '1.42 ETH', rank: 10, networkId: 137 }
  ],
  '7days': [
    { id: 31, title: 'Cosmic Journey', creator: 'space_art', creatorAddress: '0x1111...2222', image: '/images/placeholder-nft.jpg', price: '0.000777', likes: 456, mints: 234, change: '+23%', volume: '12.34 ETH', rank: 1, networkId: 137 },
    { id: 32, title: 'Ancient Wisdom', creator: 'history_buff', creatorAddress: '0x3333...4444', image: '/images/placeholder-nft.jpg', price: '0.000666', likes: 389, mints: 198, change: '+18%', volume: '9.87 ETH', rank: 2, networkId: 10 },
    { id: 33, title: 'Digital Renaissance', creator: 'classic_art', creatorAddress: '0x5555...7777', image: '/images/placeholder-nft.jpg', price: '0.000555', likes: 334, mints: 167, change: '+12%', volume: '7.65 ETH', rank: 3, networkId: 42161 },
    { id: 34, title: 'Quantum Portal', creator: 'dimension_walker', creatorAddress: '0x3838...3939', image: '/images/placeholder-nft.jpg', price: '0.000499', likes: 298, mints: 152, change: '+9%', volume: '6.88 ETH', rank: 4, networkId: 8453 },
    { id: 35, title: 'Ethereal Beauty', creator: 'spirit_artist', creatorAddress: '0x4040...4141', image: '/images/placeholder-nft.jpg', price: '0.000444', likes: 267, mints: 136, change: '+7%', volume: '6.12 ETH', rank: 5, networkId: 7777777 },
    { id: 36, title: 'Time Capsule', creator: 'memory_keeper', creatorAddress: '0x4242...4343', image: '/images/placeholder-nft.jpg', price: '0.000399', likes: 238, mints: 121, change: '+5%', volume: '5.43 ETH', rank: 6, networkId: 1 },
    { id: 37, title: 'Neural Network', creator: 'ai_creator', creatorAddress: '0x4444...4545', image: '/images/placeholder-nft.jpg', price: '0.000366', likes: 211, mints: 107, change: '+4%', volume: '4.82 ETH', rank: 7, networkId: 137 },
    { id: 38, title: 'Harmony Waves', creator: 'sound_visual', creatorAddress: '0x4646...4747', image: '/images/placeholder-nft.jpg', price: '0.000333', likes: 186, mints: 94, change: '+3%', volume: '4.25 ETH', rank: 8, networkId: 10 },
    { id: 39, title: 'Fractal Mind', creator: 'math_artist', creatorAddress: '0x4848...4949', image: '/images/placeholder-nft.jpg', price: '0.000299', likes: 163, mints: 82, change: '+2%', volume: '3.71 ETH', rank: 9, networkId: 42161 },
    { id: 40, title: 'Infinite Loop', creator: 'code_poet', creatorAddress: '0x5050...5151', image: '/images/placeholder-nft.jpg', price: '0.000277', likes: 142, mints: 71, change: '+1%', volume: '3.22 ETH', rank: 10, networkId: 8453 }
  ]
}

type TimeFilter = keyof typeof mockTrendingData

export default function TrendingPage() {
  const [selectedTime, setSelectedTime] = useState<TimeFilter>('24hours')
  
  const timeFilters = [
    { key: '5min' as TimeFilter, label: '5 Minutes', icon: Zap },
    { key: '1hour' as TimeFilter, label: '1 Hour', icon: Clock },
    { key: '24hours' as TimeFilter, label: '24 Hours', icon: Calendar },
    { key: '7days' as TimeFilter, label: '7 Days', icon: CalendarDays }
  ]

  const currentTrending = mockTrendingData[selectedTime]
  
  // Calculate dynamic stats based on current trending NFTs
  const calculateStats = (nfts: typeof currentTrending) => {
    const totalVolume = nfts.reduce((sum, nft) => sum + parseFloat(nft.volume.replace(' ETH', '')), 0)
    const totalMints = nfts.reduce((sum, nft) => sum + nft.mints, 0)
    const totalLikes = nfts.reduce((sum, nft) => sum + nft.likes, 0)
    const avgChange = Math.round(nfts.reduce((sum, nft) => sum + parseInt(nft.change.replace('%', '').replace('+', '')), 0) / nfts.length)
    
    return {
      totalVolume: totalVolume.toFixed(1),
      totalMints,
      totalLikes,
      avgChange: `+${avgChange}%`
    }
  }
  
  const stats = calculateStats(currentTrending)
  
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
                <div className="absolute top-4 right-4 z-10">
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
                    <p className="text-text-secondary text-sm mb-3">
                      by{' '}
                      <UserLink
                        address={nft.creatorAddress}
                        username={nft.creator}
                        className="text-text-secondary hover:text-purple-primary"
                      />
                    </p>
                    
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
              <div className="text-xl font-bold text-green-500">{stats.avgChange}</div>
            </div>
            
            <div className="bg-background-secondary rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="text-purple-primary" size={20} />
                <span className="text-text-secondary text-sm">Total Volume</span>
              </div>
              <div className="text-xl font-bold text-text-primary">{stats.totalVolume} ETH</div>
            </div>
            
            <div className="bg-background-secondary rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Users className="text-blue-500" size={20} />
                <span className="text-text-secondary text-sm">Total Mints</span>
              </div>
              <div className="text-xl font-bold text-text-primary">{stats.totalMints}</div>
            </div>
            
            <div className="bg-background-secondary rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="text-yellow-500" size={20} />
                <span className="text-text-secondary text-sm">Total Likes</span>
              </div>
              <div className="text-xl font-bold text-text-primary">{stats.totalLikes}</div>
            </div>
          </div>

          {/* Rankings List - Positions 4-10 */}
          <div className="space-y-4">
            {currentTrending.slice(3).map((nft, index) => (
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
                        <p className="text-text-secondary text-sm mb-2">
                          by{' '}
                          <UserLink
                            address={nft.creatorAddress}
                            username={nft.creator}
                            className="text-text-secondary hover:text-purple-primary"
                          />
                        </p>
                        <div className="flex items-center gap-1 mb-2">
                          <Image
                            src={getNetworkLogo(nft.networkId)}
                            alt={getNetworkName(nft.networkId)}
                            width={16}
                            height={16}
                            className="rounded-full"
                          />
                          <span className="text-xs text-text-secondary">{getNetworkName(nft.networkId)}</span>
                        </div>
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

        </div>
      </div>
    </div>
  )
}