'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { toast } from 'sonner'

const PLATFORM_CONTRACT_ADDRESS = '0x1B2221E8c1AEdf3a6Db7929453A253739dC64f3c'
const ZRM_TOKEN_ADDRESS = '0x538D6F4fb9598dC74e15e6974049B109ae0AbC6a'

// Platform Manager ABI
const PLATFORM_ABI = [
  {
    name: 'depositToTreasury',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'allocateToUser',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'reason', type: 'string' }
    ],
    outputs: []
  },
  {
    name: 'withdrawAccumulatedFees',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'to', type: 'address' }
    ],
    outputs: []
  },
  {
    name: 'getTreasuryBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
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
    name: 'allocatedBalances',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'getPlatformStats',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'contractBalance', type: 'uint256' },
      { name: 'availableZRM', type: 'uint256' },
      { name: 'adminDeposits', type: 'uint256' },
      { name: 'userDeposits', type: 'uint256' },
      { name: 'promotionRevenue', type: 'uint256' },
      { name: 'earlyBirdAllocated', type: 'uint256' },
      { name: 'wheelRewards', type: 'uint256' },
      { name: 'adminWithdrawn', type: 'uint256' }
    ]
  },
  {
    name: 'depositZRM',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'spendOnPromotion',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: []
  },
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
    name: 'getWheelCooldownTime',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const

// ZRM Token ABI (ERC-20)
const ZRM_TOKEN_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const

export function useZRMContract() {
  const { address } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [lastApprovalTx, setLastApprovalTx] = useState<string | null>(null)
  const [lastDepositTx, setLastDepositTx] = useState<string | null>(null)
  const [pendingTxType, setPendingTxType] = useState<'approval' | 'deposit' | null>(null)
  const { writeContract, data: txHash } = useWriteContract()

  // Watch for approval transaction confirmation
  const { data: approvalReceipt, isLoading: isWaitingForApproval } = useWaitForTransactionReceipt({
    hash: lastApprovalTx as `0x${string}`,
  })

  // Watch for deposit transaction confirmation  
  const { data: depositReceipt, isLoading: isWaitingForDeposit } = useWaitForTransactionReceipt({
    hash: lastDepositTx as `0x${string}`,
  })


  // Read platform contract data
  const { data: treasuryBalance } = useReadContract({
    address: PLATFORM_CONTRACT_ADDRESS,
    abi: PLATFORM_ABI,
    functionName: 'getTreasuryBalance',
  })

  const { data: availableZRM } = useReadContract({
    address: PLATFORM_CONTRACT_ADDRESS,
    abi: PLATFORM_ABI,
    functionName: 'getAvailableZRM',
  })

  const { data: allocatedBalance, refetch: refetchAllocatedBalance } = useReadContract({
    address: PLATFORM_CONTRACT_ADDRESS,
    abi: PLATFORM_ABI,
    functionName: 'allocatedBalances',
    args: address ? [address] : undefined,
  })

  const { data: platformStats } = useReadContract({
    address: PLATFORM_CONTRACT_ADDRESS,
    abi: PLATFORM_ABI,
    functionName: 'getPlatformStats',
  })

  // Read ZRM token data
  const { data: userZRMBalance, refetch: refetchUserBalance } = useReadContract({
    address: ZRM_TOKEN_ADDRESS,
    abi: ZRM_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: ZRM_TOKEN_ADDRESS,
    abi: ZRM_TOKEN_ABI,
    functionName: 'allowance',
    args: address ? [address, PLATFORM_CONTRACT_ADDRESS] : undefined,
  })

  // Continuous polling for allowance updates
  useEffect(() => {
    if (!address) return

    console.log('🔄 Starting continuous allowance monitoring...')
    
    // Check every 2 seconds
    const interval = setInterval(() => {
      console.log('🔄 Auto-polling allowance...')
      refetchAllowance()
    }, 2000)

    // Also check when window regains focus (like tab switching)
    const handleFocus = () => {
      console.log('🔍 Window focused, refreshing allowance...')
      refetchAllowance()
    }

    window.addEventListener('focus', handleFocus)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
      console.log('🛑 Stopped allowance monitoring')
    }
  }, [address, refetchAllowance])

  // Additional polling when waiting for approval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isWaitingForApproval) {
      console.log('🔄 Starting intensive approval polling...')
      interval = setInterval(() => {
        console.log('🔄 Intensive polling allowance...')
        refetchAllowance()
      }, 1000) // Poll every 1 second when waiting
    }
    
    return () => {
      if (interval) {
        console.log('🛑 Stopping intensive polling')
        clearInterval(interval)
      }
    }
  }, [isWaitingForApproval, refetchAllowance])

  // Wheel data
  const { data: canSpinWheel } = useReadContract({
    address: PLATFORM_CONTRACT_ADDRESS,
    abi: PLATFORM_ABI,
    functionName: 'canUserSpinWheel',
    args: address ? [address] : undefined,
  })

  const { data: wheelCooldown } = useReadContract({
    address: PLATFORM_CONTRACT_ADDRESS,
    abi: PLATFORM_ABI,
    functionName: 'getWheelCooldownTime',
    args: address ? [address] : undefined,
  })

  // Function to refresh all balances
  const refreshAllBalances = () => {
    refetchUserBalance()
    refetchAllowance()
    refetchAllocatedBalance()
  }

  // Handle new transaction hash from writeContract
  useEffect(() => {
    if (txHash && pendingTxType) {
      console.log(`New ${pendingTxType} transaction:`, txHash)
      
      if (pendingTxType === 'approval') {
        setLastApprovalTx(txHash)
      } else if (pendingTxType === 'deposit') {
        setLastDepositTx(txHash)
      }
      
      setPendingTxType(null) // Clear pending type
    }
  }, [txHash, pendingTxType])

  // Handle approval confirmation
  useEffect(() => {
    if (approvalReceipt && lastApprovalTx) {
      console.log('🎉 Approval transaction confirmed:', approvalReceipt)
      console.log('Current allowance before refetch:', allowance)
      
      // Refresh allowance to update UI - try multiple times
      const refetchWithRetry = async () => {
        for (let i = 0; i < 3; i++) {
          console.log(`Refetch attempt ${i + 1}`)
          await refetchAllowance()
          
          // Wait between attempts
          if (i < 2) {
            await new Promise(resolve => setTimeout(resolve, 2000))
          }
        }
      }
      
      // Start refetching after a delay
      setTimeout(() => {
        refetchWithRetry()
      }, 1000)
      
      toast.success('Approval confirmed!', {
        description: 'You can now deposit your ZRM tokens.'
      })
      
      setLastApprovalTx(null) // Clear approval tx
    }
  }, [approvalReceipt, lastApprovalTx, refetchAllowance, allowance])

  // Handle deposit confirmation
  useEffect(() => {
    if (depositReceipt && lastDepositTx) {
      console.log('Deposit transaction confirmed:', depositReceipt)
      
      // Refresh all balances
      setTimeout(() => {
        refreshAllBalances()
      }, 1000)
      
      toast.success('Deposit completed!', {
        description: 'Your ZRM tokens have been deposited to the platform.'
      })
      
      setLastDepositTx(null) // Clear deposit tx
    }
  }, [depositReceipt, lastDepositTx])

  // Deposit ZRM to treasury
  const depositToTreasury = async (amount: string) => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      setIsLoading(true)
      const amountWei = parseEther(amount)

      // Check if we need to approve first
      const currentAllowance = allowance as bigint || BigInt(0)
      
      if (currentAllowance < amountWei) {
        toast.info('Step 1/2: Approving ZRM spending...', {
          description: 'Please approve the transaction in your wallet. You will need to confirm 2 transactions total.'
        })
        
        console.log('📝 About to call writeContract for approval...')
        
        try {
          // First approve ZRM token for platform contract
          writeContract({
            address: ZRM_TOKEN_ADDRESS,
            abi: ZRM_TOKEN_ABI,
            functionName: 'approve',
            args: [PLATFORM_CONTRACT_ADDRESS, amountWei]
          })
          
          console.log('✅ writeContract called successfully')
          
          // Start aggressive polling for allowance updates
          console.log('🚀 Starting aggressive allowance polling after approval...')
        } catch (error) {
          console.error('❌ Error in writeContract:', error)
          throw error
        }
        const startPolling = () => {
          let attempts = 0
          const maxAttempts = 30 // 30 attempts over 1 minute
          
          const pollInterval = setInterval(async () => {
            attempts++
            console.log(`🔄 Polling allowance attempt ${attempts}/${maxAttempts}`)
            
            try {
              await refetchAllowance()
              
              // Force re-render by checking if allowance has updated
              const currentAllowanceAfterRefetch = allowance as bigint || BigInt(0)
              console.log('Current allowance after refetch:', formatEther(currentAllowanceAfterRefetch))
              
              if (currentAllowanceAfterRefetch >= amountWei) {
                console.log('✅ Allowance updated! Stopping polling.')
                clearInterval(pollInterval)
                toast.success('Approval confirmed!', {
                  description: 'You can now deposit your ZRM tokens.'
                })
              }
            } catch (error) {
              console.error('Error in polling:', error)
            }
            
            if (attempts >= maxAttempts) {
              console.log('🛑 Max polling attempts reached')
              clearInterval(pollInterval)
            }
          }, 2000) // Poll every 2 seconds
        }
        
        // Start polling after a short delay
        setTimeout(startPolling, 3000)
        
        toast.success('Approval transaction sent!', {
          description: 'Waiting for confirmation... The button will turn green when ready.'
        })
        
        setIsLoading(false)
        return
      }

      toast.info('Step 2/2: Depositing ZRM to treasury...', {
        description: 'Please confirm the deposit transaction in your wallet'
      })

      // Set transaction type before calling writeContract
      setPendingTxType('deposit')

      writeContract({
        address: PLATFORM_CONTRACT_ADDRESS,
        abi: PLATFORM_ABI,
        functionName: 'depositToTreasury',
        args: [amountWei]
      })

      toast.success('Deposit transaction sent!', {
        description: 'Transaction sent to blockchain. Please wait for confirmation.'
      })

    } catch (error: any) {
      console.error('Error depositing to treasury:', error)
      if (error.message?.includes('user rejected')) {
        toast.error('Transaction cancelled')
      } else if (error.message?.includes('insufficient allowance')) {
        toast.error('Please approve ZRM spending first')
      } else {
        toast.error('Failed to deposit ZRM')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Allocate ZRM to user
  const allocateToUser = async (userAddress: string, amount: string) => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      setIsLoading(true)
      const amountWei = parseEther(amount)

      toast.info('Allocating ZRM to user...', {
        description: 'Please confirm the transaction in your wallet'
      })

      writeContract({
        address: PLATFORM_CONTRACT_ADDRESS,
        abi: PLATFORM_ABI,
        functionName: 'allocateToUser',
        args: [userAddress as `0x${string}`, amountWei, 'Manual allocation']
      })

      toast.success('Allocation initiated!', {
        description: 'Transaction sent to blockchain. Please wait for confirmation.'
      })

    } catch (error: any) {
      console.error('Error allocating to user:', error)
      if (error.message?.includes('user rejected')) {
        toast.error('Transaction cancelled')
      } else {
        toast.error('Failed to allocate ZRM')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Withdraw accumulated fees
  const withdrawFees = async (amount: string) => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      setIsLoading(true)
      const amountWei = parseEther(amount)

      toast.info('Withdrawing accumulated fees...', {
        description: 'Please confirm the transaction in your wallet'
      })

      writeContract({
        address: PLATFORM_CONTRACT_ADDRESS,
        abi: PLATFORM_ABI,
        functionName: 'withdrawAccumulatedFees',
        args: [amountWei, '0x0000000000000000000000000000000000000000'] // 0x0 means send to owner
      })

      toast.success('Withdrawal initiated!', {
        description: 'Transaction sent to blockchain. Please wait for confirmation.'
      })

    } catch (error: any) {
      console.error('Error withdrawing fees:', error)
      if (error.message?.includes('user rejected')) {
        toast.error('Transaction cancelled')
      } else {
        toast.error('Failed to withdraw fees')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // User deposit ZRM function
  const depositUserZRM = async (amount: string) => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      setIsLoading(true)
      const amountWei = parseEther(amount)

      // Check if we need to approve first
      const currentAllowance = allowance as bigint || BigInt(0)
      
      if (currentAllowance < amountWei) {
        toast.info('Step 1/2: Approving ZRM spending...', {
          description: 'Please approve the transaction in your wallet. You will need to confirm 2 transactions total.'
        })
        
        console.log('📝 About to call writeContract for user approval...')
        
        try {
          writeContract({
            address: ZRM_TOKEN_ADDRESS,
            abi: ZRM_TOKEN_ABI,
            functionName: 'approve',
            args: [PLATFORM_CONTRACT_ADDRESS, amountWei]
          })
          
          console.log('✅ user writeContract called successfully')
          
          // Start aggressive polling for allowance updates
          console.log('🚀 Starting aggressive allowance polling after user approval...')
        } catch (error) {
          console.error('❌ Error in user writeContract:', error)
          throw error
        }
        const startPolling = () => {
          let attempts = 0
          const maxAttempts = 30 // 30 attempts over 1 minute
          
          const pollInterval = setInterval(async () => {
            attempts++
            console.log(`🔄 Polling user allowance attempt ${attempts}/${maxAttempts}`)
            
            try {
              await refetchAllowance()
              
              // Force re-render by checking if allowance has updated
              const currentAllowanceAfterRefetch = allowance as bigint || BigInt(0)
              console.log('Current user allowance after refetch:', formatEther(currentAllowanceAfterRefetch))
              
              if (currentAllowanceAfterRefetch >= amountWei) {
                console.log('✅ User allowance updated! Stopping polling.')
                clearInterval(pollInterval)
                toast.success('Approval confirmed!', {
                  description: 'You can now deposit your ZRM tokens.'
                })
              }
            } catch (error) {
              console.error('Error in user polling:', error)
            }
            
            if (attempts >= maxAttempts) {
              console.log('🛑 Max user polling attempts reached')
              clearInterval(pollInterval)
            }
          }, 2000) // Poll every 2 seconds
        }
        
        // Start polling after a short delay
        setTimeout(startPolling, 3000)
        
        toast.success('Approval transaction sent!', {
          description: 'Waiting for confirmation... The button will turn green when ready.'
        })
        
        setIsLoading(false)
        return
      }

      toast.info('Step 2/2: Depositing your ZRM...', {
        description: 'Please confirm the deposit transaction in your wallet'
      })

      // Set transaction type before calling writeContract
      setPendingTxType('deposit')

      writeContract({
        address: PLATFORM_CONTRACT_ADDRESS,
        abi: PLATFORM_ABI,
        functionName: 'depositZRM',
        args: [amountWei]
      })

      toast.success('Deposit transaction sent!', {
        description: 'Transaction sent to blockchain. Please wait for confirmation.'
      })

    } catch (error: any) {
      console.error('Error depositing ZRM:', error)
      if (error.message?.includes('user rejected')) {
        toast.error('Transaction cancelled')
      } else {
        toast.error('Failed to deposit ZRM')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Spend on promotion function
  const spendOnPromotion = async (amount: string) => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      setIsLoading(true)
      const amountWei = parseEther(amount)

      toast.info('Spending ZRM on promotion...', {
        description: 'Please confirm the transaction in your wallet'
      })

      writeContract({
        address: PLATFORM_CONTRACT_ADDRESS,
        abi: PLATFORM_ABI,
        functionName: 'spendOnPromotion',
        args: [amountWei]
      })

      toast.success('Promotion payment initiated!', {
        description: 'Transaction sent to blockchain. Please wait for confirmation.'
      })

    } catch (error: any) {
      console.error('Error spending on promotion:', error)
      if (error.message?.includes('user rejected')) {
        toast.error('Transaction cancelled')
      } else {
        toast.error('Failed to spend ZRM')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Spin wheel function
  const spinWheel = async () => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      setIsLoading(true)

      toast.info('Spinning the wheel...', {
        description: 'Please confirm the transaction in your wallet'
      })

      writeContract({
        address: PLATFORM_CONTRACT_ADDRESS,
        abi: PLATFORM_ABI,
        functionName: 'spinWheel',
        args: []
      })

      toast.success('Wheel spin initiated!', {
        description: 'Transaction sent to blockchain. Please wait for your reward!'
      })

    } catch (error: any) {
      console.error('Error spinning wheel:', error)
      if (error.message?.includes('user rejected')) {
        toast.error('Transaction cancelled')
      } else if (error.message?.includes('Wheel cooldown')) {
        toast.error('You must wait 24 hours between spins')
      } else if (error.message?.includes('Insufficient treasury')) {
        toast.error('Insufficient treasury balance for rewards')
      } else {
        toast.error('Failed to spin wheel')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    // Contract data
    treasuryBalance: treasuryBalance ? formatEther(treasuryBalance as bigint) : '0',
    availableZRM: availableZRM ? formatEther(availableZRM as bigint) : '0',
    userZRMBalance: userZRMBalance ? formatEther(userZRMBalance as bigint) : '0',
    allocatedBalance: allocatedBalance ? formatEther(allocatedBalance as bigint) : '0',
    allowance: allowance ? formatEther(allowance as bigint) : '0',
    
    // Platform stats (if available)
    platformStats: platformStats ? {
      contractBalance: formatEther(platformStats[0] as bigint),
      availableZRM: formatEther(platformStats[1] as bigint),
      adminDeposits: formatEther(platformStats[2] as bigint),
      userDeposits: formatEther(platformStats[3] as bigint),
      promotionRevenue: formatEther(platformStats[4] as bigint),
      earlyBirdAllocated: formatEther(platformStats[5] as bigint),
      wheelRewards: formatEther(platformStats[6] as bigint),
      adminWithdrawn: formatEther(platformStats[7] as bigint)
    } : null,

    // Wheel data
    canSpinWheel: canSpinWheel as boolean,
    wheelCooldown: wheelCooldown ? Number(wheelCooldown) : 0,
    
    // Contract functions - Admin
    depositToTreasury,
    allocateToUser,
    withdrawFees,
    
    // Contract functions - User
    depositUserZRM,
    spendOnPromotion,
    spinWheel,
    
    // Loading state
    isLoading,
    isWaitingForApproval,
    isWaitingForDeposit
  }
}