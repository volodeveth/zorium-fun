import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Heart, ExternalLink, Edit, Share2, Check, Clock, Zap } from 'lucide-react'
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
  totalSupply?: number
  isDefaultPrice?: boolean
  mintEndTime?: string
}

interface NFTCardProps {
  nft: NFT
  showEditButton?: boolean
  onEdit?: (nft: NFT) => void
  addReferralToLink?: boolean // For minted NFTs where user owns them
}

export default function NFTCard({ nft, showEditButton = false, onEdit, addReferralToLink = false }: NFTCardProps) {
  const { copyReferralLink, generateReferralLink } = useReferral()
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState<string | null>(null)
  const [isUrgent, setIsUrgent] = useState(false)

  // Timer logic for NFT cards
  useEffect(() => {
    const triggerSupply = 1000
    if (nft.isDefaultPrice && nft.mints < triggerSupply) {
      // Default price, no timer until trigger supply (1000)
      setTimeLeft(null)
      return
    }

    if (nft.mintEndTime) {
      const updateTimer = () => {
        const now = new Date()
        const endTime = new Date(nft.mintEndTime!)
        const difference = endTime.getTime() - now.getTime()
        
        if (difference <= 0) {
          setTimeLeft('Ended')
          return
        }
        
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        
        setIsUrgent(days === 0 && hours < 24)
        
        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h`)
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m`)
        } else {
          setTimeLeft(`${minutes}m`)
        }
      }
      
      updateTimer()
      const interval = setInterval(updateTimer, 60000) // Update every minute
      return () => clearInterval(interval)
    }
  }, [nft.mintEndTime, nft.isDefaultPrice, nft.mints, nft.totalSupply])

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('Share button clicked for NFT:', nft.id, 'addReferralToLink:', addReferralToLink)
    
    // Only allow referral links if user owns/minted this NFT
    const success = await copyReferralLink(nft.id, addReferralToLink)
    
    console.log('Copy result:', success)
    
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Generate NFT link with referral if user owns it
  const getNFTLink = () => {
    if (addReferralToLink) {
      return generateReferralLink(`/nft/${nft.id}`)
    }
    return `/nft/${nft.id}`
  }

  return (
    <div className="nft-card group">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden rounded-t-lg">
        {/* Mock NFT Image with gradient and title */}
        <div className={`w-full h-full flex items-center justify-center relative ${
          // Generate different gradients based on NFT ID for variety
          nft.id % 6 === 0 ? 'bg-gradient-to-br from-purple-primary/40 via-blue-500/40 to-pink-500/40' :
          nft.id % 6 === 1 ? 'bg-gradient-to-br from-blue-500/40 via-cyan-500/40 to-teal-500/40' :
          nft.id % 6 === 2 ? 'bg-gradient-to-br from-pink-500/40 via-rose-500/40 to-red-500/40' :
          nft.id % 6 === 3 ? 'bg-gradient-to-br from-green-500/40 via-emerald-500/40 to-lime-500/40' :
          nft.id % 6 === 4 ? 'bg-gradient-to-br from-orange-500/40 via-yellow-500/40 to-amber-500/40' :
          'bg-gradient-to-br from-indigo-500/40 via-purple-500/40 to-violet-500/40'
        }`}>
          <div className="text-center p-4">
            <div className="text-2xl font-bold text-white mb-2 drop-shadow-lg">
              {nft.title}
            </div>
            <div className="text-sm text-white/80 drop-shadow">
              by {nft.creator}
            </div>
            {nft.promoted && (
              <div className="mt-3 text-xs bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white font-medium">
                ✨ Featured
              </div>
            )}
          </div>
          {/* Decorative elements - vary by NFT */}
          {nft.id % 3 === 0 && (
            <>
              <div className="absolute top-4 left-4 w-8 h-8 border-2 border-white/30 rounded-full"></div>
              <div className="absolute bottom-4 right-4 w-6 h-6 border-2 border-white/30 rounded-full"></div>
            </>
          )}
          {nft.id % 3 === 1 && (
            <>
              <div className="absolute top-6 right-6 w-4 h-4 bg-white/20 rounded-full"></div>
              <div className="absolute bottom-6 left-6 w-3 h-3 bg-white/30 rounded-full"></div>
              <div className="absolute top-1/2 left-4 w-2 h-2 bg-white/40 rounded-full"></div>
            </>
          )}
          {nft.id % 3 === 2 && (
            <>
              <div className="absolute top-4 right-4 w-6 h-6 border border-white/20 rotate-45"></div>
              <div className="absolute bottom-4 left-4 w-4 h-4 border border-white/30 rotate-12"></div>
            </>
          )}
        </div>

        {/* Quick Share Button */}
        <button
          onClick={handleShare}
          className={`absolute top-3 right-3 w-8 h-8 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-200 z-10 ${
            copied 
              ? 'bg-green-500 hover:bg-green-600 opacity-100' 
              : 'bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100'
          }`}
          title={copied ? "Link copied!" : "Copy share link"}
        >
          {copied ? <Check size={14} /> : <Share2 size={14} />}
        </button>
        
        {/* Actions on hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="flex gap-2">
            <Link 
              href={getNFTLink()}
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

        {/* Timer Badge */}
        {timeLeft && (
          <div className={`mt-2 flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
            timeLeft === 'Ended' 
              ? 'bg-red-500/20 text-red-400'
              : isUrgent 
                ? 'bg-orange-500/20 text-orange-400'
                : nft.isDefaultPrice && nft.mints >= (nft.totalSupply || 1000)
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-purple-500/20 text-purple-400'
          }`}>
            {timeLeft === 'Ended' ? (
              <>
                <Clock size={10} />
                <span>Ended</span>
              </>
            ) : nft.isDefaultPrice && nft.mints >= 1000 ? (
              <>
                <Zap size={10} />
                <span>Final {timeLeft}</span>
              </>
            ) : (
              <>
                <Clock size={10} />
                <span>{timeLeft} left</span>
              </>
            )}
          </div>
        )}

        {/* No timer badge for default price under 1000 mints */}
        {nft.isDefaultPrice && nft.mints < 1000 && (
          <div className="mt-2 flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
            <Zap size={10} />
            <span>No time limit</span>
          </div>
        )}
      </div>
    </div>
  )
}