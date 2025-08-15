'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Edit, ExternalLink, Loader2 } from 'lucide-react'
import Link from 'next/link'
import ProfileHeader from '@/components/profile/ProfileHeader'
import ProfileTabs from '@/components/profile/ProfileTabs'
import NFTCard from '@/components/nft/NFTCard'
import NFTManageModal from '@/components/nft/NFTManageModal'
import { api } from '@/lib/api'

interface UserProfile {
  address: string
  username?: string
  displayName?: string
  bio?: string
  avatar?: string
  email?: string
  emailVerified: boolean
  createdAt: string
  followers?: number
  following?: number
  website?: string
  twitter?: {
    id: string
    username: string
    isVerified: boolean
    connectedAt: string
    profileUrl: string
  }
  farcaster?: {
    id: string
    username: string
    isVerified: boolean
    connectedAt: string
    profileUrl: string
  }
}

interface ProfileNFT {
  id: string
  name: string
  description?: string
  image: string
  price?: string
  isListed: boolean
  likeCount: number
  viewCount: number
  createdAt: string
  creator: {
    address: string
    username?: string
    displayName?: string
  }
}



export default function ProfilePage({ params }: { params: { address: string } }) {
  const [activeTab, setActiveTab] = useState('created')
  const [selectedNFT, setSelectedNFT] = useState<any>(null)
  const [isManageModalOpen, setIsManageModalOpen] = useState(false)
  
  // Real data states
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [createdNFTs, setCreatedNFTs] = useState<ProfileNFT[]>([])
  const [mintedNFTs, setMintedNFTs] = useState<ProfileNFT[]>([])
  const [collections, setCollections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch user profile and data
  useEffect(() => {
    fetchUserProfile()
  }, [params.address])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get user balance and basic info
      const response = await api.users.getZrmBalance(params.address)
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.user) {
          // Transform backend user data to profile format
          setProfile({
            address: params.address,
            username: data.user.username || data.user.displayName,
            displayName: data.user.displayName,
            bio: data.user.bio || `Digital creator on Zorium. ZRM Balance: ${data.balance} ZRM`,
            avatar: data.user.avatar,
            email: data.user.email,
            emailVerified: data.user.emailVerified || false,
            createdAt: data.user.createdAt,
            followers: 0, // TODO: Implement followers/following system
            following: 0,
            website: data.user.website
          })
        } else {
          // User not found in backend, create basic profile
          setProfile({
            address: params.address,
            username: `${params.address.slice(0, 6)}...${params.address.slice(-4)}`,
            bio: 'Web3 user on Zorium platform',
            emailVerified: false,
            createdAt: new Date().toISOString(),
            followers: 0,
            following: 0
          })
        }
      } else {
        setError('Could not load user profile')
      }
      
      // Fetch user's created NFTs
      await fetchUserNFTs()
      
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError('Error connecting to backend')
      
      // Fallback profile
      setProfile({
        address: params.address,
        username: `${params.address.slice(0, 6)}...${params.address.slice(-4)}`,
        bio: 'Web3 user on Zorium platform',
        emailVerified: false,
        createdAt: new Date().toISOString(),
        followers: 0,
        following: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchUserNFTs = async () => {
    try {
      // Get all NFTs and filter by creator
      const response = await api.nfts.getAll()
      
      if (response.ok) {
        const data = await response.json()
        const allNFTs = data.nfts || []
        
        // Filter NFTs created by this user
        const userCreatedNFTs = allNFTs
          .filter((nft: any) => nft.creator?.address?.toLowerCase() === params.address.toLowerCase())
          .map((nft: any) => ({
            id: nft.id,
            name: nft.name,
            description: nft.description,
            image: nft.image || '/images/placeholder-nft.jpg',
            price: nft.price?.toString(),
            isListed: nft.isListed,
            likeCount: nft.likeCount || 0,
            viewCount: nft.viewCount || 0,
            createdAt: nft.createdAt,
            creator: nft.creator
          }))
        
        setCreatedNFTs(userCreatedNFTs)
        
        // Filter NFTs owned by this user (minted/bought)
        const userMintedNFTs = allNFTs
          .filter((nft: any) => nft.owner?.address?.toLowerCase() === params.address.toLowerCase() && 
                               nft.creator?.address?.toLowerCase() !== params.address.toLowerCase())
          .map((nft: any) => ({
            id: nft.id,
            name: nft.name,
            description: nft.description,
            image: nft.image || '/images/placeholder-nft.jpg',
            price: nft.price?.toString(),
            isListed: nft.isListed,
            likeCount: nft.likeCount || 0,
            viewCount: nft.viewCount || 0,
            createdAt: nft.createdAt,
            creator: nft.creator
          }))
        
        setMintedNFTs(userMintedNFTs)
      }
    } catch (err) {
      console.error('Error fetching user NFTs:', err)
    }
  }

  const handleEditNFT = (nft: any) => {
    setSelectedNFT(nft)
    setIsManageModalOpen(true)
  }

  const handleUpdateNFT = (updatedNFT: any) => {
    setCreatedNFTs(prev => prev.map(nft => nft.id === updatedNFT.id ? updatedNFT : nft))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-purple-primary mx-auto mb-4" />
          <p className="text-text-secondary">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-text-primary mb-2">Profile Not Found</h2>
          <p className="text-text-secondary">Could not load profile for this address</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
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

        {/* Profile Header */}
        <ProfileHeader 
          profile={{
            address: profile.address,
            username: profile.username || profile.displayName || `${profile.address.slice(0, 6)}...${profile.address.slice(-4)}`,
            bio: profile.bio || 'Web3 user on Zorium platform',
            avatar: profile.avatar || '',
            followers: profile.followers || 0,
            following: profile.following || 0,
            website: profile.website,
            twitter: profile.twitter,
            farcaster: profile.farcaster
          }}
          isOwnProfile={true} 
          currentUserId="current-user-id"
        />

        {/* Profile Tabs */}
        <ProfileTabs 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          stats={{
            created: createdNFTs.length,
            minted: mintedNFTs.length,
            collections: collections.length
          }}
        />

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === 'created' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-text-primary">Created NFTs</h2>
              </div>
              
              {createdNFTs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {createdNFTs.map((nft, index) => {
                    // Transform to NFTCard format
                    const cardNFT = {
                      id: nft.id,
                      title: nft.name,
                      creator: nft.creator?.username || nft.creator?.displayName || `${nft.creator?.address?.slice(0, 6)}...${nft.creator?.address?.slice(-4)}`,
                      creatorAddress: nft.creator?.address,
                      image: nft.image,
                      price: nft.price || '0.001',
                      promoted: false,
                      likes: nft.likeCount,
                      mints: 1,
                      networkId: 8453
                    }
                    
                    return (
                      <motion.div
                        key={nft.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                      >
                        <NFTCard 
                          nft={cardNFT} 
                          showEditButton={true}
                          onEdit={handleEditNFT}
                        />
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-text-secondary mb-4">No NFTs created yet</div>
                  <Link href="/create" className="btn-primary">Create Your First NFT</Link>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'minted' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-text-primary">Minted NFTs</h2>
                <div className="text-text-secondary">
                  {mintedNFTs.length} items collected
                </div>
              </div>
              
              {mintedNFTs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {mintedNFTs.map((nft, index) => {
                    // Transform to NFTCard format
                    const cardNFT = {
                      id: nft.id,
                      title: nft.name,
                      creator: nft.creator?.username || nft.creator?.displayName || `${nft.creator?.address?.slice(0, 6)}...${nft.creator?.address?.slice(-4)}`,
                      creatorAddress: nft.creator?.address,
                      image: nft.image,
                      price: nft.price || '0.001',
                      promoted: false,
                      likes: nft.likeCount,
                      mints: 1,
                      networkId: 8453
                    }
                    
                    return (
                      <motion.div
                        key={nft.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                      >
                        <NFTCard 
                          nft={cardNFT} 
                          addReferralToLink={true}
                        />
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-text-secondary mb-4">No NFTs collected yet</div>
                  <Link href="/explore" className="btn-primary">Explore NFTs</Link>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'collections' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-text-primary">Collections</h2>
                <button className="btn-primary">Create Collection</button>
              </div>
              
              {collections.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {collections.map((collection, index) => (
                    <motion.div
                      key={collection.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <Link href={`/collections/${collection.id}`}>
                        <div className="bg-background-secondary rounded-xl border border-border overflow-hidden hover:border-purple-primary/50 hover:scale-105 transition-all duration-300 cursor-pointer group">
                          {/* Collection Image */}
                          <div className="aspect-square bg-gradient-to-br from-purple-primary/20 to-blue-500/20 flex items-center justify-center relative">
                            <div className="text-text-secondary text-lg font-medium">Collection</div>
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <ExternalLink size={20} className="text-purple-primary" />
                            </div>
                          </div>
                          
                          {/* Collection Info */}
                          <div className="p-6">
                            <h3 className="text-text-primary font-semibold mb-2 group-hover:text-purple-primary transition-colors">
                              {collection.name}
                            </h3>
                            <p className="text-text-secondary text-sm mb-4 line-clamp-2">
                              {collection.description || 'NFT Collection'}
                            </p>
                            
                            {/* Collection Stats */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-text-secondary">Items:</span>
                                <div className="font-semibold text-text-primary">{collection.itemCount || 0}</div>
                              </div>
                              <div>
                                <span className="text-text-secondary">Floor:</span>
                                <div className="font-semibold text-purple-primary">{collection.floorPrice || '0.001'} ETH</div>
                              </div>
                            </div>
                            
                            <div className="mt-3 pt-3 border-t border-border">
                              <div className="flex justify-between items-center">
                                <span className="text-text-secondary text-xs">Total Volume</span>
                                <span className="font-semibold text-text-primary text-sm">{collection.totalVolume || '0.0'} ETH</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-text-secondary mb-4">No collections created yet</div>
                  <Link href="/create" className="btn-primary">Create Your First Collection</Link>
                </div>
              )}
            </motion.div>
          )}

        </div>
        
        {/* NFT Management Modal */}
        {selectedNFT && (
          <NFTManageModal
            isOpen={isManageModalOpen}
            onClose={() => {
              setIsManageModalOpen(false)
              setSelectedNFT(null)
            }}
            nft={selectedNFT}
            onUpdate={handleUpdateNFT}
          />
        )}
      </div>
    </div>
  )
}