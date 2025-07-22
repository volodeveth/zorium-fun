'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Edit, ExternalLink, Copy, Share } from 'lucide-react'
import ProfileHeader from '@/components/profile/ProfileHeader'
import ProfileTabs from '@/components/profile/ProfileTabs'
import NFTCard from '@/components/nft/NFTCard'

const mockProfile = {
  address: '0x123...abc',
  username: 'Golum Dexter',
  bio: 'Digital artist exploring the boundaries of blockchain art. Creating unique NFTs with ZORIUM features.',
  avatar: '/images/avatar-placeholder.jpg',
  followers: 1247,
  following: 389,
  nftsCreated: 23,
  nftsMinted: 145,
  totalEarnings: '12.45'
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
        <ProfileHeader profile={mockProfile} />

        {/* Profile Tabs */}
        <ProfileTabs 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          stats={{
            created: mockNFTs.length,
            minted: mockMintedNFTs.length,
            collections: 3,
            referrals: 12
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

          {activeTab === 'referrals' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-text-primary">Referral Program</h2>
                <div className="text-text-secondary">
                  12 referrals " 2.4 ETH earned
                </div>
              </div>
              
              <div className="bg-background-secondary rounded-xl border border-border p-6 mb-6">
                <h3 className="text-text-primary font-semibold mb-4">Your Referral Link</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value="https://zorium.fun/ref/0x123...abc"
                    readOnly
                    className="flex-1 bg-background-tertiary border border-border rounded-lg px-4 py-2 text-text-primary"
                  />
                  <button className="btn-secondary">
                    <Copy size={16} />
                  </button>
                  <button className="btn-secondary">
                    <Share size={16} />
                  </button>
                </div>
              </div>

              <div className="bg-background-secondary rounded-xl border border-border p-6">
                <h3 className="text-text-primary font-semibold mb-4">Referral Stats</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-text-primary">12</div>
                    <div className="text-text-secondary text-sm">Total Referrals</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-text-primary">2.4</div>
                    <div className="text-text-secondary text-sm">ETH Earned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-text-primary">45</div>
                    <div className="text-text-secondary text-sm">NFTs Minted</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-text-primary">8</div>
                    <div className="text-text-secondary text-sm">Active This Month</div>
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