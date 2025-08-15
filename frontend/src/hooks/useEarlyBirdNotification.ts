'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract } from 'wagmi'

const PLATFORM_CONTRACT_ADDRESS = '0x1B2221E8c1AEdf3a6Db7929453A253739dC64f3c'

const PLATFORM_ABI = [
  {
    name: 'hasReceivedEarlyBird',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'totalEarlyBirdUsers',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'maxEarlyBirdUsers',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const

interface EarlyBirdStatus {
  isEligible: boolean
  hasReceived: boolean
  amount: number
  userNumber: number // User registration number (1-10000)
}

export function useEarlyBirdNotification() {
  const { address, isConnected } = useAccount()
  const [showNotification, setShowNotification] = useState(false)
  const [earlyBirdStatus, setEarlyBirdStatus] = useState<EarlyBirdStatus>({
    isEligible: false,
    hasReceived: false,
    amount: 10000,
    userNumber: 0
  })

  // Read contract data (like Wheel does)
  const { data: hasReceived } = useReadContract({
    address: PLATFORM_CONTRACT_ADDRESS,
    abi: PLATFORM_ABI,
    functionName: 'hasReceivedEarlyBird',
    args: address ? [address] : undefined,
  })

  const { data: totalUsers } = useReadContract({
    address: PLATFORM_CONTRACT_ADDRESS,
    abi: PLATFORM_ABI,
    functionName: 'totalEarlyBirdUsers',
  })

  const { data: maxUsers } = useReadContract({
    address: PLATFORM_CONTRACT_ADDRESS,
    abi: PLATFORM_ABI,
    functionName: 'maxEarlyBirdUsers',
  })

  useEffect(() => {
    if (isConnected && address) {
      console.log('🔍 Early Bird: useEffect triggered - checking status for:', address)
      // Add timeout to allow contract to load
      const timeoutId = setTimeout(() => {
        checkEarlyBirdStatus()
      }, 1000) // 1 second delay
      
      return () => clearTimeout(timeoutId)
    } else {
      console.log('🔍 Early Bird: useEffect triggered but no address or not connected')
      // Reset status when not connected
      setEarlyBirdStatus({
        isEligible: false,
        hasReceived: false,
        amount: 10000,
        userNumber: 0
      })
    }
  }, [address, isConnected]) // Remove contract data from deps to prevent infinite loops

  // Watch contract data changes
  useEffect(() => {
    if (isConnected && address && hasReceived !== undefined) {
      console.log('📊 Contract data updated, rechecking status')
      checkEarlyBirdStatus()
    }
  }, [hasReceived, totalUsers, maxUsers])

  // Listen for Early Bird claim events
  useEffect(() => {
    const handleEarlyBirdClaimed = () => {
      console.log('🎉 Early Bird claimed event received, refreshing status...')
      setTimeout(() => {
        checkEarlyBirdStatus()
      }, 500)
    }

    const handleShowEarlyBird = () => {
      console.log('🎯 Early Bird show event received')
      if (earlyBirdStatus.isEligible && !earlyBirdStatus.hasReceived) {
        setShowNotification(true)
      }
    }

    window.addEventListener('earlybird-claimed', handleEarlyBirdClaimed)
    window.addEventListener('earlybird-show', handleShowEarlyBird)
    return () => {
      window.removeEventListener('earlybird-claimed', handleEarlyBirdClaimed)
      window.removeEventListener('earlybird-show', handleShowEarlyBird)
    }
  }, [address, earlyBirdStatus])

  // Add global functions for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).resetEarlyBird = () => {
        console.log('Resetting Early Bird status for all addresses...')
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('earlybird_')) {
            localStorage.removeItem(key)
            console.log('Removed:', key)
          }
        })
        localStorage.removeItem('global_early_bird_count')
        console.log('All Early Bird statuses cleared. Reload page to test again.')
      }
      
      (window as any).checkEarlyBirdStatus = () => {
        console.log('Current Early Bird status:', earlyBirdStatus)
        console.log('Contract data:', { hasReceived, totalUsers, maxUsers })
        console.log('Local storage keys:', Object.keys(localStorage).filter(k => k.includes('earlybird')))
        console.log('Address:', address)
        console.log('Is connected:', isConnected)
        // Force recheck
        checkEarlyBirdStatus()
      }

      (window as any).forceShowEarlyBird = () => {
        console.log('🚀 Forcing Early Bird to show...')
        setEarlyBirdStatus({
          isEligible: true,
          hasReceived: false,
          amount: 10000,
          userNumber: 0
        })
      }

      (window as any).clearAllCache = () => {
        console.log('🧹 Clearing all cache...')
        localStorage.clear()
        sessionStorage.clear()
        // Force page reload to clear React Query cache
        window.location.reload()
      }

      (window as any).clearEarlyBirdForAddress = (addr: string) => {
        const key = `earlybird_${addr}`
        localStorage.removeItem(key)
        console.log(`Cleared Early Bird status for ${addr}`)
        if (addr === address) {
          checkEarlyBirdStatus()
        }
      }
    }
  }, [earlyBirdStatus, hasReceived, totalUsers, maxUsers])

  const checkEarlyBirdStatus = async () => {
    try {
      console.log('🔍 Early Bird: checkEarlyBirdStatus started for address:', address)
      console.log('🔍 Contract data raw:', { hasReceived, totalUsers, maxUsers })
      
      // First check localStorage for faster response
      const hasReceivedLocal = localStorage.getItem(`earlybird_${address}`) === 'true'
      
      // Read data from smart contract, with fallbacks
      const userHasReceived = hasReceived === true || hasReceivedLocal
      const currentUsers = totalUsers ? Number(totalUsers) : 0
      const maxEarlyBirdUsers = maxUsers ? Number(maxUsers) : 10000
      
      // If contract data is not loaded yet, show eligible by default
      if (hasReceived === undefined && totalUsers === undefined && maxUsers === undefined) {
        console.log('⏳ Contract data not loaded yet, showing as eligible by default')
        const status: EarlyBirdStatus = {
          isEligible: !hasReceivedLocal, // Only check localStorage
          hasReceived: hasReceivedLocal,
          amount: 10000,
          userNumber: 0
        }
        console.log('🎯 Setting fallback status:', status)
        setEarlyBirdStatus(status)
        return
      }
      
      // Check if Early Bird program is still active
      const programActive = currentUsers < maxEarlyBirdUsers
      
      // Show Early Bird if program is active and user hasn't received bonus
      const status: EarlyBirdStatus = {
        isEligible: programActive && !userHasReceived,
        hasReceived: userHasReceived,
        amount: 10000,
        userNumber: userHasReceived ? currentUsers : 0
      }

      console.log('🎯 Early Bird: Setting new status:', status)
      setEarlyBirdStatus(status)

      console.log('Early Bird Status Check:', {
        address,
        programActive,
        currentUsers,
        maxUsers: maxEarlyBirdUsers,
        hasReceived: userHasReceived,
        hasReceivedLocal,
        isEligible: status.isEligible,
        contractData: { hasReceived, totalUsers, maxUsers }
      })

      // Log the decision
      if (status.isEligible && !status.hasReceived) {
        console.log('✅ User IS eligible for Early Bird bonus - showing menu item')
      } else if (!programActive) {
        console.log('❌ Early Bird program has ended - limit reached')
      } else if (userHasReceived) {
        console.log('❌ User has already received Early Bird bonus')
      } else {
        console.log('❌ User not eligible for unknown reason')
      }

    } catch (error) {
      console.error('Failed to check early bird status:', error)
      
      // Fallback: check localStorage only
      const hasReceivedLocal = localStorage.getItem(`earlybird_${address}`) === 'true'
      setEarlyBirdStatus({
        isEligible: !hasReceivedLocal,
        hasReceived: hasReceivedLocal,
        amount: 10000,
        userNumber: 0
      })
    }
  }

  const hideNotification = () => {
    setShowNotification(false)
  }

  const resetEarlyBirdStatus = () => {
    if (address) {
      localStorage.removeItem(`earlybird_${address}`)
      console.log('Early Bird status reset for address:', address)
      // Re-check status after reset
      setTimeout(() => {
        checkEarlyBirdStatus()
      }, 100)
    }
  }

  const showNotificationManually = () => {
    if (earlyBirdStatus.isEligible && !earlyBirdStatus.hasReceived) {
      setShowNotification(true)
    }
  }

  const claimEarlyBirdBonus = async () => {
    try {
      // TODO: Implement actual claiming logic
      // This should:
      // 1. Call smart contract to allocate ZRM tokens
      // 2. Update user's ZRM balance
      // 3. Mark user as having received the bonus
      
      console.log(`Claiming early bird bonus: ${earlyBirdStatus.amount} ZRM`)
      
      // Update global counter
      const currentCount = parseInt(localStorage.getItem('global_early_bird_count') || '0')
      localStorage.setItem('global_early_bird_count', (currentCount + 1).toString())
      localStorage.setItem(`earlybird_${address}`, 'true')
      
      // Update status
      setEarlyBirdStatus(prev => ({
        ...prev,
        hasReceived: true,
        isEligible: false,
        userNumber: currentCount + 1
      }))

      return true
    } catch (error) {
      console.error('Failed to claim early bird bonus:', error)
      return false
    }
  }

  return {
    showNotification,
    hideNotification,
    showNotificationManually,
    earlyBirdStatus,
    claimEarlyBirdBonus,
    resetEarlyBirdStatus
  }
}