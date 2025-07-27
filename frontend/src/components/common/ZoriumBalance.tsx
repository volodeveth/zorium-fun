'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Coins, Loader2 } from 'lucide-react'
import { formatZoriumBalance, getZoriumBalance } from '@/lib/utils/numberFormatter'

export default function ZoriumBalance() {
  const { address, isConnected } = useAccount()
  const [balance, setBalance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isConnected && address) {
      fetchBalance()
    } else {
      setBalance(null)
      setIsLoading(false)
    }
  }, [isConnected, address])

  const fetchBalance = async () => {
    if (!address) return
    
    setIsLoading(true)
    try {
      const userBalance = await getZoriumBalance(address)
      setBalance(userBalance)
    } catch (error) {
      console.error('Error fetching ZRM balance:', error)
      setBalance(0)
    } finally {
      setIsLoading(false)
    }
  }

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
              {balance !== null ? formatZoriumBalance(balance) : '0'}
            </span>
            <span className="text-text-secondary text-sm">ZRM</span>
          </>
        )}
      </div>
    </div>
  )
}