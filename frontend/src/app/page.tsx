'use client'

import Link from 'next/link'
import { TrendingUp, Users, DollarSign, Zap } from 'lucide-react'
import NFTCard from '@/components/nft/NFTCard'

const mockNFTs = [
  {
    id: 1,
    title: 'Aurora',
    creator: 'artisan_01',
    creatorAddress: '0x1234...5678',
    image: '/images/placeholder-nft.jpg',
    price: '0.000111',
    promoted: true,
    likes: 24,
    mints: 12,
    networkId: 8453
  },
  {
    id: 2,
    title: 'Digital Wave', 
    creator: 'cryptoart',
    creatorAddress: '0xabcd...efgh',
    image: '/images/placeholder-nft.jpg',
    price: '0.000111',
    promoted: false,
    likes: 18,
    mints: 8,
    networkId: 7777777
  },
  {
    id: 3,
    title: 'Neon Glow',
    creator: 'pixelmaster',
    creatorAddress: '0x9876...5432',
    image: '/images/placeholder-nft.jpg',
    price: '0.000111',
    promoted: true,
    likes: 35,
    mints: 19,
    networkId: 1
  },
  {
    id: 4,
    title: 'Cyber Samurai',
    creator: 'futuristic',
    creatorAddress: '0x5555...6666',
    image: '/images/placeholder-nft.jpg',
    price: '0.000111',
    promoted: false,
    likes: 42,
    mints: 23,
    networkId: 137
  }
]

const mockStats = {
  totalNFTs: 15420,
  activeUsers: 8650,
  volume24h: 1234.56,
  volume7d: 8901.23
}

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="gradient-text">Create & Discover</span>
              <br />
              <span className="text-text-primary">NFTs on Zora Network</span>
            </h1>
            <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
              Join the revolutionary NFT marketplace where creators earn, collectors discover, 
              and communities thrive with ZORIUM token features.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/explore" className="btn-primary text-lg px-8 py-4">
                Explore NFTs
              </Link>
              <Link href="/create" className="btn-secondary text-lg px-8 py-4">
                Create NFT
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      <section className="py-16 bg-background-secondary">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Zap className="text-purple-primary" size={32} />
              </div>
              <div className="text-2xl font-bold text-text-primary">15,420</div>
              <div className="text-text-secondary">Total NFTs</div>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Users className="text-purple-primary" size={32} />
              </div>
              <div className="text-2xl font-bold text-text-primary">8,650</div>
              <div className="text-text-secondary">Active Users</div>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-2">
                <DollarSign className="text-purple-primary" size={32} />
              </div>
              <div className="text-2xl font-bold text-text-primary">{mockStats.volume24h} ETH</div>
              <div className="text-text-secondary">24h Volume</div>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-2">
                <TrendingUp className="text-purple-primary" size={32} />
              </div>
              <div className="text-2xl font-bold text-text-primary">{mockStats.volume7d} ETH</div>
              <div className="text-text-secondary">7d Volume</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured NFTs */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-text-primary">Featured NFTs</h2>
            <Link href="/explore" className="text-purple-primary hover:text-purple-hover transition-colors">
              View All →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mockNFTs.filter(nft => nft.promoted).map((nft, index) => (
              <div key={nft.id}>
                <NFTCard nft={nft} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Activity Feed */}
      <section className="py-16 bg-background-secondary">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-text-primary">Latest Activity</h2>
            <Link href="/trending" className="text-purple-primary hover:text-purple-hover transition-colors">
              View Trending →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mockNFTs.map((nft, index) => (
              <div key={`activity-${nft.id}`}>
                <NFTCard nft={nft} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <div>
            <h2 className="text-4xl font-bold mb-6 text-text-primary">
              Ready to start your NFT journey?
            </h2>
            <p className="text-xl text-text-secondary mb-8">
              Join thousands of creators and collectors on zorium.fun
            </p>
            <Link href="/create" className="btn-primary text-lg px-8 py-4">
              Create Your First NFT
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}