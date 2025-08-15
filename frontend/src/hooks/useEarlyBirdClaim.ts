'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import { toast } from 'sonner'

const PLATFORM_CONTRACT_ADDRESS = '0x1B2221E8c1AEdf3a6Db7929453A253739dC64f3c'

const PLATFORM_ABI = [
  {
    name: 'claimEarlyBirdBonus',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [{ name: 'amount', type: 'uint256' }]
  },
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
  },
  {
    name: 'allocatedBalances',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'getAvailableZRM',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'EarlyBirdAllocated',
    type: 'event',
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' }
    ]
  }
] as const

export function useEarlyBirdClaim() {
  const { address } = useAccount()
  const [isClaiming, setIsClaiming] = useState(false)
  const [lastClaimHash, setLastClaimHash] = useState<string | null>(null)

  const { data, writeContract: claimEarlyBird, error, isPending } = useWriteContract()

  // Read contract state
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

  const { data: userBalance } = useReadContract({
    address: PLATFORM_CONTRACT_ADDRESS,
    abi: PLATFORM_ABI,
    functionName: 'allocatedBalances',
    args: address ? [address] : undefined,
  })

  const { data: availableZRM } = useReadContract({
    address: PLATFORM_CONTRACT_ADDRESS,
    abi: PLATFORM_ABI,
    functionName: 'getAvailableZRM',
  })

  // Watch for successful transaction
  useEffect(() => {
    if (data && isClaiming) {
      console.log('Early Bird claim transaction successful:', data)
      handleTransactionSuccess(data)
    }
  }, [data, isClaiming])

  // Watch for errors
  useEffect(() => {
    if (error && isClaiming) {
      console.error('Early Bird claim transaction error:', error)
      handleTransactionError(error)
    }
  }, [error, isClaiming])

  // Simple transaction handling like Wheel
  const handleTransactionSuccess = async (hash: string) => {
    setIsClaiming(false)
    setLastClaimHash(hash)
    
    // Update localStorage for UI consistency
    localStorage.setItem(`earlybird_${address}`, 'true')
    
    toast.success('🎉 Early Bird bonus claimed!', {
      description: 'Your 10,000 ZRM bonus has been added to your platform balance!',
      duration: 5000,
    })
  }

  const handleTransactionError = (error: any) => {
    setIsClaiming(false)
    console.error('Early Bird claim failed:', error)
    
    let errorMessage = 'Please try again'
    
    if (error?.reason) {
      errorMessage = error.reason
    } else if (error?.message?.includes('already received')) {
      errorMessage = 'You have already claimed your Early Bird bonus'
    } else if (error?.message?.includes('limit reached')) {
      errorMessage = 'Early Bird limit reached - sorry!'
    } else if (error?.message?.includes('user rejected')) {
      errorMessage = 'Transaction cancelled by user'
    }
    
    toast.error('Early Bird claim failed', {
      description: errorMessage,
      duration: 5000,
    })
  }

  const handleClaimEarlyBird = async () => {
    if (!address || isClaiming) return

    try {
      setIsClaiming(true)
      
      console.log('Claiming Early Bird bonus for:', address)
      
      // Pre-flight checks
      console.log('Pre-flight checks:', {
        address,
        hasReceived,
        totalUsers: totalUsers ? Number(totalUsers) : 0,
        maxUsers: maxUsers ? Number(maxUsers) : 10000,
        userBalance: userBalance ? Number(userBalance) / 1e18 : 0
      })

      // Check if user already received bonus
      if (hasReceived) {
        console.log('User already received Early Bird bonus')
        toast.error('Already claimed', {
          description: 'You have already claimed your Early Bird bonus',
          duration: 3000,
        })
        setIsClaiming(false)
        return
      }

      // Check if limit reached
      if (totalUsers && maxUsers && Number(totalUsers) >= Number(maxUsers)) {
        console.log('Early Bird limit reached')
        toast.error('Limit reached', {
          description: 'Early Bird bonus limit has been reached',
          duration: 3000,
        })
        setIsClaiming(false)
        return
      }

      console.log('All pre-flight checks passed. Executing transaction...')

      // Check if treasury has sufficient funds
      const minReward = 10000 * 1e18 // 10,000 ZRM in wei
      if (availableZRM && Number(availableZRM) < minReward) {
        console.log('Insufficient treasury funds for Early Bird:', {
          availableZRM: Number(availableZRM) / 1e18,
          requiredAmount: minReward / 1e18
        })
        toast.error('Insufficient treasury funds', {
          description: 'The treasury needs more ZRM to pay Early Bird bonuses. Please try again later.',
          duration: 5000,
        })
        setIsClaiming(false)
        return
      }

      console.log('All treasury checks passed! About to call claimEarlyBirdBonus...')

      // Call the actual claimEarlyBirdBonus function like spinWheel
      claimEarlyBird({
        address: PLATFORM_CONTRACT_ADDRESS,
        abi: PLATFORM_ABI,
        functionName: 'claimEarlyBirdBonus',
        gas: BigInt(200000), // Higher gas for writing to contract
        gasPrice: BigInt(1000000), // 0.001 gwei for Zora
      })
      
      console.log('Early Bird claim transaction initiated...')
      
    } catch (error: any) {
      setIsClaiming(false)
      console.error('Error claiming Early Bird bonus:', error)
      
      toast.error('Claim failed', {
        description: 'Unable to claim Early Bird bonus. Please try again.',
        duration: 3000,
      })
    }
  }

  return {
    claimEarlyBird: handleClaimEarlyBird,
    isClaiming: isClaiming || isPending,
    lastClaimHash,
    contractState: {
      hasReceived: hasReceived || false,
      rewardAmount: 10000,
      totalUsers: totalUsers ? Number(totalUsers) : 0,
      maxUsers: maxUsers ? Number(maxUsers) : 10000,
      userBalance: userBalance ? Number(userBalance) / 1e18 : 0,
      error
    }
  }
}