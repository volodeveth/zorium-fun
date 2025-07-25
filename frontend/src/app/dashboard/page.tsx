'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Wallet, DollarSign, TrendingUp, Download, AlertCircle } from 'lucide-react'
import { SUPPORTED_NETWORKS } from '@/lib/web3/wagmi'

// Mock data - це буде замінено реальними API викликами
const mockUserData = {
  8453: { // Base
    collections: [
      { id: 1, name: 'My Art Collection', nftCount: 12, totalEarnings: '0.0245' },
      { id: 2, name: 'Digital Creations', nftCount: 8, totalEarnings: '0.0189' }
    ],
    nfts: [
      { id: 1, title: 'Abstract #001', collection: 'My Art Collection', mints: 15, earnings: '0.0167' },
      { id: 2, title: 'Digital Dreams', collection: 'My Art Collection', mints: 8, earnings: '0.0089' },
      { id: 3, title: 'Neon City', collection: 'Digital Creations', mints: 22, earnings: '0.0244' }
    ],
    totalEarnings: '0.0434',
    pendingWithdrawal: '0.0434'
  },
  7777777: { // Zora
    collections: [
      { id: 3, name: 'Zora Specials', nftCount: 5, totalEarnings: '0.0078' }
    ],
    nfts: [
      { id: 4, title: 'Zora Genesis', collection: 'Zora Specials', mints: 12, earnings: '0.0078' }
    ],
    totalEarnings: '0.0078',
    pendingWithdrawal: '0.0078'
  },
  1: { // Ethereum
    collections: [],
    nfts: [],
    totalEarnings: '0',
    pendingWithdrawal: '0'
  }
}

export default function Dashboard() {
  const { address, isConnected } = useAccount()
  const [activeNetwork, setActiveNetwork] = useState(8453) // Base за замовчуванням
  const [withdrawing, setWithdrawing] = useState<number | null>(null)

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

  const activeNetworkData = mockUserData[activeNetwork as keyof typeof mockUserData] || {
    collections: [],
    nfts: [],
    totalEarnings: '0',
    pendingWithdrawal: '0'
  }

  const totalEarningsAllNetworks = Object.values(mockUserData).reduce(
    (sum, data) => sum + parseFloat(data.totalEarnings), 0
  )

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

        {/* Total Earnings Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-background-secondary rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign size={20} className="text-green-500" />
              <span className="text-text-secondary text-sm">Total Earnings</span>
            </div>
            <div className="text-2xl font-bold text-text-primary">
              {totalEarningsAllNetworks.toFixed(4)} ETH
            </div>
            <div className="text-text-secondary text-sm mt-1">
              Across all networks
            </div>
          </div>

          <div className="bg-background-secondary rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp size={20} className="text-blue-500" />
              <span className="text-text-secondary text-sm">Total Collections</span>
            </div>
            <div className="text-2xl font-bold text-text-primary">
              {Object.values(mockUserData).reduce((sum, data) => sum + data.collections.length, 0)}
            </div>
            <div className="text-text-secondary text-sm mt-1">
              Active collections
            </div>
          </div>

          <div className="bg-background-secondary rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-2">
              <Wallet size={20} className="text-purple-primary" />
              <span className="text-text-secondary text-sm">Total NFTs</span>
            </div>
            <div className="text-2xl font-bold text-text-primary">
              {Object.values(mockUserData).reduce((sum, data) => sum + data.nfts.length, 0)}
            </div>
            <div className="text-text-secondary text-sm mt-1">
              Minted by you
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
                  {mockUserData[network.id as keyof typeof mockUserData] && 
                   parseFloat(mockUserData[network.id as keyof typeof mockUserData].totalEarnings) > 0 && (
                    <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                      {parseFloat(mockUserData[network.id as keyof typeof mockUserData].totalEarnings).toFixed(4)} {network.symbol}
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
                        <div>
                          <h5 className="font-semibold text-text-primary">{nft.title}</h5>
                          <p className="text-text-secondary text-sm">{nft.collection}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-green-500 font-semibold">
                            {nft.earnings} {SUPPORTED_NETWORKS.find(n => n.id === activeNetwork)?.symbol}
                          </div>
                          <div className="text-text-secondary text-sm">
                            {nft.mints} mints
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