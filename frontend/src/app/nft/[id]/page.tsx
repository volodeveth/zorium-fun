'use client'

import { useState, useEffect } from 'react'
import { Heart, Share2, Flag, Eye, TrendingUp, Clock, User, Info, MessageCircle, Zap, ShoppingCart, Tag, Users, Image, Globe } from 'lucide-react'
import Button from '@/components/common/Button'
import UserLink from '@/components/common/UserLink'
import ShareModal from '@/components/common/ShareModal'
import ReferralInfo from '@/components/common/ReferralInfo'
import MintTimer from '@/components/common/MintTimer'
import { useParams } from 'next/navigation'
import { useAutoReferral, useReferral } from '@/hooks/useReferral'
import { useViewTracking } from '@/hooks/useViewTracking'
import { getExplorerUrl, getExplorerName, getNetworkName } from '@/lib/utils/networkHelpers'
import { calculateFeeBreakdown, isCreatorFirstMint } from '@/lib/utils/feeCalculator'
import MarketplaceSection from '@/components/nft/MarketplaceSection'

interface NFTData {
  id: string
  title: string
  description: string
  creator: {
    address: string
    username: string
    avatar?: string
  }
  owner: {
    address: string
    username: string
  }
  image: string
  price: string
  totalSupply: number
  mintedSupply: number
  likes: number
  isLiked: boolean
  views: number
  royalties: string
  contractAddress: string
  tokenId: string
  blockchain: string
  tokenStandard: string
  mintPrice: string
  isForSale: boolean
  salePrice?: string
  isDefaultPrice?: boolean
  mintEndTime?: string
  networkId: number
  attributes: Array<{
    trait_type: string
    value: string
  }>
  createdAt: string
  mintedAt?: string
  hasCreatorMinted?: boolean
}

interface Activity {
  id: string
  type: 'mint' | 'sale' | 'transfer' | 'list'
  user: {
    address: string
    username: string
  }
  price?: string
  timestamp: string
  hash: string
}

interface Comment {
  id: string
  user: {
    address: string
    username: string
    avatar?: string
  }
  content: string
  timestamp: string
  isOwner?: boolean
  isHolder?: boolean
}

interface Holder {
  id: string
  user: {
    address: string
    username: string
    avatar?: string
  }
  quantity: number
  firstMintDate: string
  lastActivity: string
}

export default function NFTDetail() {
  const params = useParams()
  const nftId = params.id as string
  
  // Initialize auto-referral system
  useAutoReferral()
  const { referralAddress } = useReferral()
  
  // Track views for this NFT
  const { views: viewCount, isLoading: viewsLoading } = useViewTracking({
    resourceId: nftId,
    resourceType: 'nft',
    minimumViewTime: 3000, // 3 seconds
    onViewTracked: (id, type) => {
      console.log(`Tracked view for ${type} ${id}`)
    }
  })
  
  const [activeTab, setActiveTab] = useState<'comments' | 'holders' | 'activity' | 'details'>('comments')
  const [mintQuantity, setMintQuantity] = useState(1)
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [newComment, setNewComment] = useState('')
  const [showShareModal, setShowShareModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentUserAddress, setCurrentUserAddress] = useState('0x1111...2222')
  const [userHasNFT, setUserHasNFT] = useState(true) // Mock: user has minted this NFT
  const [hasCreatorMinted, setHasCreatorMinted] = useState(false) // Mock: track if creator has minted

  // Mock data - in real app, this would come from API
  const [nftData, setNftData] = useState<NFTData>({
    id: nftId,
    title: "Cosmic Journey #" + nftId,
    description: "A beautiful representation of space exploration and cosmic wonder. This NFT captures the essence of interstellar travel through vibrant colors and dynamic composition.",
    creator: {
      address: "0x1234...5678",
      username: "cosmicartist",
      avatar: "/avatars/artist1.jpg"
    },
    owner: {
      address: "0x1234...5678",
      username: "cosmicartist"
    },
    image: "/nfts/cosmic-" + nftId + ".jpg",
    price: "0.000111",
    totalSupply: 1000,
    mintedSupply: 42,
    likes: 156,
    isLiked: false,
    views: 0, // Will be updated by useViewTracking
    royalties: "5%",
    contractAddress: "0x538D6F4fb9598dC74e15e6974049B109ae0AbC6a",
    tokenId: nftId,
    blockchain: "Zora",
    networkId: 7777777,
    tokenStandard: "ERC-721",
    mintPrice: "0.000111",
    isForSale: false,
    isDefaultPrice: true,
    mintEndTime: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // 3 days from now for demo
    attributes: [
      { trait_type: "Background", value: "Cosmic Purple" },
      { trait_type: "Style", value: "Abstract" },
      { trait_type: "Rarity", value: "Rare" },
      { trait_type: "Energy", value: "High" }
    ],
    createdAt: "2024-01-15T10:30:00Z",
    mintedAt: "2024-01-16T14:20:00Z",
    hasCreatorMinted: false
  })

  const [activities] = useState<Activity[]>([
    {
      id: "1",
      type: "mint",
      user: { address: "0xabcd...efgh", username: "collector1" },
      price: "0.000111",
      timestamp: "2024-01-20T10:00:00Z",
      hash: "0x123...456"
    },
    {
      id: "2", 
      type: "sale",
      user: { address: "0x9876...5432", username: "trader2" },
      price: "0.0002",
      timestamp: "2024-01-19T15:30:00Z",
      hash: "0x789...012"
    }
  ])

  const [comments, setComments] = useState<Comment[]>([
    {
      id: "1",
      user: { address: "0xdef...123", username: "artlover", avatar: "/avatars/user1.jpg" },
      content: "Amazing work! The colors are absolutely stunning 🎨",
      timestamp: "2024-01-20T12:00:00Z",
      isHolder: true
    },
    {
      id: "2",
      user: { address: "0xabcd...efgh", username: "collector1" },
      content: "Just minted 5 copies! Love this piece 🚀",
      timestamp: "2024-01-21T08:15:00Z",
      isHolder: true
    }
  ])

  const [holders] = useState<Holder[]>([
    {
      id: "1",
      user: { address: "0xdef...123", username: "artlover", avatar: "/avatars/user1.jpg" },
      quantity: 12,
      firstMintDate: "2024-01-16T14:20:00Z",
      lastActivity: "2024-01-20T10:30:00Z"
    },
    {
      id: "2",
      user: { address: "0xabcd...efgh", username: "collector1" },
      quantity: 8,
      firstMintDate: "2024-01-17T09:15:00Z",
      lastActivity: "2024-01-21T08:15:00Z"
    },
    {
      id: "3",
      user: { address: "0x9876...5432", username: "trader2" },
      quantity: 5,
      firstMintDate: "2024-01-18T16:45:00Z",
      lastActivity: "2024-01-19T15:30:00Z"
    },
    {
      id: "4",
      user: { address: "0x1111...2222", username: "currentuser" },
      quantity: 3,
      firstMintDate: "2024-01-19T11:00:00Z",
      lastActivity: "2024-01-22T14:20:00Z"
    },
    {
      id: "5",
      user: { address: "0x5555...6666", username: "nftfan" },
      quantity: 2,
      firstMintDate: "2024-01-20T13:30:00Z",
      lastActivity: "2024-01-20T13:30:00Z"
    }
  ])

  useEffect(() => {
    setIsLiked(nftData.isLiked)
    setLikesCount(nftData.likes)
  }, [nftData])

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1)
  }

  const handleMint = async () => {
    setIsLoading(true)
    
    // Include referral address in mint transaction if available
    const mintData = {
      nftId,
      quantity: mintQuantity,
      referralAddress: referralAddress || null,
      isCreatorFirstMint: isFirstCreatorMint,
      totalCost: totalMintCost
    }
    
    console.log('Minting with data:', mintData)
    
    // Simulate minting process
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Update NFT data and creator mint status
    setNftData(prev => ({ 
      ...prev, 
      mintedSupply: prev.mintedSupply + mintQuantity,
      hasCreatorMinted: isUserCreator ? true : prev.hasCreatorMinted
    }))
    
    setIsLoading(false)
  }


  const handleAddComment = () => {
    if (!newComment.trim() || !userHasNFT) return
    
    const comment: Comment = {
      id: Date.now().toString(),
      user: { address: currentUserAddress, username: "currentuser" },
      content: newComment,
      timestamp: new Date().toISOString(),
      isOwner: true,
      isHolder: true
    }
    
    setComments(prev => [comment, ...prev])
    setNewComment('')
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const past = new Date(timestamp)
    const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Less than an hour ago'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    return `${Math.floor(diffInHours / 24)} days ago`
  }

  // Determine if current user is creator and calculate pricing
  const isUserCreator = currentUserAddress.toLowerCase() === nftData.creator.address.toLowerCase()
  const isFirstCreatorMint = isCreatorFirstMint(currentUserAddress, nftData.creator.address, nftData.hasCreatorMinted || false)
  
  // Calculate fee breakdown based on user type
  const feeBreakdown = calculateFeeBreakdown(!!referralAddress, undefined, isFirstCreatorMint)
  const displayPrice = isFirstCreatorMint ? '0.000000' : nftData.mintPrice
  const totalMintCost = isFirstCreatorMint ? '0.000000' : (parseFloat(nftData.mintPrice) * mintQuantity).toFixed(6)

  return (
    <div className="min-h-screen bg-background-primary">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* NFT Image */}
          <div className="relative">
            <div className="aspect-square bg-gradient-to-br from-purple-primary/20 to-blue-500/20 rounded-2xl overflow-hidden">
              <div className="w-full h-full flex items-center justify-center glass-effect">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎨</div>
                  <div className="text-text-secondary">NFT #{nftId}</div>
                </div>
              </div>
            </div>
            
            {/* View Counter */}
            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1 flex items-center gap-2">
              <Eye size={16} className="text-text-secondary" />
              <span className="text-text-primary text-sm">
                {viewsLoading ? '...' : viewCount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* NFT Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-text-primary mb-4">{nftData.title}</h1>
              <p className="text-text-secondary leading-relaxed">{nftData.description}</p>
            </div>

            {/* Creator Info */}
            <div className="flex items-center gap-3 p-4 bg-background-secondary rounded-xl">
              <div className="w-12 h-12 bg-purple-primary/20 rounded-full flex items-center justify-center">
                <User size={20} className="text-purple-primary" />
              </div>
              <div>
                <div className="text-text-secondary text-sm">Created by</div>
                <div className="text-text-primary font-semibold">
                  <UserLink
                    address={nftData.creator.address}
                    username={nftData.creator.username}
                    className="text-text-primary hover:text-purple-primary font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Price and Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background-secondary rounded-xl p-4">
                <div className="text-text-secondary text-sm mb-1">
                  {isFirstCreatorMint ? "Your Price (First Mint)" : "Mint Price"}
                </div>
                <div className="text-2xl font-bold text-text-primary">
                  {isFirstCreatorMint ? (
                    <span className="text-green-500">FREE (gas only)</span>
                  ) : (
                    `${displayPrice} ETH`
                  )}
                </div>
              </div>
              <div className="bg-background-secondary rounded-xl p-4">
                <div className="text-text-secondary text-sm mb-1">Minted</div>
                <div className="text-2xl font-bold text-text-primary">
                  {nftData.mintedSupply}/{nftData.totalSupply}
                </div>
              </div>
            </div>

            {/* Mint Timer */}
            <MintTimer
              isDefaultPrice={nftData.isDefaultPrice}
              mintedSupply={nftData.mintedSupply}
              triggerSupply={1000}
              mintEndTime={nftData.mintEndTime}
            />

            {/* Actions */}
            <div className="space-y-4">
              {/* Mint Section */}
              <div className="bg-background-secondary rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-text-primary">Mint NFT</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setMintQuantity(Math.max(1, mintQuantity - 1))}
                      className="w-8 h-8 bg-background-tertiary rounded-lg flex items-center justify-center text-text-primary hover:bg-purple-primary/20 transition-colors"
                    >
                      -
                    </button>
                    <span className="text-text-primary font-medium w-8 text-center">{mintQuantity}</span>
                    <button
                      onClick={() => setMintQuantity(mintQuantity + 1)}
                      className="w-8 h-8 bg-background-tertiary rounded-lg flex items-center justify-center text-text-primary hover:bg-purple-primary/20 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
                
                {/* Quick Quantity Selection */}
                <div className="mb-4">
                  <div className="text-sm text-text-secondary mb-2">Quick select:</div>
                  <div className="flex gap-2 flex-wrap">
                    {[1, 5, 10, 100, 1000].map((qty) => (
                      <button
                        key={qty}
                        onClick={() => setMintQuantity(qty)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          mintQuantity === qty
                            ? 'bg-purple-primary text-white'
                            : 'bg-background-tertiary text-text-primary hover:bg-purple-primary/20'
                        }`}
                      >
                        {qty}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Creator First Mint Info */}
                {isFirstCreatorMint && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                      <Zap size={14} />
                      Creator First Mint Benefit
                    </div>
                    <p className="text-green-700 text-xs mt-1">
                      As the creator, your first mint is completely free! You only pay gas fees. 
                      Subsequent mints will use the set price.
                    </p>
                  </div>
                )}
                
                <div className="flex gap-3">
                  <Button
                    onClick={handleMint}
                    loading={isLoading}
                    className="flex-1"
                    leftIcon={<Zap size={16} />}
                  >
                    {isFirstCreatorMint ? (
                      `Mint ${mintQuantity} FREE (gas only)`
                    ) : (
                      `Mint ${mintQuantity} for ${totalMintCost} ETH`
                    )}
                  </Button>
                </div>
              </div>

              {/* Marketplace Section */}
              <MarketplaceSection 
                nftId={nftId}
                userOwnsNFT={userHasNFT}
                onPurchaseSuccess={() => {
                  console.log('NFT purchased successfully!')
                }}
              />

              <div className="flex gap-3">
                <Button
                  onClick={handleLike}
                  variant="ghost"
                  leftIcon={<Heart size={16} className={isLiked ? 'fill-red-500 text-red-500' : ''} />}
                >
                  {likesCount}
                </Button>
                
                <Button
                  onClick={() => setShowShareModal(true)}
                  variant="ghost"
                  leftIcon={<Share2 size={16} />}
                >
                  Share
                </Button>
                
                <a
                  href={getExplorerUrl(nftData.networkId, nftData.contractAddress, nftData.tokenId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`View on ${getExplorerName(nftData.networkId)}`}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-background-secondary"
                >
                  <Globe size={16} />
                  Explorer
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-background-secondary rounded-2xl overflow-hidden">
          <div className="border-b border-border">
            <div className="flex">
              {[
                { id: 'comments', label: 'Comments', icon: MessageCircle },
                { id: 'holders', label: 'Holders', icon: Users },
                { id: 'activity', label: 'Activity', icon: TrendingUp },
                { id: 'details', label: 'Details', icon: Info }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                    activeTab === id
                      ? 'text-purple-primary border-b-2 border-purple-primary bg-purple-primary/5'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'comments' && (
              <div className="space-y-6">
                {/* Add Comment */}
                {userHasNFT ? (
                  <div className="bg-background-tertiary rounded-lg p-4">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 bg-purple-primary/20 rounded-full flex items-center justify-center">
                        <User size={16} className="text-purple-primary" />
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Share your thoughts about this NFT..."
                          className="w-full bg-background-primary border border-border rounded-lg p-3 text-text-primary placeholder-text-secondary resize-none focus:outline-none focus:ring-2 focus:ring-purple-primary"
                          rows={3}
                        />
                        <div className="flex justify-end mt-3">
                          <Button
                            onClick={handleAddComment}
                            disabled={!newComment.trim()}
                            size="sm"
                          >
                            Post Comment
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-background-tertiary rounded-lg p-6 text-center">
                    <MessageCircle size={32} className="text-text-secondary mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-text-primary mb-2">Only Holders Can Comment</h3>
                    <p className="text-text-secondary mb-4">You need to mint this NFT to leave a comment</p>
                    <Button onClick={handleMint} leftIcon={<Zap size={16} />}>
                      Mint to Comment
                    </Button>
                  </div>
                )}

                {/* Comments List */}
                <div className="space-y-4">
                  {comments.length > 0 ? (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <div className="w-10 h-10 bg-purple-primary/20 rounded-full flex items-center justify-center">
                          <User size={16} className="text-purple-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <UserLink
                              address={comment.user.address}
                              username={comment.user.username}
                              className="text-text-primary font-medium hover:text-purple-primary"
                            />
                            {comment.isHolder && (
                              <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full border border-green-500/30">
                                Holder
                              </span>
                            )}
                            {comment.isOwner && (
                              <span className="bg-purple-primary text-white text-xs px-2 py-0.5 rounded-full">You</span>
                            )}
                            <span className="text-text-secondary text-sm">{formatTimeAgo(comment.timestamp)}</span>
                          </div>
                          <p className="text-text-primary">{comment.content}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <MessageCircle size={32} className="text-text-secondary mx-auto mb-3" />
                      <p className="text-text-secondary">No comments yet. Be the first to mint and comment!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'holders' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-text-primary">Top Holders</h3>
                  <div className="text-text-secondary text-sm">
                    {holders.reduce((total, holder) => total + holder.quantity, 0)} total owned
                  </div>
                </div>
                
                {holders.map((holder, index) => (
                  <div key={holder.id} className="flex items-center justify-between p-4 bg-background-tertiary rounded-lg hover:bg-background-tertiary/80 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="text-text-secondary font-mono text-sm w-6">
                        #{index + 1}
                      </div>
                      <div className="w-10 h-10 bg-purple-primary/20 rounded-full flex items-center justify-center">
                        <User size={16} className="text-purple-primary" />
                      </div>
                      <div>
                        <div className="text-text-primary font-medium">
                          <UserLink
                            address={holder.user.address}
                            username={holder.user.username}
                            className="text-text-primary font-medium hover:text-purple-primary"
                          />
                        </div>
                        <div className="text-text-secondary text-sm flex items-center gap-2">
                          <Clock size={12} />
                          First mint: {formatTimeAgo(holder.firstMintDate)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-text-primary font-bold text-lg">{holder.quantity}</div>
                      <div className="text-text-secondary text-sm">
                        {((holder.quantity / nftData.mintedSupply) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
                
                {holders.length === 0 && (
                  <div className="text-center py-8">
                    <Users size={32} className="text-text-secondary mx-auto mb-3" />
                    <p className="text-text-secondary">No holders yet. Be the first to mint!</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 bg-background-tertiary rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        activity.type === 'mint' ? 'bg-green-500/20 text-green-400' :
                        activity.type === 'sale' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        {activity.type === 'mint' ? <Zap size={16} /> :
                         activity.type === 'sale' ? <ShoppingCart size={16} /> :
                         <TrendingUp size={16} />}
                      </div>
                      <div>
                        <div className="text-text-primary font-medium">
                          {activity.type === 'mint' ? 'Minted' :
                           activity.type === 'sale' ? 'Sold' : 'Listed'} by{' '}
                          <UserLink
                            address={activity.user.address}
                            username={activity.user.username}
                            className="text-text-primary font-medium hover:text-purple-primary"
                          />
                        </div>
                        <div className="text-text-secondary text-sm flex items-center gap-2">
                          <Clock size={12} />
                          {formatTimeAgo(activity.timestamp)}
                        </div>
                      </div>
                    </div>
                    {activity.price && (
                      <div className="text-text-primary font-semibold">{activity.price} ETH</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Technical Details */}
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Technical Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Created</span>
                      <span className="text-text-primary">{new Date(nftData.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Contract Address</span>
                      <div className="flex items-center gap-2">
                        <span className="text-text-primary font-mono text-sm">{nftData.contractAddress}</span>
                        <a
                          href={getExplorerUrl(nftData.networkId, nftData.contractAddress)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-primary hover:text-purple-hover transition-colors"
                          title={`View contract on ${getExplorerName(nftData.networkId)}`}
                        >
                          <Globe size={14} />
                        </a>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Token ID</span>
                      <div className="flex items-center gap-2">
                        <span className="text-text-primary font-mono text-sm">#{nftData.tokenId}</span>
                        <a
                          href={getExplorerUrl(nftData.networkId, nftData.contractAddress, nftData.tokenId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-primary hover:text-purple-hover transition-colors"
                          title={`View NFT on ${getExplorerName(nftData.networkId)}`}
                        >
                          <Globe size={14} />
                        </a>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Chain</span>
                      <span className="text-text-primary">{getNetworkName(nftData.networkId)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Media</span>
                      <div className="flex items-center gap-2 text-text-primary">
                        <Image size={16} />
                        <span>Image (PNG)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        nftId={nftId}
        nftTitle={nftData.title}
        userOwnsNFT={userHasNFT}
      />

    </div>
  )
}