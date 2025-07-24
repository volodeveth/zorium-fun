'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Edit, ExternalLink } from 'lucide-react'
import ProfileHeader from '@/components/profile/ProfileHeader'
import ProfileTabs from '@/components/profile/ProfileTabs'
import NFTCard from '@/components/nft/NFTCard'

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

export default function ProfilePage({ params }: { params: { address: string } }) {
  const [activeTab, setActiveTab] = useState('created')

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
            created: mockNFTs.length,
            minted: mockMintedNFTs.length,
            collections: 3
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
                <button className="btn-primary">
                  <Edit size={16} className="mr-2" />
                  Manage NFTs
                </button>
              </div>
              
              {mockNFTs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {mockNFTs.map((nft, index) => (
                    <motion.div
                      key={nft.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <NFTCard nft={nft} />
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
                      <NFTCard nft={nft} />
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Mock Collections */}
                <div className="bg-background-secondary rounded-xl border border-border p-6 hover:border-purple-primary/50 transition-colors">
                  <div className="aspect-square bg-gradient-to-br from-purple-primary/20 to-blue-500/20 rounded-lg mb-4 flex items-center justify-center">
                    <div className="text-text-secondary">Collection</div>
                  </div>
                  <h3 className="text-text-primary font-semibold mb-2">Digital Art Series</h3>
                  <p className="text-text-secondary text-sm mb-4">A collection of abstract digital artworks</p>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary text-sm">8 items</span>
                    <button className="text-purple-primary hover:text-purple-hover">
                      <ExternalLink size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  )
}