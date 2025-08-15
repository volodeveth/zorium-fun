'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { TrendingUp, Crown, Trophy, Medal, Award, Zap, Clock, Calendar, CalendarDays, DollarSign, Users, Heart, Loader2 } from 'lucide-react'
import NFTCard from '@/components/nft/NFTCard'
import Button from '@/components/common/Button'
import UserLink from '@/components/common/UserLink'
import { getNetworkLogo, getNetworkName } from '@/lib/utils/networkHelpers'
import { api } from '@/lib/api'

interface TrendingNFT {
  id: string
  title: string
  creator: string
  creatorAddress: string
  image: string
  price: string
  likes: number
  mints: number
  change: string
  volume: string
  rank: number
  networkId: number
}

type TimeFilter = '5min' | '1hour' | '24hours' | '7days'

export default function TrendingPage() {
  const [selectedTime, setSelectedTime] = useState<TimeFilter>('24hours')
  const [trendingNFTs, setTrendingNFTs] = useState<TrendingNFT[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const timeFilters = [
    { key: '5min' as TimeFilter, label: '5 Minutes', icon: Zap },
    { key: '1hour' as TimeFilter, label: '1 Hour', icon: Clock },
    { key: '24hours' as TimeFilter, label: '24 Hours', icon: Calendar },
    { key: '7days' as TimeFilter, label: '7 Days', icon: CalendarDays }
  ]

  // Fetch trending NFTs from backend
  const fetchTrendingNFTs = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.nfts.getTrending()
      if (response.ok) {
        const data = await response.json()
        
        // Transform backend data to match frontend format
        const transformedNFTs = data.nfts?.map((nft: any, index: number) => ({
          id: nft.id,
          title: nft.name,
          creator: nft.creator?.username || nft.creator?.displayName || `${nft.creator?.address?.slice(0, 6)}...${nft.creator?.address?.slice(-4)}`,
          creatorAddress: nft.creator?.address || '0x0000...0000',
          image: nft.image || '/images/placeholder-nft.jpg',
          price: nft.price?.toString() || '0.000111',
          likes: nft.likeCount || 0,
          mints: nft.viewCount || Math.floor(Math.random() * 50) + 1, // Use view count as mints
          change: `+${Math.floor(Math.random() * 50) + 5}%`, // Random percentage change for demo
          volume: `${((parseFloat(nft.price?.toString() || '0.001')) * (nft.likeCount || 1)).toFixed(3)} ETH`,
          rank: index + 1,
          networkId: 8453 // Default to Base network
        })) || []
        
        setTrendingNFTs(transformedNFTs.slice(0, 10)) // Limit to top 10
      } else {
        setError('Failed to load trending NFTs from backend')
      }
    } catch (err) {
      console.error('Error fetching trending NFTs:', err)
      setError('Error connecting to backend')
    } finally {
      setLoading(false)
    }
  }

  // Load trending NFTs on component mount
  useEffect(() => {
    fetchTrendingNFTs()
  }, [])

  // Calculate dynamic stats based on current trending NFTs
  const calculateStats = (nfts: TrendingNFT[]) => {
    if (nfts.length === 0) {
      return {
        totalVolume: '0.0',
        totalMints: 0,
        totalLikes: 0,
        avgChange: '+0%'
      }
    }

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
  
  const stats = calculateStats(trendingNFTs)
  
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-purple-primary mx-auto mb-4" />
          <p className="text-text-secondary">Loading trending NFTs...</p>
        </div>
      </div>
    )
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
        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">!</span>
              </div>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        {trendingNFTs.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="h-16 w-16 text-text-secondary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">No Trending NFTs</h3>
            <p className="text-text-secondary">Check back later for trending content</p>
          </div>
        ) : (
          <>
            {/* Top 3 Spotlight */}
            {trendingNFTs.length >= 3 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-text-primary mb-6 text-center">
                  🏆 Top 3 Trending
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {trendingNFTs.slice(0, 3).map((nft) => (
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

                        <Link href={`/nft/${nft.id}`}>
                          <div className="aspect-square bg-gradient-to-br from-purple-primary/20 to-blue-500/20 flex items-center justify-center text-text-secondary cursor-pointer hover:opacity-90 transition-opacity">
                            <Image
                              src={nft.image}
                              alt={nft.title}
                              fill
                              className="object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                            <span className="text-xs opacity-50">NFT Preview</span>
                          </div>
                        </Link>
                        
                        <div className="p-4">
                          <h3 className="font-semibold text-text-primary mb-1">{nft.title}</h3>
                          <p className="text-text-secondary text-sm mb-2">
                            by{' '}
                            <UserLink
                              address={nft.creatorAddress}
                              username={nft.creator}
                              className="text-text-secondary hover:text-purple-primary"
                            />
                          </p>
                          
                          {/* Network Display */}
                          <div className="flex items-center gap-1 mb-3">
                            <Image
                              src={getNetworkLogo(nft.networkId)}
                              alt={getNetworkName(nft.networkId)}
                              width={16}
                              height={16}
                              className="rounded-full"
                            />
                            <span className="text-xs text-text-secondary">{getNetworkName(nft.networkId)}</span>
                          </div>
                          
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
                              <span className="text-text-secondary">Views:</span>
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
            )}

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
                    <span className="text-text-secondary text-sm">Avg Growth</span>
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
                    <Zap className="text-blue-500" size={20} />
                    <span className="text-text-secondary text-sm">Total Views</span>
                  </div>
                  <div className="text-xl font-bold text-text-primary">{stats.totalMints}</div>
                </div>
                
                <div className="bg-background-secondary rounded-xl p-4 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="text-red-500" size={20} />
                    <span className="text-text-secondary text-sm">Total Likes</span>
                  </div>
                  <div className="text-xl font-bold text-text-primary">{stats.totalLikes}</div>
                </div>
              </div>

              {/* Rankings List */}
              <div className="space-y-4">
                {trendingNFTs.map((nft, index) => (
                  <div key={nft.id} className="bg-background-secondary rounded-xl p-4 border border-border hover:border-purple-primary/50 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Rank */}
                        <div className={`w-10 h-10 rounded-full ${getRankBadge(nft.rank)} flex items-center justify-center font-bold`}>
                          #{nft.rank}
                        </div>
                        
                        {/* NFT Info */}
                        <div className="flex items-center gap-4">
                          <Link href={`/nft/${nft.id}`}>
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-primary/20 to-blue-500/20 rounded-lg flex items-center justify-center text-text-secondary text-xs cursor-pointer hover:opacity-90 transition-opacity relative overflow-hidden">
                              <Image
                                src={nft.image}
                                alt={nft.title}
                                fill
                                className="object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                              <span className="absolute inset-0 flex items-center justify-center text-xs opacity-50">NFT</span>
                            </div>
                          </Link>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-text-primary truncate">{nft.title}</h3>
                            <div className="text-text-secondary text-sm mb-2">
                              by{' '}
                              <UserLink
                                address={nft.creatorAddress}
                                username={nft.creator}
                                className="text-text-secondary hover:text-purple-primary"
                              />
                            </div>
                            <div className="flex items-center gap-1">
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
                          <div className="text-text-secondary text-xs">Views</div>
                          <div className="font-semibold text-text-primary">{nft.mints}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-text-secondary text-xs">Price</div>
                          <div className="font-semibold text-purple-primary">{nft.price} ETH</div>
                        </div>
                      </div>

                      {/* Action */}
                      <Link href={`/nft/${nft.id}`}>
                        <Button size="sm" variant="outline">
                          View NFT
                        </Button>
                      </Link>
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
                        <div className="text-text-secondary text-xs">Views</div>
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
                <Button variant="secondary" size="lg" onClick={fetchTrendingNFTs}>
                  Load More Trending NFTs
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}