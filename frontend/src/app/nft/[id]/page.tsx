'use client'

import { useState, useEffect } from 'react'
import { Heart, Share2, Flag, Eye, TrendingUp, Clock, User, Info, MessageCircle, Zap, ShoppingCart, Tag, Users, Image } from 'lucide-react'
import Button from '@/components/common/Button'
import UserLink from '@/components/common/UserLink'
import { useParams } from 'next/navigation'

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
  attributes: Array<{
    trait_type: string
    value: string
  }>
  createdAt: string
  mintedAt?: string
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
  
  const [activeTab, setActiveTab] = useState<'comments' | 'holders' | 'activity' | 'details'>('comments')
  const [mintQuantity, setMintQuantity] = useState(1)
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [newComment, setNewComment] = useState('')
  const [showSellModal, setShowSellModal] = useState(false)
  const [sellPrice, setSellPrice] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentUserAddress, setCurrentUserAddress] = useState('0x1111...2222')
  const [userHasNFT, setUserHasNFT] = useState(true) // Mock: user has minted this NFT

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
    views: 1234,
    royalties: "5%",
    contractAddress: "0x538D6F4fb9598dC74e15e6974049B109ae0AbC6a",
    tokenId: nftId,
    blockchain: "Zora",
    tokenStandard: "ERC-721",
    mintPrice: "0.000111",
    isForSale: false,
    attributes: [
      { trait_type: "Background", value: "Cosmic Purple" },
      { trait_type: "Style", value: "Abstract" },
      { trait_type: "Rarity", value: "Rare" },
      { trait_type: "Energy", value: "High" }
    ],
    createdAt: "2024-01-15T10:30:00Z",
    mintedAt: "2024-01-16T14:20:00Z"
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
    // Simulate minting process
    await new Promise(resolve => setTimeout(resolve, 2000))
    setNftData(prev => ({ ...prev, mintedSupply: prev.mintedSupply + mintQuantity }))
    setIsLoading(false)
  }

  const handleSell = async () => {
    if (!sellPrice) return
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setNftData(prev => ({ ...prev, isForSale: true, salePrice: sellPrice }))
    setShowSellModal(false)
    setIsLoading(false)
  }

  const handleBuy = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setNftData(prev => ({ ...prev, isForSale: false, salePrice: undefined }))
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
              <span className="text-text-primary text-sm">{nftData.views.toLocaleString()}</span>
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
                <div className="text-text-secondary text-sm mb-1">Mint Price</div>
                <div className="text-2xl font-bold text-text-primary">{nftData.mintPrice} ETH</div>
              </div>
              <div className="bg-background-secondary rounded-xl p-4">
                <div className="text-text-secondary text-sm mb-1">Minted</div>
                <div className="text-2xl font-bold text-text-primary">
                  {nftData.mintedSupply}/{nftData.totalSupply}
                </div>
              </div>
            </div>

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
                
                <div className="flex gap-3">
                  <Button
                    onClick={handleMint}
                    loading={isLoading}
                    className="flex-1"
                    leftIcon={<Zap size={16} />}
                  >
                    Mint {mintQuantity} for {(parseFloat(nftData.mintPrice) * mintQuantity).toFixed(6)} ETH
                  </Button>
                </div>
              </div>

              {/* Buy/Sell Section */}
              {nftData.isForSale && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-text-primary">Buy Now</h3>
                    <div className="text-2xl font-bold text-green-400">{nftData.salePrice} ETH</div>
                  </div>
                  <Button
                    onClick={handleBuy}
                    loading={isLoading}
                    variant="primary"
                    className="w-full bg-green-500 hover:bg-green-600"
                    leftIcon={<ShoppingCart size={16} />}
                  >
                    Buy Now
                  </Button>
                </div>
              )}

              <div className="flex gap-3">
                {!nftData.isForSale && (
                  <Button
                    onClick={() => setShowSellModal(true)}
                    variant="outline"
                    leftIcon={<Tag size={16} />}
                  >
                    Sell
                  </Button>
                )}
                
                <Button
                  onClick={handleLike}
                  variant="ghost"
                  leftIcon={<Heart size={16} className={isLiked ? 'fill-red-500 text-red-500' : ''} />}
                >
                  {likesCount}
                </Button>
                
                <Button
                  variant="ghost"
                  leftIcon={<Share2 size={16} />}
                >
                  Share
                </Button>
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
                      <span className="text-text-primary font-mono text-sm">{nftData.contractAddress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Chain</span>
                      <span className="text-text-primary">{nftData.blockchain}</span>
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

      {/* Sell Modal */}
      {showSellModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-text-primary mb-4">List for Sale</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-text-secondary text-sm mb-2">Sale Price (ETH)</label>
                <input
                  type="number"
                  step="0.000001"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  className="w-full bg-background-primary border border-border rounded-lg p-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-primary"
                  placeholder="0.000111"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowSellModal(false)}
                  variant="ghost"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSell}
                  loading={isLoading}
                  className="flex-1"
                  disabled={!sellPrice}
                >
                  List for Sale
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}