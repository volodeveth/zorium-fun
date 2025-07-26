'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Edit, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import ProfileHeader from '@/components/profile/ProfileHeader'
import ProfileTabs from '@/components/profile/ProfileTabs'
import NFTCard from '@/components/nft/NFTCard'
import NFTManageModal from '@/components/nft/NFTManageModal'

const mockProfile = {
  address: '0x123...abc',
  username: 'Golum Dexter',
  bio: 'Digital artist exploring the boundaries of blockchain art. Creating unique NFTs with ZORIUM features.',
  avatar: '/images/avatar-placeholder.jpg',
  followers: 1247,
  following: 389
}

const mockNFTs = [
  {
    id: 1,
    title: 'Aurora',
    creator: 'golumdexter',
    image: '/images/placeholder-nft.jpg',
    price: '0.000111',
    promoted: false,
    likes: 24,
    mints: 12
  },
  {
    id: 2,
    title: 'Digital Wave',
    creator: 'golumdexter', 
    image: '/images/placeholder-nft.jpg',
    price: '0.000111',
    promoted: false,
    likes: 18,
    mints: 8
  },
  {
    id: 3,
    title: 'Afterlife',
    creator: 'golumdexter',
    image: '/images/placeholder-nft.jpg',
    price: '0.000111',
    promoted: false,
    likes: 35,
    mints: 19
  }
]

const mockMintedNFTs = [
  {
    id: 4,
    title: 'Cosmic Dreams',
    creator: 'artist123',
    image: '/images/placeholder-nft.jpg',
    price: '0.000111',
    promoted: false,
    likes: 42,
    mints: 23
  },
  {
    id: 5,
    title: 'Digital Horizon',
    creator: 'creator456',
    image: '/images/placeholder-nft.jpg',
    price: '0.000111',
    promoted: false,
    likes: 31,
    mints: 15
  }
]

const mockCollections = [
  {
    id: 'digital-art-series',
    title: 'Digital Art Series',
    description: 'A collection of abstract digital artworks',
    itemCount: 8,
    floorPrice: '0.000111',
    totalVolume: '2.34',
    image: '/images/placeholder-collection.jpg'
  },
  {
    id: 'cyberpunk-dreams',
    title: 'Cyberpunk Dreams',
    description: 'Futuristic cyberpunk inspired digital art',
    itemCount: 12,
    floorPrice: '0.000222',
    totalVolume: '5.67',
    image: '/images/placeholder-collection.jpg'
  },
  {
    id: 'nature-vibes',
    title: 'Nature Vibes',
    description: 'Beautiful nature-inspired NFT collection',
    itemCount: 15,
    floorPrice: '0.000099',
    totalVolume: '1.89',
    image: '/images/placeholder-collection.jpg'
  }
]

export default function ProfilePage({ params }: { params: { address: string } }) {
  const [activeTab, setActiveTab] = useState('created')
  const [selectedNFT, setSelectedNFT] = useState<any>(null)
  const [isManageModalOpen, setIsManageModalOpen] = useState(false)
  const [nfts, setNfts] = useState(mockNFTs)

  const handleEditNFT = (nft: any) => {
    setSelectedNFT(nft)
    setIsManageModalOpen(true)
  }

  const handleUpdateNFT = (updatedNFT: any) => {
    setNfts(prev => prev.map(nft => nft.id === updatedNFT.id ? updatedNFT : nft))
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Profile Header */}
        <ProfileHeader 
          profile={mockProfile} 
          isOwnProfile={true} 
          currentUserId="current-user-id"
        />

        {/* Profile Tabs */}
        <ProfileTabs 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          stats={{
            created: nfts.length,
            minted: mockMintedNFTs.length,
            collections: mockCollections.length
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
              
              {nfts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {nfts.map((nft, index) => (
                    <motion.div
                      key={nft.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <NFTCard 
                        nft={nft} 
                        showEditButton={true}
                        onEdit={handleEditNFT}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-text-secondary mb-4">No NFTs created yet</div>
                  <button className="btn-primary">Create Your First NFT</button>
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
                  {mockMintedNFTs.length} items collected
                </div>
              </div>
              
              {mockMintedNFTs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {mockMintedNFTs.map((nft, index) => (
                    <motion.div
                      key={nft.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <NFTCard 
                        nft={nft} 
                        addReferralToLink={true}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-text-secondary mb-4">No NFTs collected yet</div>
                  <button className="btn-primary">Explore NFTs</button>
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
              
              {mockCollections.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mockCollections.map((collection, index) => (
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
                              {collection.title}
                            </h3>
                            <p className="text-text-secondary text-sm mb-4 line-clamp-2">
                              {collection.description}
                            </p>
                            
                            {/* Collection Stats */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-text-secondary">Items:</span>
                                <div className="font-semibold text-text-primary">{collection.itemCount}</div>
                              </div>
                              <div>
                                <span className="text-text-secondary">Floor:</span>
                                <div className="font-semibold text-purple-primary">{collection.floorPrice} ETH</div>
                              </div>
                            </div>
                            
                            <div className="mt-3 pt-3 border-t border-border">
                              <div className="flex justify-between items-center">
                                <span className="text-text-secondary text-xs">Total Volume</span>
                                <span className="font-semibold text-text-primary text-sm">{collection.totalVolume} ETH</span>
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
                  <button className="btn-primary">Create Your First Collection</button>
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