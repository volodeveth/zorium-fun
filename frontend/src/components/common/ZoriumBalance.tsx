'use client'

import { useAccount } from 'wagmi'
import { Coins, Loader2 } from 'lucide-react'
import { formatZoriumBalance } from '@/lib/utils/numberFormatter'
import { useZRMContract } from '@/hooks/useZRMContract'

export default function ZoriumBalance() {
  const { address, isConnected } = useAccount()
  
  // Use platform allocated balance instead of wallet balance
  const { allocatedBalance, isLoading } = useZRMContract()

  // Don't render if wallet not connected
  if (!isConnected || !address) {
    return null
  }

  return (
    <div className="flex items-center gap-2 bg-background-secondary border border-border px-3 py-2 rounded-lg">
      <Coins size={16} className="text-purple-primary" />
      <div className="flex items-center gap-1">
        {isLoading ? (
          <Loader2 size={14} className="animate-spin text-text-secondary" />
        ) : (
          <>
            <span className="font-medium text-text-primary">
              {formatZoriumBalance(parseFloat(allocatedBalance))}
            </span>
            <span className="text-text-secondary text-sm">ZRM</span>
          </>
        )}
      </div>
    </div>
  )
}