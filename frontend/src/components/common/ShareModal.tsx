'use client'

import { useState } from 'react'
import { X, Copy, Twitter, Send, Link, Check, Zap } from 'lucide-react'
import Button from '@/components/common/Button'
import { useReferral } from '@/hooks/useReferral'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  nftId: string | number
  nftTitle: string
  userOwnsNFT?: boolean
}

export default function ShareModal({ isOpen, onClose, nftId, nftTitle, userOwnsNFT = false }: ShareModalProps) {
  const [copied, setCopied] = useState(false)
  const { shareToTwitter, shareToTelegram, shareToFarcaster, copyReferralLink } = useReferral()

  if (!isOpen) return null

  const handleCopyLink = async () => {
    const success = await copyReferralLink(nftId, userOwnsNFT)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleTwitterShare = () => {
    shareToTwitter(nftId, nftTitle, userOwnsNFT)
    onClose()
  }

  const handleTelegramShare = () => {
    shareToTelegram(nftId, nftTitle, userOwnsNFT)
    onClose()
  }

  const handleFarcasterShare = () => {
    shareToFarcaster(nftId, nftTitle, userOwnsNFT)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background-secondary rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-text-primary">Share NFT</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-background-tertiary rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="text-lg font-medium text-text-primary mb-2">{nftTitle}</div>
            <div className="text-text-secondary text-sm">
              {userOwnsNFT 
                ? "Share this NFT and earn referral rewards when someone mints!"
                : "Share this NFT with others!"
              }
            </div>
          </div>

          {/* Share Options */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={handleCopyLink}
              className="flex flex-col items-center gap-2 p-4 bg-background-tertiary hover:bg-background-tertiary/80 rounded-xl transition-colors"
            >
              {copied ? (
                <Check size={24} className="text-green-400" />
              ) : (
                <Copy size={24} className="text-text-primary" />
              )}
              <span className="text-text-primary text-sm font-medium">
                {copied ? 'Copied!' : 'Copy Link'}
              </span>
            </button>

            <button
              onClick={handleTwitterShare}
              className="flex flex-col items-center gap-2 p-4 bg-background-tertiary hover:bg-background-tertiary/80 rounded-xl transition-colors"
            >
              <Twitter size={24} className="text-blue-400" />
              <span className="text-text-primary text-sm font-medium">Twitter</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleTelegramShare}
              className="flex flex-col items-center gap-2 p-4 bg-background-tertiary hover:bg-background-tertiary/80 rounded-xl transition-colors"
            >
              <Send size={24} className="text-blue-500" />
              <span className="text-text-primary text-sm font-medium">Telegram</span>
            </button>

            <button
              onClick={handleFarcasterShare}
              className="flex flex-col items-center gap-2 p-4 bg-background-tertiary hover:bg-background-tertiary/80 rounded-xl transition-colors"
            >
              <Zap size={24} className="text-purple-400" />
              <span className="text-text-primary text-sm font-medium">Farcaster</span>
            </button>
          </div>

          {/* Referral Info - only show if user owns NFT */}
          {userOwnsNFT && (
            <div className="bg-purple-primary/10 border border-purple-primary/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Link size={16} className="text-purple-primary" />
                </div>
                <div>
                  <h4 className="text-text-primary font-medium mb-1">Earn Referral Rewards</h4>
                  <p className="text-text-secondary text-sm">
                    When someone mints this NFT through your link, you'll receive{' '}
                    <span className="text-purple-primary font-medium">20% of the mint fee</span> as a referral reward!
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}