'use client'

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
  description?: string
  category?: string
}

interface NFTCardExpandedProps {
  nft: NFT
  showEditButton?: boolean
  onEdit?: (nft: NFT) => void
  addReferralToLink?: boolean
}

export default function NFTCardExpanded({ nft, showEditButton = false, onEdit, addReferralToLink = false }: NFTCardExpandedProps) {
  const { copyReferralLink, generateReferralLink } = useReferral()
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState<string | null>(null)
  const [isUrgent, setIsUrgent] = useState(false)

  // Timer logic for NFT cards
  useEffect(() => {
    const triggerSupply = 1000
    if (nft.isDefaultPrice && nft.mints < triggerSupply) {
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
      const interval = setInterval(updateTimer, 60000)
      return () => clearInterval(interval)
    }
  }, [nft.mintEndTime, nft.isDefaultPrice, nft.mints, nft.totalSupply])

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const success = await copyReferralLink(nft.id, addReferralToLink)
    
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getNFTLink = () => {
    if (addReferralToLink) {
      return generateReferralLink(`/nft/${nft.id}`)
    }
    return `/nft/${nft.id}`
  }

  return (
    <div className="bg-background-primary border border-border rounded-2xl overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        {/* Left side - NFT Image */}
        <div className="relative aspect-square overflow-hidden rounded-xl">
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
          <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
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

        {/* Right side - NFT Details */}
        <div className="flex flex-col justify-between">
          {/* Header */}
          <div>
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-2xl font-bold text-text-primary">{nft.title}</h3>
              <button className="text-text-secondary hover:text-purple-primary transition-colors">
                <Heart size={20} />
              </button>
            </div>
            
            <p className="text-text-secondary text-sm mb-4">
              by{' '}
              <UserLink
                address={nft.creatorAddress || `0x${nft.creator}`}
                username={nft.creator}
                className="text-text-secondary hover:text-purple-primary"
              />
            </p>

            {/* Description */}
            {nft.description && (
              <p className="text-text-secondary text-sm mb-4 leading-relaxed">
                {nft.description}
              </p>
            )}

            {/* Category */}
            {nft.category && (
              <div className="mb-4">
                <span className="text-xs bg-background-secondary text-text-secondary px-2 py-1 rounded-full">
                  {nft.category}
                </span>
              </div>
            )}
          </div>

          {/* Stats and Price */}
          <div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-background-secondary rounded-lg">
                <div className="text-xl font-bold text-text-primary">{nft.price} ETH</div>
                <div className="text-xs text-text-secondary">Price</div>
              </div>
              <div className="text-center p-3 bg-background-secondary rounded-lg">
                <div className="text-xl font-bold text-text-primary">{nft.mints}</div>
                <div className="text-xs text-text-secondary">Mints</div>
              </div>
            </div>

            <div className="flex justify-between items-center mb-4 text-sm text-text-secondary">
              <div className="flex items-center gap-2">
                <Heart size={16} />
                <span>{nft.likes} likes</span>
              </div>
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
            </div>

            {/* Timer Badge */}
            {timeLeft && (
              <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
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
                    <Clock size={16} />
                    <span>Minting Ended</span>
                  </>
                ) : nft.isDefaultPrice && nft.mints >= 1000 ? (
                  <>
                    <Zap size={16} />
                    <span>Final {timeLeft}</span>
                  </>
                ) : (
                  <>
                    <Clock size={16} />
                    <span>{timeLeft} left</span>
                  </>
                )}
              </div>
            )}

            {/* No timer badge for default price under 1000 mints */}
            {nft.isDefaultPrice && nft.mints < 1000 && (
              <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-green-500/20 text-green-400">
                <Zap size={16} />
                <span>No time limit</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}