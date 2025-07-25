import Link from 'next/link'
import Image from 'next/image'
import { Heart, ExternalLink, Edit, Share2 } from 'lucide-react'
import UserLink from '@/components/common/UserLink'
import { getNetworkLogo, getNetworkName } from '@/lib/utils/networkHelpers'
import { useReferral } from '@/hooks/useReferral'

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
  networkId?: number
}

interface NFTCardProps {
  nft: NFT
  showEditButton?: boolean
  onEdit?: (nft: NFT) => void
}

export default function NFTCard({ nft, showEditButton = false, onEdit }: NFTCardProps) {
  const { copyReferralLink } = useReferral()

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only allow referral links if user owns/minted this NFT (for now just copy regular link)
    await copyReferralLink(nft.id, false)
  }

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

        {/* Quick Share Button */}
        <button
          onClick={handleShare}
          className="absolute top-3 right-3 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100"
          title="Copy referral link"
        >
          <Share2 size={14} />
        </button>
        
        {/* Actions on hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="flex gap-2">
            <Link 
              href={`/nft/${nft.id}`}
              className="bg-purple-primary hover:bg-purple-hover text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <ExternalLink size={16} />
              View NFT
            </Link>
            {showEditButton && onEdit && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  onEdit(nft)
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Edit size={16} />
                Manage
              </button>
            )}
          </div>
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
          <div className="flex items-center gap-1">
            <Image
              src={getNetworkLogo(nft.networkId || 8453)}
              alt={getNetworkName(nft.networkId || 8453)}
              width={16}
              height={16}
              className="rounded-full"
            />
            <span>{getNetworkName(nft.networkId || 8453)}</span>
          </div>
          <span>{nft.likes} likes</span>
        </div>
      </div>
    </div>
  )
}