'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import Button from '@/components/common/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Loader2, Gift, Clock, Zap, Star, Coins, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import WheelSpinner from '@/components/wheel/WheelSpinner'
import { useWheelSpin } from '@/hooks/useWheelSpin'

const PLATFORM_CONTRACT_ADDRESS = '0x1B2221E8c1AEdf3a6Db7929453A253739dC64f3c'
const ZRM_TOKEN_ADDRESS = '0x538D6F4fb9598dC74e15e6974049B109ae0AbC6a'

const PLATFORM_ABI = [
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
  },
  {
    name: 'getUserAllocatedBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'allocatedBalances',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const

const ZRM_TOKEN_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const

interface ZRMBalance {
  allocated: string
  transferable: string
  total: string
}

interface WheelInfo {
  canSpin: boolean
  cooldownTime: number
  cooldownExpires: string | null
}

interface UserZRMData {
  address: string
  zrmBalance: ZRMBalance
  wheel: WheelInfo
  blockchainVerified: boolean
}

const WheelPrizes = [
  { id: 1, amount: '50', color: 'bg-red-500', icon: Gift },
  { id: 2, amount: '175', color: 'bg-blue-500', icon: Trophy },
  { id: 3, amount: '25', color: 'bg-green-500', icon: Star },
  { id: 4, amount: '200', color: 'bg-purple-500', icon: Coins },
  { id: 5, amount: '75', color: 'bg-yellow-500', icon: Zap },
  { id: 6, amount: '150', color: 'bg-pink-500', icon: Gift },
  { id: 7, amount: '30', color: 'bg-indigo-500', icon: Star },
  { id: 8, amount: '100', color: 'bg-orange-500', icon: Coins }
]

// Sorted prizes for display
const SortedPrizes = [
  { id: 3, amount: '25', color: 'bg-green-500', icon: Star },
  { id: 7, amount: '30', color: 'bg-indigo-500', icon: Star },
  { id: 1, amount: '50', color: 'bg-red-500', icon: Gift },
  { id: 5, amount: '75', color: 'bg-yellow-500', icon: Zap },
  { id: 8, amount: '100', color: 'bg-orange-500', icon: Coins },
  { id: 6, amount: '150', color: 'bg-pink-500', icon: Gift },
  { id: 2, amount: '175', color: 'bg-blue-500', icon: Trophy },
  { id: 4, amount: '200', color: 'bg-purple-500', icon: Coins }
]

export default function WheelPage() {
  const { address, isConnected } = useAccount()
  const { spinWheel: contractSpinWheel, isSpinning: contractSpinning, lastSpinHash } = useWheelSpin()
  const [userData, setUserData] = useState<UserZRMData | null>(null)
  const [loading, setLoading] = useState(true)
  const [spinning, setSpinning] = useState(false)
  const [timeUntilSpin, setTimeUntilSpin] = useState(0)
  const [showWinModal, setShowWinModal] = useState(false)
  const [wonPrize, setWonPrize] = useState<typeof WheelPrizes[0] | null>(null)
  
  // Remove admin exception - all users follow 24h cooldown
  const isAdmin = false

  // Direct blockchain reads
  const { data: canSpin } = useReadContract({
    address: PLATFORM_CONTRACT_ADDRESS,
    abi: PLATFORM_ABI,
    functionName: 'canUserSpinWheel',
    args: address ? [address] : undefined,
  })

  const { data: cooldownTime } = useReadContract({
    address: PLATFORM_CONTRACT_ADDRESS,
    abi: PLATFORM_ABI,
    functionName: 'getWheelCooldownTime',
    args: address ? [address] : undefined,
  })

  const { data: allocatedBalance } = useReadContract({
    address: PLATFORM_CONTRACT_ADDRESS,
    abi: PLATFORM_ABI,
    functionName: 'allocatedBalances',
    args: address ? [address] : undefined,
  })

  const { data: transferableBalance } = useReadContract({
    address: ZRM_TOKEN_ADDRESS,
    abi: ZRM_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  // Update user data from blockchain
  useEffect(() => {
    if (address && isConnected) {
      const allocated = allocatedBalance ? (Number(allocatedBalance) / 1e18).toString() : '0'
      const transferable = transferableBalance ? (Number(transferableBalance) / 1e18).toString() : '0'
      const total = (parseFloat(allocated) + parseFloat(transferable)).toString()

      const userData: UserZRMData = {
        address: address.toLowerCase(),
        zrmBalance: {
          allocated,
          transferable,
          total
        },
        wheel: {
          canSpin: Boolean(canSpin), // All users follow blockchain cooldown
          cooldownTime: cooldownTime ? Number(cooldownTime) : 0,
          cooldownExpires: cooldownTime && Number(cooldownTime) > 0 
            ? new Date(Date.now() + Number(cooldownTime) * 1000).toISOString() 
            : null
        },
        blockchainVerified: true
      }

      setUserData(userData)
      setLoading(false)
    }
  }, [address, isConnected, canSpin, cooldownTime, allocatedBalance, transferableBalance])

  // Update countdown timer
  useEffect(() => {
    if (!userData?.wheel.cooldownTime) return

    const interval = setInterval(() => {
      const now = Date.now()
      const cooldownEnd = userData.wheel.cooldownExpires ? new Date(userData.wheel.cooldownExpires).getTime() : 0
      const remaining = Math.max(0, Math.floor((cooldownEnd - now) / 1000))
      
      setTimeUntilSpin(remaining)

      if (remaining <= 0) {
        setUserData(prev => prev ? {
          ...prev,
          wheel: { ...prev.wheel, canSpin: true, cooldownTime: 0 }
        } : null)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [userData?.wheel.cooldownExpires])

  // Close modal when transaction is successful
  useEffect(() => {
    if (lastSpinHash && showWinModal) {
      console.log('Transaction successful, closing modal:', lastSpinHash)
      setShowWinModal(false)
      setWonPrize(null)
      setSpinning(false)
    }
  }, [lastSpinHash, showWinModal])

  // Format time remaining
  const formatTimeRemaining = (seconds: number) => {
    if (seconds <= 0) return "Ready to spin!"
    
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  // Simple wheel spin - just for UI animation
  const spinWheel = async () => {
    if (!address || !userData?.wheel.canSpin || spinning) return

    toast.info('Please click on the wheel to spin!', {
      description: "Click directly on the wheel for the best experience",
      duration: 3000,
    })
  }


  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <Gift className="mx-auto h-24 w-24 text-muted-foreground mb-6" />
            <h1 className="text-3xl font-bold mb-4">Zorium Wheel</h1>
            <p className="text-muted-foreground mb-8">
              Connect your wallet to spin the daily reward wheel and earn ZRM tokens!
            </p>
            <p className="text-sm text-muted-foreground">
              Please connect your wallet to continue
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
            <h2 className="text-xl font-semibold">Loading Wheel...</h2>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-4">
            🎰 Zorium Wheel
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Spin the wheel once every 24 hours to earn free ZRM tokens!
          </p>
          
          {/* User Balance */}
          <div className="flex justify-center gap-4 mb-6">
            <Badge variant="outline" className="text-sm">
              <Coins className="w-4 h-4 mr-1" />
              Allocated: {parseFloat(userData?.zrmBalance.allocated || '0').toLocaleString()} ZRM
            </Badge>
            <Badge variant="outline" className="text-sm">
              <Zap className="w-4 h-4 mr-1" />
              Transferable: {parseFloat(userData?.zrmBalance.transferable || '0').toLocaleString()} ZRM
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Wheel Section */}
          <Card className="relative">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Gift className="w-6 h-6" />
                Daily Reward Wheel
              </CardTitle>
              <CardDescription>
                {userData?.wheel.canSpin 
                  ? "Click the wheel to spin and win ZRM!"
                  : `Next spin available in: ${formatTimeRemaining(timeUntilSpin)}`
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="flex flex-col items-center">
              {/* Wheel Spinner */}
              <div className="mb-6">
                <WheelSpinner
                  prizes={WheelPrizes}
                  onSpinComplete={(prize) => {
                    // Show win modal with random prize - user will click button to get real blockchain reward
                    setWonPrize(prize)
                    setShowWinModal(true)
                    setSpinning(false)
                  }}
                  disabled={!userData?.wheel.canSpin || spinning || contractSpinning || showWinModal}
                  spinning={spinning || contractSpinning}
                  onSpin={() => {
                    // This is called when user clicks the wheel, before the actual spin
                    if (!userData?.wheel.canSpin) {
                      toast.error('Cannot spin wheel', {
                        description: `Next spin available in: ${formatTimeRemaining(timeUntilSpin)}`,
                        duration: 3000,
                      })
                      return false // Prevent spin
                    }
                    setSpinning(true) // Start UI animation
                    return true // Allow spin
                  }}
                />
              </div>

            </CardContent>
          </Card>

          {/* Info Section */}
          <div className="space-y-6">
            {/* Cooldown Timer */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Next Spin
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-2">
                    {formatTimeRemaining(timeUntilSpin)}
                  </div>
                  <Progress 
                    value={userData?.wheel.canSpin ? 100 : ((24 * 3600 - timeUntilSpin) / (24 * 3600)) * 100} 
                    className="mb-4"
                  />
                  <p className="text-sm text-muted-foreground">
                    {userData?.wheel.canSpin 
                      ? "You can spin the wheel now!"
                      : "The wheel resets every 24 hours"
                    }
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Random Reward System */}
            <Card className="border-purple-500/20 bg-purple-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-purple-500" />
                  Random Reward System
                </CardTitle>
                <CardDescription>
                  Fair and transparent blockchain rewards
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Reward Range */}
                <div className="text-center p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-200/20">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                    25 - 200 ZRM
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Random reward range
                  </p>
                </div>

                {/* How it works */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold text-purple-600">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Spin Animation</p>
                      <p className="text-xs text-muted-foreground">Visual wheel spin for excitement</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold text-purple-600">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Blockchain Generation</p>
                      <p className="text-xs text-muted-foreground">Smart contract generates random reward</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold text-purple-600">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Instant Credit</p>
                      <p className="text-xs text-muted-foreground">ZRM added to your platform balance</p>
                    </div>
                  </div>
                </div>

                {/* Fairness note */}
                <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-200/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-green-600 text-sm">Provably Fair</span>
                  </div>
                  <p className="text-xs text-green-600/80">
                    All rewards are generated on-chain using blockchain randomness. No manipulation possible!
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Network Info */}
            <Card className="border-blue-500/20 bg-blue-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-500" />
                  Network Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-medium">🔗 Network: Zora Network</p>
                <p className="text-muted-foreground">Chain ID: 7777777</p>
                <p className="text-muted-foreground">RPC: https://rpc.zora.energy</p>
                <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg">
                  <p className="text-yellow-600 dark:text-yellow-400 text-xs">
                    ⚠️ Make sure your wallet is connected to Zora Network to spin the wheel
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Rules */}
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs mt-0.5">1</div>
                  <p>Connect your wallet to Zora Network</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs mt-0.5">2</div>
                  <p>Spin the wheel once every 24 hours</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs mt-0.5">3</div>
                  <p>Earn random rewards between 25-200 ZRM tokens</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs mt-0.5">4</div>
                  <p>Use your ZRM to promote NFTs and boost visibility</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Win Modal */}
        {showWinModal && wonPrize && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-background border border-border rounded-xl p-8 max-w-md w-full text-center">
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                  <Trophy className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">🎉 Congratulations!</h2>
                <p className="text-text-secondary mb-4">You spun the wheel!</p>
                <div className="text-4xl font-bold text-primary mb-2">
                  Random Reward
                </div>
                <p className="text-sm text-text-secondary">
                  Click below to claim your random ZRM reward (25-200 ZRM)
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={async () => {
                    try {
                      console.log('Button clicked - Executing blockchain transaction for prize:', wonPrize)
                      console.log('contractSpinWheel function:', contractSpinWheel)
                      console.log('contractSpinning state:', contractSpinning)
                      
                      // Call the function and log result
                      const result = contractSpinWheel()
                      console.log('contractSpinWheel result:', result)
                      
                      // Don't close modal here - it will close on success via useEffect
                    } catch (error) {
                      console.error('Error calling contractSpinWheel:', error)
                    }
                  }}
                  disabled={contractSpinning}
                  size="lg"
                  fullWidth
                  className="bg-green-500 hover:bg-green-600"
                >
                  {contractSpinning ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Adding to Balance...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Coins className="w-5 h-5" />
                      <span>Claim Random Reward</span>
                    </div>
                  )}
                </Button>
                
                <Button
                  onClick={() => {
                    setShowWinModal(false)
                    setWonPrize(null)
                  }}
                  variant="outline"
                  size="lg"
                  fullWidth
                  disabled={contractSpinning}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}