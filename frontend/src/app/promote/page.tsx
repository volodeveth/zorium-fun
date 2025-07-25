'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract } from 'wagmi'
import { Coins, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { ZORIUM_TOKEN_ADDRESS } from '@/lib/web3/wagmi'

export default function Promote() {
  const { address, isConnected } = useAccount()
  const [approvalAmount, setApprovalAmount] = useState('100000')
  const [isApproving, setIsApproving] = useState(false)
  const [approvalStatus, setApprovalStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const { writeContract } = useWriteContract()

  // Read current allowance (if needed for display)
  const { data: currentAllowance } = useReadContract({
    address: ZORIUM_TOKEN_ADDRESS as `0x${string}`,
    abi: [
      {
        inputs: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' }
        ],
        name: 'allowance',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
      }
    ],
    functionName: 'allowance',
    args: [address || '0x0', ZORIUM_TOKEN_ADDRESS as `0x${string}`]
  })

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
        args: [ZORIUM_TOKEN_ADDRESS as `0x${string}`, BigInt(approvalAmount) * BigInt(10**18)]
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">NFT Promotion</h1>
        <p className="text-text-secondary">
          Manage your ZRM token approvals for NFT promotions. You need to approve ZRM tokens to promote your NFTs.
        </p>
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
              <li>Approve ZRM tokens to enable NFT promotions</li>
              <li>Approved tokens can be used for any of your NFTs</li>
              <li>Tokens are only deducted when you actually promote an NFT</li>
              <li>You can approve more tokens at any time</li>
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
                  {currentAllowance ? (Number(currentAllowance) / 10**18).toLocaleString() : '0'} ZRM
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleApproval}
            disabled={isApproving || !approvalAmount || Number(approvalAmount) <= 0}
            className={`w-full bg-purple-primary hover:bg-purple-hover text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 ${
              isApproving || !approvalAmount || Number(approvalAmount) <= 0
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
          >
            {isApproving ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Approve {Number(approvalAmount).toLocaleString()} ZRM
              </>
            )}
          </button>

          {approvalStatus === 'success' && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle size={20} className="text-green-500" />
                <span className="text-green-400 font-medium">Approval Successful!</span>
              </div>
              <p className="text-text-secondary text-sm mt-1">
                You can now use ZRM tokens to promote your NFTs during creation or through the manage panel.
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