'use client'

import { useState, useEffect } from 'react'
import { X, Gift, Loader2, Coins } from 'lucide-react'
import { useEarlyBirdClaim } from '@/hooks/useEarlyBirdClaim'
import { useEarlyBirdNotification } from '@/hooks/useEarlyBirdNotification'

interface EarlyBirdNotificationProps {
  isVisible: boolean
  amount: number
  onClose: () => void
}

export default function EarlyBirdNotification({ 
  isVisible, 
  amount, 
  onClose 
}: EarlyBirdNotificationProps) {
  const [show, setShow] = useState(false)
  const { claimEarlyBird, isClaiming, lastClaimHash } = useEarlyBirdClaim()
  const { earlyBirdStatus, resetEarlyBirdStatus } = useEarlyBirdNotification()

  useEffect(() => {
    if (isVisible) {
      setShow(true)
    }
  }, [isVisible])

  // Close modal when transaction is successful
  useEffect(() => {
    if (lastClaimHash) {
      console.log('🎉 Early Bird claim successful, closing modal:', lastClaimHash)
      // Trigger a slight delay to ensure localStorage is updated
      setTimeout(() => {
        console.log('🎉 Closing modal and updating status...')
        handleClose()
        // Just trigger a refresh of the Early Bird status instead of full page reload
        window.dispatchEvent(new Event('earlybird-claimed'))
      }, 2000) // Increased delay to ensure backend processing
    }
  }, [lastClaimHash])

  const handleClose = () => {
    setShow(false)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  const handleClaimBonus = async () => {
    try {
      console.log('Claiming Early Bird bonus...')
      
      // Call the simplified claim function
      await claimEarlyBird()
      
      // Note: Modal will close automatically on success via useEffect
    } catch (error) {
      console.error('Error claiming bonus:', error)
    }
  }

  if (!isVisible) return null

  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${
      show ? 'opacity-100' : 'opacity-0'
    }`}>
      <div 
        className={`bg-background-secondary rounded-xl border border-border p-6 w-full max-w-md transform transition-all duration-300 ${
          show ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500/10 p-2 rounded-lg">
              <Gift className="h-6 w-6 text-yellow-500" />
            </div>
            <h3 className="text-xl font-bold text-text-primary">🎉 Early Bird Bonus!</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg p-4 border border-yellow-500/20">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600 mb-2">
                +{amount.toLocaleString()} ZRM
              </p>
              <p className="text-text-primary font-medium">
                Congratulations! You've been awarded {amount.toLocaleString()} ZRM tokens as an early registration bonus!
              </p>
            </div>
          </div>

          <div className="bg-background-primary rounded-lg p-4 border border-border">
            <h4 className="font-medium text-text-primary mb-2">🚀 What you can do with ZRM:</h4>
            <ul className="text-sm text-text-secondary space-y-1">
              <li>• Promote your NFTs in trending</li>
              <li>• Get enhanced visibility</li>
              <li>• Participate in exclusive campaigns</li>
              <li>• Access premium features</li>
            </ul>
          </div>

          <p className="text-xs text-text-secondary text-center">
            This offer is only available for the first 10,000 users on Zorium.fun platform
          </p>

          <div className="space-y-3">
            <button
              onClick={handleClaimBonus}
              disabled={isClaiming}
              className="w-full bg-yellow-600 text-white py-3 rounded-lg font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50"
            >
              {isClaiming ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Claiming Bonus...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Coins className="w-5 h-5" />
                  <span>Claim 10,000 ZRM Bonus</span>
                </div>
              )}
            </button>
            
            <button
              onClick={handleClose}
              className="w-full bg-gray-500 text-white py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors"
              disabled={isClaiming}
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}