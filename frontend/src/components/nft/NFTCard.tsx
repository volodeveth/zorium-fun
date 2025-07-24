import Link from 'next/link'
import { Heart, ExternalLink } from 'lucide-react'
import UserLink from '@/components/common/UserLink'

interface NFT {
  id: number
  title: string
  creator: string
  creatorAddress?: string
  image: string
  price: string
  promoted?: boolean
  likes: number
  mints: number
}

interface NFTCardProps {
  nft: NFT
}

export default function NFTCard({ nft }: NFTCardProps) {
  return (
    <div className="nft-card group">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        <div className="w-full h-full bg-gradient-to-br from-purple-primary/20 to-blue-500/20 flex items-center justify-center">
          <div className="text-text-secondary text-sm">NFT Preview</div>
        </div>
        
        {/* Promoted Badge */}
        {nft.promoted && (
          <div className="absolute top-3 left-3 bg-purple-primary text-white text-xs px-2 py-1 rounded-full">
            Promoted
          </div>
        )}
        
        {/* Actions on hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Link 
            href={`/nft/${nft.id}`}
            className="bg-purple-primary hover:bg-purple-hover text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <ExternalLink size={16} />
            View NFT
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-text-primary font-semibold truncate">{nft.title}</h3>
          <button className="text-text-secondary hover:text-purple-primary transition-colors">
            <Heart size={18} />
          </button>
        </div>
        
        <p className="text-text-secondary text-sm mb-3">
          by{' '}
          <UserLink
            address={nft.creatorAddress || `0x${nft.creator}`}
            username={nft.creator}
            className="text-text-secondary hover:text-purple-primary"
          />
        </p>
        
        <div className="flex justify-between items-center">
          <div className="text-text-primary font-medium">
            {nft.price} ETH
          </div>
          <div className="text-text-secondary text-sm">
            {nft.mints} mints
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-2 text-xs text-text-secondary">
          <span>{nft.likes} e</span>
          <span>{nft.mints} collected</span>
        </div>
      </div>
    </div>
  )
}