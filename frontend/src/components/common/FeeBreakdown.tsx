'use client'

import { Info } from 'lucide-react'
import { calculateFeeBreakdown, formatFee, getFeePercentage } from '@/lib/utils/feeCalculator'

interface FeeBreakdownProps {
  hasReferral?: boolean
  customTotal?: number
  showTitle?: boolean
  variant?: 'default' | 'compact' | 'detailed'
  className?: string
}

export default function FeeBreakdown({ 
  hasReferral = false, 
  customTotal,
  showTitle = true,
  variant = 'default',
  className = ''
}: FeeBreakdownProps) {
  const fees = calculateFeeBreakdown(hasReferral, customTotal)
  
  if (variant === 'compact') {
    return (
      <div className={`text-sm text-text-secondary ${className}`}>
        <div className="flex justify-between items-center">
          <span>Total Fee:</span>
          <span className="font-medium text-text-primary">{formatFee(fees.total)}</span>
        </div>
        {hasReferral && (
          <div className="text-xs text-green-500 mt-1">
            ✓ Referral bonus included
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div className={`bg-background-secondary rounded-lg p-4 ${className}`}>
      {showTitle && (
        <div className="flex items-center gap-2 mb-3">
          <Info size={16} className="text-purple-primary" />
          <h4 className="font-medium text-text-primary">Fee Breakdown</h4>
        </div>
      )}
      
      <div className="space-y-2">
        {/* Total Fee */}
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="font-medium text-text-primary">Total Mint Fee</span>
          <span className="font-bold text-text-primary">{formatFee(fees.total)}</span>
        </div>
        
        {/* Creator Fee */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-text-secondary">Creator</span>
            <span className="text-xs text-text-secondary">
              ({getFeePercentage(fees.creator, fees.total)})
            </span>
          </div>
          <span className="text-text-primary">{formatFee(fees.creator)}</span>
        </div>
        
        {/* First Minter Reward */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-text-secondary">First Minter Reward</span>
            <span className="text-xs text-text-secondary">
              ({getFeePercentage(fees.firstMinter, fees.total)})
            </span>
          </div>
          <span className="text-green-500">{formatFee(fees.firstMinter)}</span>
        </div>
        
        {/* Referral Fee */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className={`text-text-secondary ${!hasReferral ? 'line-through opacity-50' : ''}`}>
              Referral Bonus
            </span>
            <span className="text-xs text-text-secondary">
              ({getFeePercentage(fees.referral, fees.total)})
            </span>
            {!hasReferral && (
              <span className="text-xs text-orange-500">
                (unused)
              </span>
            )}
          </div>
          <span className={`${hasReferral ? 'text-blue-500' : 'text-text-secondary line-through'}`}>
            {formatFee(hasReferral ? fees.referral : '0.000022')}
          </span>
        </div>
        
        {/* Platform Fee */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-text-secondary">Platform Fee</span>
            <span className="text-xs text-text-secondary">
              ({getFeePercentage(fees.platform, fees.total)})
            </span>
            {!hasReferral && (
              <span className="text-xs text-purple-primary">
                (+ unused referral)
              </span>
            )}
          </div>
          <span className="text-text-primary">{formatFee(fees.platform)}</span>
        </div>
      </div>
      
      {/* Referral Status */}
      <div className="mt-3 pt-3 border-t border-border">
        {hasReferral ? (
          <div className="flex items-center gap-2 text-sm text-green-500">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Referral link used - bonus distributed</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-orange-500">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span>No referral - bonus goes to platform</span>
          </div>
        )}
      </div>
      
      {variant === 'detailed' && (
        <div className="mt-3 pt-3 border-t border-border text-xs text-text-secondary">
          <p>
            Default fee structure ensures fair distribution between creators, 
            minters, referrers, and platform sustainability.
          </p>
        </div>
      )}
    </div>
  )
}