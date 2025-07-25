'use client'

import { useReferral } from '@/hooks/useReferral'
import { User, Gift } from 'lucide-react'

export default function ReferralInfo() {
  const { referralAddress, hasReferral } = useReferral()

  if (!hasReferral) return null

  return (
    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <Gift size={16} className="text-green-400" />
        </div>
        <div>
          <h4 className="text-text-primary font-medium mb-1">Referral Active</h4>
          <p className="text-text-secondary text-sm mb-2">
            You came through a referral link! The referrer will receive 20% of the mint fee as a reward.
          </p>
          <div className="flex items-center gap-2 text-xs">
            <User size={12} className="text-green-400" />
            <span className="text-text-secondary">Referrer:</span>
            <span className="font-mono text-green-400">{referralAddress}</span>
          </div>
        </div>
      </div>
    </div>
  )
}