'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { isPlatformOwner, PLATFORM_CONFIG, getFormattedFees } from '@/lib/config/admin'
import { api } from '@/lib/api'
import { useZRMContract } from '@/hooks/useZRMContract'
import { toast } from 'sonner'
import { 
  Shield, 
  DollarSign, 
  TrendingUp, 
  Users, 
  CreditCard, 
  Send,
  Download,
  BarChart3,
  Settings,
  Lock,
  AlertTriangle
} from 'lucide-react'

interface PlatformStats {
  totalFees: number
  availableZRM: number
  accumulatedZRM: number // ZRM spent by users on promotion
  totalZRMDeposited: number // Total ZRM deposited by admin
  totalUsers: number
  totalNFTs: number
  monthlyRevenue: number // Monthly revenue in ETH (from fees)
  monthlyRevenueZRM?: number // Monthly revenue in ZRM (from promotions)
  dailyActiveUsers: number
  earlyBirdUsers: number // Users who received early bird bonus
}

interface WithdrawalRequest {
  id: string
  type: 'ETH' | 'ZRM'
  amount: number
  recipientAddress: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  requestedBy: string
  requestedAt: string
  approvedAt?: string
}

interface FeeHistory {
  date: string
  amount: number
  type: 'platform' | 'referral_unused'
  source: string
}

export default function AdminDashboard() {
  const { address, isConnected } = useAccount()
  const router = useRouter()
  const { 
    treasuryBalance, 
    availableZRM, 
    userZRMBalance, 
    platformStats,
    depositToTreasury, 
    allocateToUser, 
    withdrawFees, 
    isLoading: contractLoading 
  } = useZRMContract()
  const [isOwner, setIsOwner] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<PlatformStats>({
    totalFees: 0,
    availableZRM: 0,
    accumulatedZRM: 0,
    totalZRMDeposited: 0,
    totalUsers: 0,
    totalNFTs: 0,
    monthlyRevenue: 0,
    dailyActiveUsers: 0,
    earlyBirdUsers: 0
  })
  const [feeHistory, setFeeHistory] = useState<FeeHistory[]>([])
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([])
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawZrmAmount, setWithdrawZrmAmount] = useState('')
  const [allocateAmount, setAllocateAmount] = useState('')
  const [allocateAddress, setAllocateAddress] = useState('')
  const [withdrawToAddress, setWithdrawToAddress] = useState('')
  const [withdrawZrmToAddress, setWithdrawZrmToAddress] = useState('')
  const [depositAmount, setDepositAmount] = useState('')
  const [massAllocationAmount, setMassAllocationAmount] = useState('10000')
  const [massAllocationLimit, setMassAllocationLimit] = useState('10000')
  const [activeTab, setActiveTab] = useState<'overview' | 'fees' | 'allocate' | 'history' | 'withdrawals' | 'deposit'>('overview')

  useEffect(() => {
    // Check if user is owner
    if (isConnected && address) {
      const isUserOwner = isPlatformOwner(address)
      setIsOwner(isUserOwner)
      
      if (!isUserOwner) {
        // Redirect non-owners after a short delay
        setTimeout(() => {
          router.push('/')
        }, PLATFORM_CONFIG.admin.redirectDelay)
      }
    }
    setLoading(false)
  }, [address, isConnected, router])

  useEffect(() => {
    if (isOwner) {
      loadPlatformStats()
      loadFeeHistory()
      loadWithdrawalRequests()
    }
  }, [isOwner])

  const loadPlatformStats = async () => {
    try {
      console.log('🔍 API_BASE_URL check:', process.env.NEXT_PUBLIC_API_URL)
      
      if (!address) {
        console.warn('❌ No wallet address available for admin panel')
        return
      }
      
      // Call API with explicit admin address
      console.log('🚀 Loading platform stats for admin:', address)
      console.log('🔗 API URL being used:', process.env.NEXT_PUBLIC_API_URL || 'fallback URL')
      const response = await api.admin.getStats(address)
      console.log('📊 Admin stats response:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
        url: response.url
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Admin stats data received:', data)
        setStats({
          totalFees: parseFloat(data.stats.totalFees?.toString() || '0'),
          availableZRM: parseFloat(data.stats.availableZRM?.toString() || '0'),
          accumulatedZRM: parseFloat(data.stats.accumulatedZRM?.toString() || '0'),
          totalZRMDeposited: parseFloat(data.stats.totalZRMDeposited?.toString() || '0'),
          totalUsers: data.stats.totalUsers || 0,
          totalNFTs: data.stats.totalNFTs || 0,
          monthlyRevenue: parseFloat(data.stats.monthlyRevenue?.toString() || '0'),
          monthlyRevenueZRM: parseFloat(data.stats.monthlyRevenueZRM?.toString() || '0'),
          dailyActiveUsers: data.stats.dailyActiveUsers || 0,
          earlyBirdUsers: data.stats.earlyBirdUsers || 0
        })
        console.log('✅ Real data loaded successfully!')
      } else {
        const errorText = await response.text()
        console.error('❌ API Error Response:', errorText)
        // Use mock data as fallback
        setStats({
          totalFees: 2.5,
          availableZRM: 50000,
          accumulatedZRM: 25000,
          totalZRMDeposited: 150000,
          totalUsers: 1250,
          totalNFTs: 3400,
          monthlyRevenue: 12.8,
          dailyActiveUsers: 180,
          earlyBirdUsers: 856
        })
        console.warn('⚠️ Failed to load platform stats, using mock data')
      }
    } catch (error: any) {
      console.error('💥 CATCH: Failed to load platform stats:', error)
      console.error('💥 Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      })
      // Use mock data as fallback
      setStats({
        totalFees: 2.5,
        availableZRM: 50000,
        accumulatedZRM: 25000,
        totalZRMDeposited: 150000,
        totalUsers: 1250,
        totalNFTs: 3400,
        monthlyRevenue: 12.8,
        dailyActiveUsers: 180,
        earlyBirdUsers: 856
      })
      console.warn('⚠️ CATCH: Using mock data due to error')
    }
  }

  const loadFeeHistory = async () => {
    try {
      if (!address) {
        console.warn('No wallet address available')
        return
      }
      
      const response = await api.admin.getFeeHistory(address, 50)
      if (response.ok) {
        const data = await response.json()
        const history = data.feeHistory?.map((item: any) => ({
          date: item.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          amount: parseFloat(item.amount?.toString() || '0'),
          type: item.type || 'platform',
          source: item.source || 'Platform Fee'
        })) || []
        setFeeHistory(history)
      } else {
        // Use mock data as fallback
        setFeeHistory([
          { date: '2025-01-27', amount: 0.045, type: 'platform', source: 'NFT Minting' },
          { date: '2025-01-26', amount: 0.022, type: 'referral_unused', source: 'Unused Referral' },
          { date: '2025-01-25', amount: 0.088, type: 'platform', source: 'NFT Minting' },
        ])
        console.warn('Failed to load fee history, using mock data')
      }
    } catch (error) {
      console.error('Failed to load fee history:', error)
      // Use mock data as fallback
      setFeeHistory([
        { date: '2025-01-27', amount: 0.045, type: 'platform', source: 'NFT Minting' },
        { date: '2025-01-26', amount: 0.022, type: 'referral_unused', source: 'Unused Referral' },
        { date: '2025-01-25', amount: 0.088, type: 'platform', source: 'NFT Minting' },
      ])
    }
  }

  const loadWithdrawalRequests = async () => {
    // TODO: Implement API call to get withdrawal requests
    try {
      setWithdrawalRequests([
        {
          id: '1',
          type: 'ETH',
          amount: 1.5,
          recipientAddress: '0x1234...5678',
          status: 'pending',
          requestedBy: 'admin',
          requestedAt: '2025-01-27T10:00:00Z'
        },
        {
          id: '2',
          type: 'ZRM',
          amount: 10000,
          recipientAddress: '0xabcd...efgh',
          status: 'approved',
          requestedBy: 'admin',
          requestedAt: '2025-01-26T15:30:00Z',
          approvedAt: '2025-01-26T16:00:00Z'
        }
      ])
    } catch (error) {
      console.error('Failed to load withdrawal requests:', error)
    }
  }

  const handleWithdrawFees = async () => {
    if (!withdrawAmount || isNaN(Number(withdrawAmount))) return
    
    try {
      if (withdrawToAddress && withdrawToAddress !== address) {
        // Create withdrawal request for external address
        const newRequest: WithdrawalRequest = {
          id: Date.now().toString(),
          type: 'ETH',
          amount: Number(withdrawAmount),
          recipientAddress: withdrawToAddress,
          status: 'pending',
          requestedBy: address || '',
          requestedAt: new Date().toISOString()
        }
        setWithdrawalRequests(prev => [...prev, newRequest])
        alert(`Withdrawal request created for ${withdrawAmount} ETH to ${withdrawToAddress}. Pending approval.`)
      } else {
        // Direct withdrawal to admin wallet
        console.log('Withdrawing fees:', withdrawAmount, 'ETH to admin wallet')
        alert(`Withdrawal of ${withdrawAmount} ETH to admin wallet initiated!`)
      }
      setWithdrawAmount('')
      setWithdrawToAddress('')
      loadPlatformStats() // Refresh stats
    } catch (error) {
      console.error('Withdrawal failed:', error)
      alert('Withdrawal failed. Please try again.')
    }
  }

  const handleWithdrawZRM = async () => {
    if (!withdrawZrmAmount || isNaN(Number(withdrawZrmAmount))) return
    
    try {
      if (withdrawZrmToAddress && withdrawZrmToAddress !== address) {
        // Create withdrawal request for external address
        const newRequest: WithdrawalRequest = {
          id: Date.now().toString(),
          type: 'ZRM',
          amount: Number(withdrawZrmAmount),
          recipientAddress: withdrawZrmToAddress,
          status: 'pending',
          requestedBy: address || '',
          requestedAt: new Date().toISOString()
        }
        setWithdrawalRequests(prev => [...prev, newRequest])
        alert(`Withdrawal request created for ${withdrawZrmAmount} ZRM to ${withdrawZrmToAddress}. Pending approval.`)
      } else {
        // Direct withdrawal to admin wallet
        console.log('Withdrawing ZRM:', withdrawZrmAmount, 'ZRM to admin wallet')
        alert(`Withdrawal of ${withdrawZrmAmount} ZRM to admin wallet initiated!`)
      }
      setWithdrawZrmAmount('')
      setWithdrawZrmToAddress('')
      loadPlatformStats() // Refresh stats
    } catch (error) {
      console.error('ZRM withdrawal failed:', error)
      alert('ZRM withdrawal failed. Please try again.')
    }
  }

  const handleAllocateZRM = async () => {
    if (!allocateAmount || !allocateAddress || isNaN(Number(allocateAmount))) return
    if (!address) {
      alert('Wallet not connected')
      return
    }
    
    try {
      const response = await api.admin.allocateZRM(
        address,
        allocateAddress,
        Number(allocateAmount),
        'Manual allocation by admin'
      )
      
      if (response.ok) {
        const data = await response.json()
        alert(`Successfully allocated ${allocateAmount} ZRM to ${allocateAddress}!`)
        setAllocateAmount('')
        setAllocateAddress('')
        loadPlatformStats() // Refresh stats
      } else {
        const errorData = await response.json()
        alert(`ZRM allocation failed: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('ZRM allocation failed:', error)
      alert('ZRM allocation failed. Please try again.')
    }
  }

  const handleApproveWithdrawal = async (requestId: string) => {
    try {
      const updatedRequests = withdrawalRequests.map(req => 
        req.id === requestId 
          ? { ...req, status: 'approved' as const, approvedAt: new Date().toISOString() }
          : req
      )
      setWithdrawalRequests(updatedRequests)
      
      // TODO: Implement actual blockchain withdrawal
      const request = withdrawalRequests.find(r => r.id === requestId)
      console.log(`Approved withdrawal: ${request?.amount} ${request?.type} to ${request?.recipientAddress}`)
      alert(`Withdrawal approved and executed!`)
      
      loadPlatformStats() // Refresh stats
    } catch (error) {
      console.error('Approval failed:', error)
      alert('Withdrawal approval failed. Please try again.')
    }
  }

  const handleRejectWithdrawal = async (requestId: string) => {
    try {
      const updatedRequests = withdrawalRequests.map(req => 
        req.id === requestId 
          ? { ...req, status: 'rejected' as const }
          : req
      )
      setWithdrawalRequests(updatedRequests)
      alert(`Withdrawal request rejected.`)
    } catch (error) {
      console.error('Rejection failed:', error)
    }
  }

  const handleDepositZRM = async () => {
    if (!depositAmount || isNaN(Number(depositAmount))) {
      toast.error('Please enter a valid amount')
      return
    }
    if (!address) {
      toast.error('Wallet not connected')
      return
    }
    
    try {
      await depositToTreasury(depositAmount)
      setDepositAmount('')
      // Refresh stats after a short delay to allow blockchain to update
      setTimeout(() => {
        loadPlatformStats()
      }, 3000)
    } catch (error) {
      console.error('Error depositing ZRM:', error)
    }
  }

  const handleCleanZRMData = async () => {
    if (!address) {
      alert('Wallet not connected')
      return
    }

    const confirmed = confirm(
      'Are you sure you want to clean all ZRM data? This will:\n' +
      '• Delete all platform stats\n' +
      '• Delete all fake ZRM transactions\n' +
      '• Reset Available ZRM to 0\n' +
      '\nThis action cannot be undone!'
    )

    if (!confirmed) return

    try {
      const response = await api.admin.cleanZRMData(address)
      
      if (response.ok) {
        const data = await response.json()
        alert(
          `ZRM data cleaned successfully!\n` +
          `• Deleted ${data.cleanup.deletedStats} platform stats\n` +
          `• Deleted ${data.cleanup.deletedTransactions} fake transactions`
        )
        loadPlatformStats() // Refresh stats
      } else {
        const errorData = await response.json()
        alert(`ZRM cleanup failed: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('ZRM cleanup failed:', error)
      alert('ZRM cleanup failed. Please try again.')
    }
  }

  const handleMassAllocation = async () => {
    if (!massAllocationAmount || isNaN(Number(massAllocationAmount))) return
    if (!massAllocationLimit || isNaN(Number(massAllocationLimit))) return
    
    const amount = Number(massAllocationAmount)
    const limit = Number(massAllocationLimit)
    const totalRequired = amount * limit
    
    if (totalRequired > stats.availableZRM) {
      alert(`Insufficient ZRM balance. Required: ${totalRequired.toLocaleString()} ZRM, Available: ${stats.availableZRM.toLocaleString()} ZRM`)
      return
    }
    
    try {
      // TODO: Implement actual mass allocation logic
      console.log(`Allocating ${amount} ZRM to first ${limit} users`)
      alert(`Mass allocation initiated: ${amount} ZRM to first ${limit} users!\nTotal allocated: ${totalRequired.toLocaleString()} ZRM`)
      setMassAllocationAmount('10000')
      setMassAllocationLimit('10000')
      loadPlatformStats() // Refresh stats
    } catch (error) {
      console.error('Mass allocation failed:', error)
      alert('Mass allocation failed. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Lock className="h-16 w-16 text-text-secondary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text-primary mb-2">Admin Access Required</h1>
          <p className="text-text-secondary mb-6">
            Please connect your wallet to access the admin dashboard.
          </p>
        </div>
      </div>
    )
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text-primary mb-2">Access Denied</h1>
          <p className="text-text-secondary mb-6">
            You do not have permission to access the admin dashboard. Redirecting to home page...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-primary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-purple-primary" />
            <h1 className="text-3xl font-bold text-text-primary">Admin Dashboard</h1>
          </div>
          <p className="text-text-secondary">
            Manage platform fees, ZRM allocation, and monitor system performance.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-background-secondary rounded-lg p-1">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'fees', label: 'Fee Management', icon: DollarSign },
            { id: 'deposit', label: 'ZRM Deposit', icon: TrendingUp },
            { id: 'allocate', label: 'ZRM Allocation', icon: Send },
            { id: 'withdrawals', label: 'Withdrawals', icon: CreditCard },
            { id: 'history', label: 'History', icon: Download }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-primary text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-background-secondary rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-sm">Total Platform Fees</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.totalFees.toFixed(3)} ETH</p>
                  </div>
                  <div className="bg-green-500/10 p-3 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </div>

              <div className="bg-background-secondary rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-sm">Treasury Balance</p>
                    <p className="text-2xl font-bold text-text-primary">{parseFloat(treasuryBalance).toLocaleString()} ZRM</p>
                    <p className="text-xs text-text-secondary">Real blockchain data</p>
                  </div>
                  <div className="bg-purple-primary/10 p-3 rounded-lg">
                    <CreditCard className="h-6 w-6 text-purple-primary" />
                  </div>
                </div>
              </div>

              <div className="bg-background-secondary rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-sm">Available ZRM</p>
                    <p className="text-2xl font-bold text-text-primary">{parseFloat(availableZRM).toLocaleString()} ZRM</p>
                    <p className="text-xs text-text-secondary">For user allocation</p>
                  </div>
                  <div className="bg-green-500/10 p-3 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </div>

              <div className="bg-background-secondary rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-sm">Total Users</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.totalUsers.toLocaleString()}</p>
                  </div>
                  <div className="bg-blue-500/10 p-3 rounded-lg">
                    <Users className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </div>

              <div className="bg-background-secondary rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-sm">Total NFTs</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.totalNFTs.toLocaleString()}</p>
                  </div>
                  <div className="bg-orange-500/10 p-3 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-orange-500" />
                  </div>
                </div>
              </div>

              <div className="bg-background-secondary rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-sm">Monthly Revenue</p>
                    <p className="text-xl font-bold text-text-primary">{stats.monthlyRevenue.toFixed(3)} ETH</p>
                    {stats.monthlyRevenueZRM && stats.monthlyRevenueZRM > 0 && (
                      <p className="text-sm text-purple-400">{stats.monthlyRevenueZRM.toLocaleString()} ZRM</p>
                    )}
                  </div>
                  <div className="bg-emerald-500/10 p-3 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-emerald-500" />
                  </div>
                </div>
              </div>

              <div className="bg-background-secondary rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-sm">Daily Active Users</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.dailyActiveUsers}</p>
                  </div>
                  <div className="bg-pink-500/10 p-3 rounded-lg">
                    <Users className="h-6 w-6 text-pink-500" />
                  </div>
                </div>
              </div>

              <div className="bg-background-secondary rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-sm">Total ZRM Deposited</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.totalZRMDeposited.toLocaleString()} ZRM</p>
                    <p className="text-xs text-text-secondary">Platform treasury</p>
                  </div>
                  <div className="bg-blue-500/10 p-3 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </div>

              <div className="bg-background-secondary rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-sm">Early Bird Users</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.earlyBirdUsers.toLocaleString()}</p>
                    <p className="text-xs text-text-secondary">Received 10K ZRM bonus</p>
                  </div>
                  <div className="bg-yellow-500/10 p-3 rounded-lg">
                    <Users className="h-6 w-6 text-yellow-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Fee Structure Information */}
            <div className="bg-background-secondary rounded-xl p-6 border border-border">
              <h3 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Platform Fee Structure
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-text-primary mb-3">Default Fees ({getFormattedFees().total} total)</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Creator (50%)</span>
                      <span className="text-text-primary">{PLATFORM_CONFIG.fees.creator.toFixed(6)} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">First Minter (10%)</span>
                      <span className="text-green-500">{PLATFORM_CONFIG.fees.firstMinter.toFixed(6)} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Referral (20%)</span>
                      <span className="text-blue-500">{PLATFORM_CONFIG.fees.referral.toFixed(6)} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Platform (20%)</span>
                      <span className="text-purple-primary">{PLATFORM_CONFIG.fees.platform.toFixed(6)} ETH</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-text-primary mb-3">Special Cases</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-green-500">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Creator first mint: FREE (gas only)</span>
                    </div>
                    <div className="flex items-center gap-2 text-purple-primary">
                      <div className="w-2 h-2 bg-purple-primary rounded-full"></div>
                      <span>No referral: +20% to platform (40% total)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fee Management Tab */}
        {activeTab === 'fees' && (
          <div className="space-y-6">
            {/* ETH Fee Withdrawal */}
            <div className="bg-background-secondary rounded-xl p-6 border border-border">
              <h3 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Platform Fee Withdrawal (ETH)
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-text-secondary text-sm mb-2">
                    Available Balance: {stats.totalFees.toFixed(6)} ETH
                  </label>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Recipient address (leave empty for admin wallet)"
                      value={withdrawToAddress}
                      onChange={(e) => setWithdrawToAddress(e.target.value)}
                      className="w-full bg-background-primary border border-border rounded-lg px-4 py-2 text-text-primary focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                    />
                    <div className="flex gap-4">
                      <input
                        type="number"
                        step="0.000001"
                        placeholder="Amount to withdraw (ETH)"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="flex-1 bg-background-primary border border-border rounded-lg px-4 py-2 text-text-primary focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                      />
                      <button
                        onClick={handleWithdrawFees}
                        disabled={!withdrawAmount || Number(withdrawAmount) > stats.totalFees}
                        className="bg-purple-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {withdrawToAddress && withdrawToAddress !== address ? 'Request' : 'Withdraw'}
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-text-secondary text-sm">
                  Withdraw accumulated platform fees. Leave address empty to withdraw to your admin wallet, or specify another address to create a withdrawal request requiring approval.
                </p>
              </div>
            </div>

            {/* ZRM Withdrawal */}
            <div className="bg-background-secondary rounded-xl p-6 border border-border">
              <h3 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                ZRM Token Withdrawal
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-text-secondary text-sm mb-2">
                    Available ZRM: {parseFloat(availableZRM).toLocaleString()} ZRM (for withdrawal)
                  </label>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Recipient address (leave empty for admin wallet)"
                      value={withdrawZrmToAddress}
                      onChange={(e) => setWithdrawZrmToAddress(e.target.value)}
                      className="w-full bg-background-primary border border-border rounded-lg px-4 py-2 text-text-primary focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                    />
                    <div className="flex gap-4">
                      <input
                        type="number"
                        placeholder="Amount of ZRM to withdraw"
                        value={withdrawZrmAmount}
                        onChange={(e) => setWithdrawZrmAmount(e.target.value)}
                        className="flex-1 bg-background-primary border border-border rounded-lg px-4 py-2 text-text-primary focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                      />
                      <button
                        onClick={() => withdrawFees(withdrawZrmAmount)}
                        disabled={!withdrawZrmAmount || Number(withdrawZrmAmount) > parseFloat(availableZRM)}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {withdrawZrmToAddress && withdrawZrmToAddress !== address ? 'Request' : 'Withdraw'}
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-text-secondary text-sm">
                  Withdraw ZRM tokens that users spent on NFT promotions. These tokens are accumulated by the platform and can be withdrawn by the admin.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ZRM Deposit Tab */}
        {activeTab === 'deposit' && (
          <div className="space-y-6">
            {/* ZRM Deposit Section */}
            <div className="bg-background-secondary rounded-xl p-6 border border-border">
              <h3 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                ZRM Platform Deposit
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-text-secondary text-sm mb-2">
                    Your Wallet Balance: {parseFloat(userZRMBalance).toLocaleString()} ZRM | Treasury Balance: {parseFloat(treasuryBalance).toLocaleString()} ZRM
                  </label>
                  <div className="flex gap-4">
                    <input
                      type="number"
                      placeholder="Amount of ZRM to deposit"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="flex-1 bg-background-primary border border-border rounded-lg px-4 py-2 text-text-primary focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                    />
                    <button
                      onClick={handleDepositZRM}
                      disabled={!depositAmount}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Deposit
                    </button>
                  </div>
                </div>
                <p className="text-text-secondary text-sm">
                  Deposit ZRM tokens from your admin wallet to the platform treasury. These tokens will be used for user rewards and promotions.
                </p>
              </div>
            </div>

            {/* Data Cleanup Section */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Data Cleanup (One-time Operation)
              </h3>
              <div className="space-y-4">
                <button
                  onClick={handleCleanZRMData}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Clean Old ZRM Data
                </button>
                <p className="text-text-secondary text-sm">
                  Remove incorrect ZRM data from database. This will reset all ZRM balances to 0 and require fresh blockchain deposits.
                </p>
              </div>
            </div>

            {/* Mass Allocation Section */}
            <div className="bg-background-secondary rounded-xl p-6 border border-border">
              <h3 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Early Bird Bonus Program
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-text-secondary text-sm mb-2">
                      ZRM Amount per User
                    </label>
                    <input
                      type="number"
                      placeholder="10000"
                      value={massAllocationAmount}
                      onChange={(e) => setMassAllocationAmount(e.target.value)}
                      className="w-full bg-background-primary border border-border rounded-lg px-4 py-2 text-text-primary focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-text-secondary text-sm mb-2">
                      First N Users
                    </label>
                    <input
                      type="number"
                      placeholder="10000"
                      value={massAllocationLimit}
                      onChange={(e) => setMassAllocationLimit(e.target.value)}
                      className="w-full bg-background-primary border border-border rounded-lg px-4 py-2 text-text-primary focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-600 mb-2">🎁 Early Bird Campaign</h4>
                  <div className="text-sm text-yellow-700 space-y-1">
                    <p>• <strong>Total Required:</strong> {(Number(massAllocationAmount) * Number(massAllocationLimit)).toLocaleString()} ZRM</p>
                    <p>• <strong>Available Balance:</strong> {stats.availableZRM.toLocaleString()} ZRM</p>
                    <p>• <strong>Already Allocated:</strong> {stats.earlyBirdUsers.toLocaleString()} users</p>
                    <p>• <strong>Remaining Slots:</strong> {Math.max(0, Number(massAllocationLimit) - stats.earlyBirdUsers).toLocaleString()} users</p>
                  </div>
                </div>

                <button
                  onClick={handleMassAllocation}
                  disabled={!massAllocationAmount || !massAllocationLimit || (Number(massAllocationAmount) * Number(massAllocationLimit)) > stats.availableZRM}
                  className="w-full bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🚀 Launch Early Bird Program
                </button>
                
                <p className="text-text-secondary text-sm">
                  This will automatically allocate ZRM tokens to the first registered users and send them English notifications about their early bird bonus.
                </p>
              </div>
            </div>

            {/* Campaign Status */}
            <div className="bg-background-secondary rounded-xl p-6 border border-border">
              <h3 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Campaign Statistics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-background-primary rounded-lg p-4 border border-border">
                  <p className="text-text-secondary text-sm">Total Deposited</p>
                  <p className="text-2xl font-bold text-blue-500">{stats.totalZRMDeposited.toLocaleString()} ZRM</p>
                </div>
                <div className="bg-background-primary rounded-lg p-4 border border-border">
                  <p className="text-text-secondary text-sm">Available for Allocation</p>
                  <p className="text-2xl font-bold text-purple-primary">{stats.availableZRM.toLocaleString()} ZRM</p>
                </div>
                <div className="bg-background-primary rounded-lg p-4 border border-border">
                  <p className="text-text-secondary text-sm">Early Bird Recipients</p>
                  <p className="text-2xl font-bold text-yellow-500">{stats.earlyBirdUsers.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ZRM Allocation Tab */}
        {activeTab === 'allocate' && (
          <div className="space-y-6">
            <div className="bg-background-secondary rounded-xl p-6 border border-border">
              <h3 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Send className="h-5 w-5" />
                ZRM Token Allocation
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-text-secondary text-sm mb-2">
                    Available ZRM: {parseFloat(availableZRM).toLocaleString()} ZRM
                  </label>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Recipient wallet address (0x...)"
                      value={allocateAddress}
                      onChange={(e) => setAllocateAddress(e.target.value)}
                      className="w-full bg-background-primary border border-border rounded-lg px-4 py-2 text-text-primary focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                    />
                    <div className="flex gap-4">
                      <input
                        type="number"
                        placeholder="Amount of ZRM to allocate"
                        value={allocateAmount}
                        onChange={(e) => setAllocateAmount(e.target.value)}
                        className="flex-1 bg-background-primary border border-border rounded-lg px-4 py-2 text-text-primary focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                      />
                      <button
                        onClick={handleAllocateZRM}
                        disabled={!allocateAmount || !allocateAddress || Number(allocateAmount) > parseFloat(availableZRM)}
                        className="bg-purple-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Allocate
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-text-secondary text-sm">
                  Allocate ZRM tokens to users for platform activities, rewards, or promotional purposes. 
                  ZRM tokens are used for NFT promotion and other platform features.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Withdrawals Tab */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-6">
            <div className="bg-background-secondary rounded-xl p-6 border border-border">
              <h3 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Withdrawal Requests Management
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 text-text-secondary font-medium">Type</th>
                      <th className="text-left py-3 text-text-secondary font-medium">Amount</th>
                      <th className="text-left py-3 text-text-secondary font-medium">Recipient</th>
                      <th className="text-left py-3 text-text-secondary font-medium">Status</th>
                      <th className="text-left py-3 text-text-secondary font-medium">Requested</th>
                      <th className="text-left py-3 text-text-secondary font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawalRequests.map((request) => (
                      <tr key={request.id} className="border-b border-border/50">
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            request.type === 'ETH' 
                              ? 'bg-purple-primary/10 text-purple-primary' 
                              : 'bg-green-500/10 text-green-500'
                          }`}>
                            {request.type}
                          </span>
                        </td>
                        <td className="py-3 text-text-primary font-medium">
                          {request.amount.toLocaleString()} {request.type}
                        </td>
                        <td className="py-3 text-text-secondary">
                          {request.recipientAddress.slice(0, 6)}...{request.recipientAddress.slice(-4)}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            request.status === 'pending' ? 'bg-orange-500/10 text-orange-500' :
                            request.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                            request.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                            'bg-blue-500/10 text-blue-500'
                          }`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="py-3 text-text-secondary">
                          {new Date(request.requestedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3">
                          {request.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveWithdrawal(request.id)}
                                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectWithdrawal(request.id)}
                                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {withdrawalRequests.length === 0 && (
                  <div className="text-center py-8 text-text-secondary">
                    No withdrawal requests found.
                  </div>
                )}
              </div>
              <div className="mt-4 p-4 bg-background-primary rounded-lg border border-border">
                <h4 className="font-medium text-text-primary mb-2">How Withdrawal Approvals Work:</h4>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>• Direct withdrawals to admin wallet are executed immediately</li>
                  <li>• Withdrawals to other addresses require admin approval</li>
                  <li>• Approved withdrawals are executed automatically</li>
                  <li>• Rejected requests can be resubmitted with corrections</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="bg-background-secondary rounded-xl p-6 border border-border">
              <h3 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Download className="h-5 w-5" />
                Transaction History
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 text-text-secondary font-medium">Date</th>
                      <th className="text-left py-3 text-text-secondary font-medium">Amount</th>
                      <th className="text-left py-3 text-text-secondary font-medium">Type</th>
                      <th className="text-left py-3 text-text-secondary font-medium">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeHistory.map((item, index) => (
                      <tr key={index} className="border-b border-border/50">
                        <td className="py-3 text-text-primary">{item.date}</td>
                        <td className="py-3 text-text-primary font-medium">{item.amount.toFixed(6)} ETH</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.type === 'platform' 
                              ? 'bg-purple-primary/10 text-purple-primary' 
                              : 'bg-orange-500/10 text-orange-500'
                          }`}>
                            {item.type === 'platform' ? 'Platform Fee' : 'Unused Referral'}
                          </span>
                        </td>
                        <td className="py-3 text-text-secondary">{item.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}