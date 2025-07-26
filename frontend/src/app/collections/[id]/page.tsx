'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Share2, Heart, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import NFTCard from '@/components/nft/NFTCard'

const mockCollections: Record<string, any> = {
  'digital-art-series': {
    id: 'digital-art-series',
    title: 'Digital Art Series',
    description: 'A collection of abstract digital artworks exploring the boundaries between traditional and digital art forms. Each piece represents a unique perspective on the digital age.',
    itemCount: 8,
    floorPrice: '0.000111',
    totalVolume: '2.34',
    owner: 'golumdexter',
    ownerAddress: '0x123...abc',
    nfts: [
      {
        id: 101,
        title: 'Digital Aurora #1',
        creator: 'golumdexter',
        creatorAddress: '0x123...abc',
        image: '/images/placeholder-nft.jpg',
        price: '0.000111',
        promoted: false,
        likes: 24,
        mints: 12,
        networkId: 8453
      },
      {
        id: 102,
        title: 'Digital Aurora #2',
        creator: 'golumdexter',
        creatorAddress: '0x123...abc',
        image: '/images/placeholder-nft.jpg',
        price: '0.000125',
        promoted: false,
        likes: 18,
        mints: 8,
        networkId: 8453
      },
      {
        id: 103,
        title: 'Digital Aurora #3',
        creator: 'golumdexter',
        creatorAddress: '0x123...abc',
        image: '/images/placeholder-nft.jpg',
        price: '0.000150',
        promoted: false,
        likes: 35,
        mints: 19,
        networkId: 8453
      },
      {
        id: 104,
        title: 'Digital Aurora #4',
        creator: 'golumdexter',
        creatorAddress: '0x123...abc',
        image: '/images/placeholder-nft.jpg',
        price: '0.000133',
        promoted: false,
        likes: 22,
        mints: 14,
        networkId: 8453
      }
    ]
  },
  'cyberpunk-dreams': {
    id: 'cyberpunk-dreams',
    title: 'Cyberpunk Dreams',
    description: 'Futuristic cyberpunk inspired digital art collection featuring neon aesthetics and dystopian themes.',
    itemCount: 12,
    floorPrice: '0.000222',
    totalVolume: '5.67',
    owner: 'golumdexter',
    ownerAddress: '0x123...abc',
    nfts: [
      {
        id: 201,
        title: 'Neon City #1',
        creator: 'golumdexter',
        creatorAddress: '0x123...abc',
        image: '/images/placeholder-nft.jpg',
        price: '0.000222',
        promoted: false,
        likes: 42,
        mints: 23,
        networkId: 8453
      },
      {
        id: 202,
        title: 'Cyber Samurai #1',
        creator: 'golumdexter',
        creatorAddress: '0x123...abc',
        image: '/images/placeholder-nft.jpg',
        price: '0.000245',
        promoted: false,
        likes: 38,
        mints: 20,
        networkId: 8453
      }
    ]
  },
  'nature-vibes': {
    id: 'nature-vibes',
    title: 'Nature Vibes',
    description: 'Beautiful nature-inspired NFT collection capturing the essence of natural beauty in digital form.',
    itemCount: 15,
    floorPrice: '0.000099',
    totalVolume: '1.89',
    owner: 'golumdexter',
    ownerAddress: '0x123...abc',
    nfts: [
      {
        id: 301,
        title: 'Forest Dreams #1',
        creator: 'golumdexter',
        creatorAddress: '0x123...abc',
        image: '/images/placeholder-nft.jpg',
        price: '0.000099',
        promoted: false,
        likes: 31,
        mints: 15,
        networkId: 8453
      },
      {
        id: 302,
        title: 'Ocean Waves #1',
        creator: 'golumdexter',
        creatorAddress: '0x123...abc',
        image: '/images/placeholder-nft.jpg',
        price: '0.000110',
        promoted: false,
        likes: 28,
        mints: 12,
        networkId: 8453
      }
    ]
  }
}

interface CollectionDetailProps {
  params: {
    id: string
  }
}

export default function CollectionDetail({ params }: CollectionDetailProps) {
  const [sortBy, setSortBy] = useState('newest')
  const collection = mockCollections[params.id]

  if (!collection) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-4">Collection Not Found</h1>
          <p className="text-text-secondary mb-6">The collection you're looking for doesn't exist.</p>
          <Link href="/profile/0x123...abc" className="btn-primary">
            Back to Profile
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-background-secondary border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Back Button */}
          <Link href="/profile/0x123...abc" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-6">
            <ArrowLeft size={20} />
            Back to Profile
          </Link>

          {/* Collection Header */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Collection Image */}
            <div className="w-full lg:w-80 flex-shrink-0">
              <div className="aspect-square bg-gradient-to-br from-purple-primary/20 to-blue-500/20 rounded-2xl flex items-center justify-center">
                <div className="text-text-secondary text-2xl font-bold">Collection</div>
              </div>
            </div>

            {/* Collection Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-text-primary mb-4">{collection.title}</h1>
              <p className="text-text-secondary text-lg mb-6 leading-relaxed">
                {collection.description}
              </p>

              {/* Collection Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                <div className="text-center p-4 bg-background-primary rounded-xl border border-border">
                  <div className="text-2xl font-bold text-text-primary">{collection.itemCount}</div>
                  <div className="text-text-secondary text-sm">Items</div>
                </div>
                <div className="text-center p-4 bg-background-primary rounded-xl border border-border">
                  <div className="text-2xl font-bold text-purple-primary">{collection.floorPrice}</div>
                  <div className="text-text-secondary text-sm">Floor Price</div>
                </div>
                <div className="text-center p-4 bg-background-primary rounded-xl border border-border">
                  <div className="text-2xl font-bold text-text-primary">{collection.totalVolume}</div>
                  <div className="text-text-secondary text-sm">Total Volume</div>
                </div>
                <div className="text-center p-4 bg-background-primary rounded-xl border border-border">
                  <div className="text-2xl font-bold text-text-primary">{collection.owner}</div>
                  <div className="text-text-secondary text-sm">Owner</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button className="btn-primary">
                  <Heart size={18} />
                  Favorite
                </button>
                <button className="btn-secondary">
                  <Share2 size={18} />
                  Share
                </button>
                <button className="btn-secondary">
                  <ExternalLink size={18} />
                  View on Explorer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NFTs Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filter and Sort */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-text-primary">
            Items ({collection.nfts.length})
          </h2>
          
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-background-secondary border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-primary"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>

        {/* NFTs Grid */}
        {collection.nfts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {collection.nfts.map((nft: any, index: number) => (
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
            <div className="text-text-secondary mb-4">No NFTs in this collection yet</div>
          </div>
        )}
      </div>
    </div>
  )
}