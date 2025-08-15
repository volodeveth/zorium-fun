'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount, useReadContract, useWriteContract } from 'wagmi'
import { Coins, CheckCircle, AlertCircle, Loader2, Send } from 'lucide-react'
import { ZORIUM_TOKEN_ADDRESS } from '@/lib/web3/wagmi'
import { useZRMContract } from '@/hooks/useZRMContract'
import { toast } from 'sonner'

export default function Promote() {
  const { address, isConnected } = useAccount()
  const [approvalAmount, setApprovalAmount] = useState('100000')
  const [isApproving, setIsApproving] = useState(false)
  const [approvalStatus, setApprovalStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [forceUpdate, setForceUpdate] = useState(0)
  const [hasShownToast, setHasShownToast] = useState(false)
  const { writeContract } = useWriteContract()
  
  // Add ZRM contract integration
  const { 
    userZRMBalance, 
    allocatedBalance, 
    allowance, 
    depositUserZRM, 
    isLoading: contractLoading,
    isWaitingForApproval,
    isWaitingForDeposit
  } = useZRMContract()

  // Force rerender function
  const triggerRerender = useCallback(() => {
    console.log('🔄 Forcing component rerender...')
    setForceUpdate(prev => prev + 1)
  }, [])

  // Calculate if user has enough allowance to deposit the approval amount
  const hasAllowance = allowance && approvalAmount && parseFloat(allowance) >= parseFloat(approvalAmount)
  const canDeposit = hasAllowance && parseFloat(approvalAmount) > 0

  // Watch for allowance changes and show toast when ready to deposit
  useEffect(() => {
    console.log('🔍 Allowance changed:', allowance)
    if (allowance && parseFloat(allowance) >= parseFloat(approvalAmount) && approvalAmount && !hasShownToast) {
      console.log('💚 Allowance sufficient for deposit!')
      triggerRerender()
      
      // Show toast notification only once
      toast.success('Ready to Deposit!', {
        description: `${parseFloat(allowance).toLocaleString()} ZRM approved. Click the green button to deposit.`,
        duration: 4000,
      })
      
      setHasShownToast(true)
    }
  }, [allowance, approvalAmount, triggerRerender, hasShownToast])

  // Reset toast flag when approval amount changes
  useEffect(() => {
    setHasShownToast(false)
  }, [approvalAmount])


  const handleDepositApprovedTokens = async () => {
    if (!approvalAmount || isNaN(Number(approvalAmount))) return
    
    try {
      await depositUserZRM(approvalAmount)
      setApprovalStatus('idle') // Reset after successful deposit
    } catch (error) {
      console.error('Deposit failed:', error)
    }
  }

  const handleApproval = async () => {
    if (!isConnected || !address) {
      setApprovalStatus('error')
      return
    }

    setIsApproving(true)
    setApprovalStatus('idle')

    try {
      await writeContract({
        address: ZORIUM_TOKEN_ADDRESS as `0x${string}`,
        abi: [
          {
            inputs: [
              { name: 'spender', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ],
            name: 'approve',
            outputs: [{ name: '', type: 'bool' }],
            stateMutability: 'nonpayable',
            type: 'function'
          }
        ],
        functionName: 'approve',
        args: ['0x1B2221E8c1AEdf3a6Db7929453A253739dC64f3c' as `0x${string}`, BigInt(approvalAmount) * BigInt(10**18)]
      })
      
      setApprovalStatus('success')
    } catch (error) {
      console.error('Approval failed:', error)
      setApprovalStatus('error')
    } finally {
      setIsApproving(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-background-secondary rounded-xl border border-border p-8 text-center">
          <AlertCircle size={48} className="text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text-primary mb-4">Connect Wallet Required</h2>
          <p className="text-text-secondary">
            Please connect your wallet to manage NFT promotions and approve ZRM tokens.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div key={`promote-${forceUpdate}-${allowance}`} className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">NFT Promotion</h1>
        <p className="text-text-secondary">
          Manage your ZRM tokens for NFT promotions. The button will automatically change from "Approve" to "Deposit" after approval.
        </p>
      </div>

      {/* Account Balance Overview */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-background-secondary rounded-xl border border-border p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-primary mb-1">{parseFloat(userZRMBalance).toLocaleString()}</div>
            <div className="text-text-secondary text-sm">ZRM in Wallet</div>
          </div>
        </div>
        <div className="bg-background-secondary rounded-xl border border-border p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500 mb-1">{parseFloat(allocatedBalance).toLocaleString()}</div>
            <div className="text-text-secondary text-sm">ZRM on Platform</div>
          </div>
        </div>
        <div className="bg-background-secondary rounded-xl border border-border p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500 mb-1">{parseFloat(allowance).toLocaleString()}</div>
            <div className="text-text-secondary text-sm">Current Allowance</div>
          </div>
        </div>
      </div>

      {/* ZRM Token Approval Section */}
      <div className="bg-background-secondary rounded-xl border border-border p-8 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Coins size={24} className="text-purple-primary" />
          <h2 className="text-xl font-bold text-text-primary">ZRM Token Approval</h2>
        </div>

        <div className="space-y-6">
          <div className="bg-purple-primary/10 border border-purple-primary/20 rounded-lg p-4">
            <h3 className="text-purple-primary font-semibold mb-2">How it works</h3>
            <ul className="text-text-secondary text-sm space-y-1 list-disc list-inside">
              <li>Step 1: Approve ZRM tokens (purple button)</li>
              <li>Step 2: Deposit approved tokens (green button appears)</li>
              <li>Step 3: Use deposited tokens to promote your NFTs</li>
              <li>Tokens are only spent when you actually promote an NFT</li>
            </ul>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-text-primary font-medium mb-2">
                Approval Amount (ZRM)
              </label>
              <input
                type="number"
                value={approvalAmount}
                onChange={(e) => setApprovalAmount(e.target.value)}
                placeholder="100000"
                className="w-full bg-background-tertiary border border-border rounded-lg px-4 py-3 text-text-primary placeholder-text-secondary focus:outline-none focus:border-purple-primary transition-colors"
              />
              <p className="text-text-secondary text-sm mt-1">
                Recommended: 100,000 ZRM (for multiple promotions)
              </p>
            </div>

            <div>
              <label className="block text-text-primary font-medium mb-2">
                Current Allowance
              </label>
              <div className="bg-background-tertiary border border-border rounded-lg px-4 py-3">
                <span className="text-text-primary">
                  {parseFloat(allowance).toLocaleString()} ZRM
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={canDeposit ? handleDepositApprovedTokens : handleApproval}
            disabled={(isApproving || contractLoading || isWaitingForApproval || isWaitingForDeposit) || !approvalAmount || Number(approvalAmount) <= 0}
            className={`w-full font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 ${
              canDeposit 
                ? 'bg-green-500 hover:bg-green-600 text-white' 
                : 'bg-purple-primary hover:bg-purple-hover text-white'
            } ${
              (isApproving || contractLoading || isWaitingForApproval || isWaitingForDeposit) || !approvalAmount || Number(approvalAmount) <= 0
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
          >
            {isApproving || contractLoading || isWaitingForApproval || isWaitingForDeposit ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                {isWaitingForApproval ? 'Waiting for approval...' : isWaitingForDeposit ? 'Depositing...' : canDeposit ? 'Depositing...' : 'Approving...'}
              </>
            ) : canDeposit ? (
              <>
                <Send size={20} />
                Deposit {Number(approvalAmount).toLocaleString()} ZRM
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Approve {Number(approvalAmount).toLocaleString()} ZRM
              </>
            )}
          </button>

          {isWaitingForApproval && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Loader2 size={20} className="text-blue-500 animate-spin" />
                <span className="text-blue-400 font-medium">Confirming Approval...</span>
              </div>
              <p className="text-text-secondary text-sm mt-1">
                Waiting for your approval transaction to be confirmed on the blockchain...
              </p>
            </div>
          )}

          {isWaitingForDeposit && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Loader2 size={20} className="text-orange-500 animate-spin" />
                <span className="text-orange-400 font-medium">Processing Deposit...</span>
              </div>
              <p className="text-text-secondary text-sm mt-1">
                Your deposit is being processed. Please wait for confirmation...
              </p>
            </div>
          )}

          {canDeposit && !isWaitingForApproval && !isWaitingForDeposit && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle size={20} className="text-green-500" />
                <span className="text-green-400 font-medium">Ready to Deposit!</span>
              </div>
              <p className="text-text-secondary text-sm mt-1">
                Your tokens are approved. Click the green "Deposit" button above to transfer them to your platform account.
              </p>
            </div>
          )}


          {approvalStatus === 'error' && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle size={20} className="text-red-500" />
                <span className="text-red-400 font-medium">Approval Failed</span>
              </div>
              <p className="text-text-secondary text-sm mt-1">
                Please try again. Make sure you have sufficient ZRM tokens in your wallet.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Promotion Pricing Information */}
      <div className="bg-background-secondary rounded-xl border border-border p-8">
        <h2 className="text-xl font-bold text-text-primary mb-6">Promotion Pricing</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-background-tertiary rounded-lg p-4 border border-border">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-primary mb-1">10,000</div>
              <div className="text-text-secondary text-sm mb-2">ZRM</div>
              <div className="text-text-primary font-medium">12 Hours</div>
            </div>
          </div>
          
          <div className="bg-background-tertiary rounded-lg p-4 border border-border">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-primary mb-1">18,000</div>
              <div className="text-text-secondary text-sm mb-2">ZRM</div>
              <div className="text-text-primary font-medium">1 Day</div>
            </div>
          </div>
          
          <div className="bg-background-tertiary rounded-lg p-4 border border-border">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-primary mb-1">50,000</div>
              <div className="text-text-secondary text-sm mb-2">ZRM</div>
              <div className="text-text-primary font-medium">3 Days</div>
            </div>
          </div>
          
          <div className="bg-background-tertiary rounded-lg p-4 border border-border">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-primary mb-1">80,000</div>
              <div className="text-text-secondary text-sm mb-2">ZRM</div>
              <div className="text-text-primary font-medium">5 Days</div>
            </div>
          </div>
          
          <div className="bg-background-tertiary rounded-lg p-4 border border-border">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-primary mb-1">100,000</div>
              <div className="text-text-secondary text-sm mb-2">ZRM</div>
              <div className="text-text-primary font-medium">7 Days</div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <h3 className="text-blue-400 font-semibold mb-2">Promotion Benefits</h3>
          <ul className="text-text-secondary text-sm space-y-1 list-disc list-inside">
            <li>Featured placement in trending sections</li>
            <li>Higher visibility in search results</li>
            <li>Boosted discovery on explore page</li>
            <li>Priority display in category filters</li>
          </ul>
        </div>
      </div>
    </div>
  )
}