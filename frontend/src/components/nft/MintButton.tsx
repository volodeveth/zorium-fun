'use client'

import { useState, useEffect } from 'react'
import { Zap, Clock, Users, AlertCircle } from 'lucide-react'
import Button from '@/components/common/Button'
import FeeBreakdown from '@/components/common/FeeBreakdown'
import Modal from '@/components/common/Modal'
import { calculateFeeBreakdown, extractReferralFromUrl } from '@/lib/utils/feeCalculator'

interface MintButtonProps {
  nftId: string
  price: string
  maxSupply?: number
  currentSupply?: number
  mintEndTime?: string
  creatorAddress: string
  isFirstMint?: boolean
  disabled?: boolean
  onMint?: (referralAddress?: string) => void
}

export default function MintButton({
  nftId,
  price,
  maxSupply,
  currentSupply = 0,
  mintEndTime,
  creatorAddress,
  isFirstMint = false,
  disabled = false,
  onMint
}: MintButtonProps) {
  const [showFeeModal, setShowFeeModal] = useState(false)
  const [isMinting, setIsMinting] = useState(false)
  const [referralAddress, setReferralAddress] = useState<string>()
  const [timeRemaining, setTimeRemaining] = useState<string>()

  // Extract referral from URL
  useEffect(() => {
    const referral = extractReferralFromUrl()
    setReferralAddress(referral)
  }, [])

  // Calculate time remaining
  useEffect(() => {
    if (!mintEndTime) return

    const updateTimeRemaining = () => {
      const now = new Date().getTime()
      const endTime = new Date(mintEndTime).getTime()
      const timeDiff = endTime - now

      if (timeDiff <= 0) {
        setTimeRemaining('Minting ended')
        return
      }

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h remaining`)
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m remaining`)
      } else {
        setTimeRemaining(`${minutes}m remaining`)
      }
    }

    updateTimeRemaining()
    const interval = setInterval(updateTimeRemaining, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [mintEndTime])

  const handleMint = async () => {
    setIsMinting(true)
    try {
      // Simulate minting process
      await new Promise(resolve => setTimeout(resolve, 2000))
      onMint?.(referralAddress)
    } catch (error) {
      console.error('Minting failed:', error)
    } finally {
      setIsMinting(false)
    }
  }

  const isSupplyExhausted = maxSupply && currentSupply >= maxSupply
  const isMintExpired = mintEndTime && new Date() > new Date(mintEndTime)
  const canMint = !disabled && !isSupplyExhausted && !isMintExpired

  const feeBreakdown = calculateFeeBreakdown(!!referralAddress, parseFloat(price))

  return (
    <>
      <div className="space-y-3">
        {/* Mint Status Info */}
        <div className="flex items-center justify-between text-sm">
          {maxSupply && (
            <div className="flex items-center gap-1 text-text-secondary">
              <Users size={14} />
              <span>{currentSupply} / {maxSupply} minted</span>
            </div>
          )}
          
          {timeRemaining && (
            <div className="flex items-center gap-1 text-text-secondary">
              <Clock size={14} />
              <span>{timeRemaining}</span>
            </div>
          )}
        </div>

        {/* Special Badges */}
        <div className="flex gap-2">
          {isFirstMint && (
            <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full text-xs font-medium">
              <‰ First Mint - Earn 0.000011 ETH reward!
            </div>
          )}
          
          {referralAddress && (
            <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-medium">
              = Referral bonus active
            </div>
          )}
        </div>

        {/* Warning Messages */}
        {isSupplyExhausted && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertCircle size={16} />
              <span className="text-sm font-medium">Sold Out</span>
            </div>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              All {maxSupply} copies have been minted
            </p>
          </div>
        )}

        {isMintExpired && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
              <Clock size={16} />
              <span className="text-sm font-medium">Minting Ended</span>
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              The minting period for this NFT has expired
            </p>
          </div>
        )}

        {/* Fee Info */}
        <div className="bg-background-secondary rounded-lg p-3 border border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Mint Price:</span>
            <span className="font-medium text-text-primary">{price} ETH</span>
          </div>
          <button
            onClick={() => setShowFeeModal(true)}
            className="text-xs text-purple-primary hover:text-purple-hover transition-colors mt-1"
          >
            View fee breakdown ’
          </button>
        </div>

        {/* Mint Button */}
        <Button
          onClick={handleMint}
          disabled={!canMint || isMinting}
          className="w-full"
          size="lg"
        >
          {isMinting ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Minting...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Zap size={18} />
              <span>
                {isSupplyExhausted 
                  ? 'Sold Out' 
                  : isMintExpired 
                    ? 'Minting Ended' 
                    : `Mint for ${price} ETH`
                }
              </span>
            </div>
          )}
        </Button>

        {/* Additional Info */}
        {canMint && (
          <p className="text-xs text-text-secondary text-center">
            {isFirstMint 
              ? 'Be the first to mint and earn a reward!' 
              : 'Gas fees apply in addition to mint price'
            }
          </p>
        )}
      </div>

      {/* Fee Breakdown Modal */}
      <Modal
        isOpen={showFeeModal}
        onClose={() => setShowFeeModal(false)}
        title="Mint Fee Breakdown"
      >
        <div className="space-y-4">
          <FeeBreakdown
            hasReferral={!!referralAddress}
            customTotal={parseFloat(price)}
            showTitle={false}
            variant="detailed"
          />
          
          {referralAddress && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <h5 className="font-medium text-blue-700 dark:text-blue-300 mb-1">
                Referral Information
              </h5>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-mono">
                {referralAddress}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                This address will receive 20% of the mint fee as a referral bonus
              </p>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button
              onClick={() => setShowFeeModal(false)}
              variant="secondary"
              className="flex-1"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setShowFeeModal(false)
                handleMint()
              }}
              disabled={!canMint}
              className="flex-1"
            >
              <Zap size={16} />
              Mint NFT
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}