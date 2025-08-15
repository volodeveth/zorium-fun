'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Wallet, DollarSign, TrendingUp, Download, AlertCircle, Loader2 } from 'lucide-react'
import { SUPPORTED_NETWORKS } from '@/lib/web3/wagmi'
import { api } from '@/lib/api'

interface UserNFT {
  id: string
  name: string
  description?: string
  image: string
  price?: string
  isListed: boolean
  likeCount: number
  viewCount: number
  createdAt: string
  earnings?: string
  mints?: number
  collection?: string
}

interface UserCollection {
  id: string
  name: string
  description?: string
  nftCount: number
  totalEarnings: string
  floorPrice?: string
  totalVolume?: string
}

interface NetworkData {
  collections: UserCollection[]
  nfts: UserNFT[]
  totalEarnings: string
  pendingWithdrawal: string
}

export default function Dashboard() {
  const { address, isConnected } = useAccount()
  const [activeNetwork, setActiveNetwork] = useState(8453) // Base за замовчуванням
  const [withdrawing, setWithdrawing] = useState<number | null>(null)
  
  // Data states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userNFTs, setUserNFTs] = useState<UserNFT[]>([])
  const [userCollections, setUserCollections] = useState<UserCollection[]>([])
  const [zrmBalance, setZrmBalance] = useState('0')
  const [totalEarnings, setTotalEarnings] = useState(0)

  // Fetch user data on component mount
  useEffect(() => {
    if (isConnected && address) {
      fetchUserData()
    }
  }, [isConnected, address])

  const fetchUserData = async () => {
    if (!address) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Fetch user's ZRM balance
      const balanceResponse = await api.users.getZrmBalance(address)
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json()
        setZrmBalance(balanceData.balance || '0')
      }
      
      // Fetch user's NFTs
      const nftsResponse = await api.nfts.getAll()
      if (nftsResponse.ok) {
        const nftsData = await nftsResponse.json()
        const allNFTs = nftsData.nfts || []
        
        // Filter NFTs created by this user
        const createdNFTs = allNFTs
          .filter((nft: any) => nft.creator?.address?.toLowerCase() === address.toLowerCase())
          .map((nft: any) => ({
            id: nft.id,
            name: nft.name,
            description: nft.description,
            image: nft.image || '/images/placeholder-nft.jpg',
            price: nft.price?.toString() || '0.001',
            isListed: nft.isListed,
            likeCount: nft.likeCount || 0,
            viewCount: nft.viewCount || 0,
            createdAt: nft.createdAt,
            earnings: (parseFloat(nft.price || '0') * (nft.mints || 1) * 0.1).toFixed(4), // Mock 10% royalty
            mints: nft.mints || 1,
            collection: nft.collection?.name || 'General'
          }))
        
        setUserNFTs(createdNFTs)
        
        // Calculate total earnings
        const earnings = createdNFTs.reduce((sum: number, nft: UserNFT) => sum + parseFloat(nft.earnings || '0'), 0)
        setTotalEarnings(earnings)
      }
      
      // Mock collections data (since collections system is not fully implemented)
      const mockCollections: UserCollection[] = [
        {
          id: '1',
          name: 'My Collection',
          description: 'Personal NFT collection',
          nftCount: userNFTs.length,
          totalEarnings: totalEarnings.toFixed(4),
          floorPrice: '0.001',
          totalVolume: (totalEarnings * 1.5).toFixed(4)
        }
      ]
      setUserCollections(mockCollections)
      
    } catch (err) {
      console.error('Error fetching user data:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async (networkId: number) => {
    setWithdrawing(networkId)
    // Симуляція виведення коштів
    setTimeout(() => {
      setWithdrawing(null)
      alert(`Withdrawn earnings from ${SUPPORTED_NETWORKS.find(n => n.id === networkId)?.name}`)
    }, 3000)
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-background-secondary rounded-xl border border-border p-8 text-center">
            <AlertCircle size={48} className="text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-text-primary mb-4">Connect Wallet Required</h2>
            <p className="text-text-secondary">
              Please connect your wallet to view your NFT dashboard and manage earnings.
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-purple-primary mx-auto mb-4" />
          <p className="text-text-secondary">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Create network data based on real data
  const activeNetworkData: NetworkData = {
    collections: userCollections,
    nfts: userNFTs,
    totalEarnings: totalEarnings.toFixed(4),
    pendingWithdrawal: (totalEarnings * 0.1).toFixed(4) // Mock 10% pending
  }

  const totalEarningsAllNetworks = totalEarnings

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2">Dashboard</h1>
          <p className="text-text-secondary">
            Manage your NFT collections and earnings across all networks
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">!</span>
              </div>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Total Earnings Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-background-secondary rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign size={20} className="text-green-500" />
              <span className="text-text-secondary text-sm">Total Earnings</span>
            </div>
            <div className="text-2xl font-bold text-text-primary">
              {totalEarningsAllNetworks.toFixed(4)} ETH
            </div>
            <div className="text-text-secondary text-sm mt-1">
              From NFT sales
            </div>
          </div>

          <div className="bg-background-secondary rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp size={20} className="text-blue-500" />
              <span className="text-text-secondary text-sm">Collections</span>
            </div>
            <div className="text-2xl font-bold text-text-primary">
              {userCollections.length}
            </div>
            <div className="text-text-secondary text-sm mt-1">
              Active collections
            </div>
          </div>

          <div className="bg-background-secondary rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-2">
              <Wallet size={20} className="text-purple-primary" />
              <span className="text-text-secondary text-sm">NFTs Created</span>
            </div>
            <div className="text-2xl font-bold text-text-primary">
              {userNFTs.length}
            </div>
            <div className="text-text-secondary text-sm mt-1">
              Minted by you
            </div>
          </div>

          <div className="bg-background-secondary rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-lg font-bold text-purple-primary">ZRM</span>
              <span className="text-text-secondary text-sm">Balance</span>
            </div>
            <div className="text-2xl font-bold text-text-primary">
              {parseFloat(zrmBalance).toFixed(2)}
            </div>
            <div className="text-text-secondary text-sm mt-1">
              Zorium tokens
            </div>
          </div>
        </div>

        {/* Network Tabs */}
        <div className="bg-background-secondary rounded-xl border border-border">
          {/* Tab Headers */}
          <div className="border-b border-border">
            <div className="flex overflow-x-auto">
              {SUPPORTED_NETWORKS.map((network) => (
                <button
                  key={network.id}
                  onClick={() => setActiveNetwork(network.id)}
                  className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeNetwork === network.id
                      ? 'border-purple-primary text-purple-primary'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {network.name}
                  {network.id === activeNetwork && totalEarnings > 0 && (
                    <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                      {totalEarnings.toFixed(4)} {network.symbol}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Network Earnings Summary */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-text-primary">
                  {SUPPORTED_NETWORKS.find(n => n.id === activeNetwork)?.name} Network
                </h3>
                <p className="text-text-secondary">
                  {activeNetworkData.nfts.length} NFTs • {activeNetworkData.collections.length} Collections
                </p>
              </div>
              {parseFloat(activeNetworkData.pendingWithdrawal) > 0 && (
                <button
                  onClick={() => handleWithdraw(activeNetwork)}
                  disabled={withdrawing === activeNetwork}
                  className={`bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    withdrawing === activeNetwork ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {withdrawing === activeNetwork ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Withdrawing...
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      Withdraw {activeNetworkData.pendingWithdrawal} {SUPPORTED_NETWORKS.find(n => n.id === activeNetwork)?.symbol}
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Collections */}
            {activeNetworkData.collections.length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-text-primary mb-4">Collections</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeNetworkData.collections.map((collection) => (
                    <div key={collection.id} className="bg-background-tertiary rounded-lg border border-border p-4">
                      <h5 className="font-semibold text-text-primary mb-2">{collection.name}</h5>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-text-secondary">NFTs:</span>
                          <span className="text-text-primary">{collection.nftCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Earnings:</span>
                          <span className="text-green-500 font-medium">
                            {collection.totalEarnings} {SUPPORTED_NETWORKS.find(n => n.id === activeNetwork)?.symbol}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Floor:</span>
                          <span className="text-text-primary">
                            {collection.floorPrice} {SUPPORTED_NETWORKS.find(n => n.id === activeNetwork)?.symbol}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* NFTs */}
            {activeNetworkData.nfts.length > 0 ? (
              <div>
                <h4 className="text-lg font-semibold text-text-primary mb-4">NFTs</h4>
                <div className="space-y-3">
                  {activeNetworkData.nfts.map((nft) => (
                    <div key={nft.id} className="bg-background-tertiary rounded-lg border border-border p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className="font-semibold text-text-primary">{nft.name}</h5>
                          <p className="text-text-secondary text-sm">{nft.collection}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary">
                            <span>❤️ {nft.likeCount} likes</span>
                            <span>👁️ {nft.viewCount} views</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-500 font-semibold">
                            {nft.earnings} {SUPPORTED_NETWORKS.find(n => n.id === activeNetwork)?.symbol}
                          </div>
                          <div className="text-text-secondary text-sm">
                            {nft.mints} mints
                          </div>
                          <div className="text-purple-primary text-sm font-medium mt-1">
                            {nft.price} {SUPPORTED_NETWORKS.find(n => n.id === activeNetwork)?.symbol}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Wallet size={48} className="text-text-secondary mx-auto mb-4 opacity-50" />
                <h4 className="text-text-primary font-semibold mb-2">No NFTs on {SUPPORTED_NETWORKS.find(n => n.id === activeNetwork)?.name}</h4>
                <p className="text-text-secondary">
                  You haven't created any NFTs on this network yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}