'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import { parseEther } from 'viem'
import { toast } from 'sonner'

const PLATFORM_CONTRACT_ADDRESS = '0x1B2221E8c1AEdf3a6Db7929453A253739dC64f3c'

const ZRM_ABI = [
  {
    name: 'spinWheel',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [{ name: 'reward', type: 'uint256' }]
  },
  {
    name: 'canUserSpinWheel',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'getAvailableZRM',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'paused',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'WheelSpun',
    type: 'event',
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'reward', type: 'uint256' }
    ]
  }
] as const

export function useWheelSpin() {
  const { address } = useAccount()
  const [isSpinning, setIsSpinning] = useState(false)
  const [lastSpinHash, setLastSpinHash] = useState<string | null>(null)

  const { data, writeContract: spinWheel, error, isPending } = useWriteContract()

  // Read contract state for pre-flight checks
  const { data: canSpin } = useReadContract({
    address: PLATFORM_CONTRACT_ADDRESS,
    abi: ZRM_ABI,
    functionName: 'canUserSpinWheel',
    args: address ? [address] : undefined,
  })

  const { data: availableZRM } = useReadContract({
    address: PLATFORM_CONTRACT_ADDRESS,
    abi: ZRM_ABI,
    functionName: 'getAvailableZRM',
  })

  const { data: isPaused } = useReadContract({
    address: PLATFORM_CONTRACT_ADDRESS,
    abi: ZRM_ABI,
    functionName: 'paused',
  })

  // Watch for successful transaction
  useEffect(() => {
    if (data && isSpinning) {
      console.log('Transaction successful:', data)
      handleTransactionSuccess(data)
    }
  }, [data, isSpinning])

  // Watch for errors
  useEffect(() => {
    if (error && isSpinning) {
      console.error('Transaction error:', error)
      handleTransactionError(error)
    }
  }, [error, isSpinning])


  // Simple transaction handling without useWaitForTransaction
  const handleTransactionSuccess = async (hash: string) => {
    setIsSpinning(false)
    setLastSpinHash(hash)
    
    toast.success('🎉 Tokens added to your balance!', {
      description: 'Your ZRM reward has been credited to your platform account',
      duration: 5000,
    })
  }

  const handleTransactionError = (error: any) => {
    setIsSpinning(false)
    console.error('Wheel spin transaction failed:', error)
    
    // Detailed error logging
    console.error('Error details:', {
      message: error?.message,
      reason: error?.reason,
      code: error?.code,
      data: error?.data,
      stack: error?.stack
    })
    
    let errorMessage = 'Please try again'
    
    if (error?.reason) {
      errorMessage = error.reason
    } else if (error?.message?.includes('reverted')) {
      errorMessage = 'Contract execution reverted'
    } else if (error?.message?.includes('insufficient funds')) {
      errorMessage = 'Insufficient funds for gas'
    } else if (error?.message?.includes('user rejected')) {
      errorMessage = 'Transaction cancelled by user'
    }
    
    toast.error('Wheel spin failed', {
      description: errorMessage,
      duration: 5000,
    })
  }

  const handleSpinWheel = async () => {
    if (!address || isSpinning) return

    try {
      setIsSpinning(true)
      
      // Pre-flight contract state checks
      console.log('Pre-flight checks:', {
        address,
        canSpin,
        availableZRM: availableZRM ? Number(availableZRM) / 1e18 : 'unknown',
        isPaused,
        currentTimestamp: Math.floor(Date.now() / 1000)
      })

      // Check if contract is paused
      if (isPaused) {
        console.log('Contract is paused, blocking transaction')
        toast.error('Wheel temporarily unavailable', {
          description: 'The wheel is currently paused for maintenance',
          duration: 3000,
        })
        setIsSpinning(false)
        return
      }

      // Note: Skipping cooldown check here since user already spun the wheel in UI
      // The UI wheel should handle cooldown logic, modal is just for claiming the blockchain reward
      console.log('Skipping cooldown check - user already spun wheel in UI, proceeding with blockchain transaction')

      // Check if treasury has sufficient funds (minimum 25 ZRM)
      const minReward = 25 * 1e18 // 25 ZRM in wei
      if (availableZRM && Number(availableZRM) < minReward) {
        console.log('Insufficient treasury funds, blocking transaction:', {
          availableZRM: Number(availableZRM) / 1e18,
          minReward: minReward / 1e18
        })
        toast.error('Insufficient treasury funds', {
          description: 'The treasury needs more ZRM to pay rewards. Please try again later.',
          duration: 5000,
        })
        setIsSpinning(false)
        return
      }

      console.log('All pre-flight checks passed! About to call spinWheel...')

      console.log('All pre-flight checks passed. Executing transaction...')

      // Execute the smart contract transaction
      try {
        console.log('Calling spinWheel with params:', {
          address: PLATFORM_CONTRACT_ADDRESS,
          abi: ZRM_ABI,
          functionName: 'spinWheel'
        })
        
        spinWheel({
          address: PLATFORM_CONTRACT_ADDRESS,
          abi: ZRM_ABI,
          functionName: 'spinWheel',
          gas: BigInt(150000), // Explicit gas limit for Zora network
          gasPrice: BigInt(1000000), // 0.001 gwei for Zora
        })
        
        console.log('spinWheel called successfully - waiting for user wallet confirmation...')
      } catch (spinError) {
        console.error('Error calling spinWheel:', spinError)
        setIsSpinning(false)
        return
      }
      
      // Don't set isSpinning false here - wait for success/error
      
    } catch (error: any) {
      setIsSpinning(false)
      console.error('Error spinning wheel:', error)
      
      if (error.message?.includes('user rejected')) {
        toast.error('Transaction cancelled', {
          description: 'You cancelled the wheel spin',
          duration: 3000,
        })
      } else if (error.message?.includes('cooldown')) {
        toast.error('Cooldown not finished', {
          description: 'Please wait 24 hours between spins',
          duration: 3000,
        })
      } else {
        handleTransactionError(error)
      }
    }
  }

  return {
    spinWheel: handleSpinWheel,
    isSpinning: isSpinning || isPending,
    lastSpinHash,
    transactionData: data,
    contractState: {
      canSpin,
      availableZRM,
      isPaused,
      error
    }
  }
}