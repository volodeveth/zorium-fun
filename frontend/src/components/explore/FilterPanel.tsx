'use client'

import { Sliders, Star, Globe, Clock } from 'lucide-react'
import Image from 'next/image'
import { getNetworkLogo, getNetworkName } from '@/lib/utils/networkHelpers'

const NETWORK_OPTIONS = [
  { id: 'all', name: 'All Networks', logo: null },
  { id: 8453, name: 'Base', logo: '/images/base-logo.png' },
  { id: 7777777, name: 'Zora', logo: '/images/zora-logo.png' },
  { id: 1, name: 'Ethereum', logo: '/images/ethereum-logo.png' },
  { id: 137, name: 'Polygon', logo: '/images/polygon-logo.png' },
  { id: 10, name: 'Optimism', logo: '/images/optimism-logo.png' },
  { id: 42161, name: 'Arbitrum', logo: '/images/arbitrum-logo.png' },
]

const TIME_REMAINING_OPTIONS = [
  { id: 'all', name: 'Any Time', value: null },
  { id: '1hour', name: 'Less than 1 hour', value: 1 },
  { id: '24hours', name: 'Less than 24 hours', value: 24 },
  { id: '7days', name: 'Less than 7 days', value: 168 },
  { id: 'ended', name: 'Ended', value: 0 },
]

interface FilterPanelProps {
  priceRange: number[]
  onPriceRangeChange: (range: number[]) => void
  onlyPromoted: boolean
  onOnlyPromotedChange: (promoted: boolean) => void
  selectedNetwork: string | number
  onNetworkChange: (network: string | number) => void
  timeRemaining: string
  onTimeRemainingChange: (time: string) => void
}

export default function FilterPanel({ 
  priceRange, 
  onPriceRangeChange,
  onlyPromoted,
  onOnlyPromotedChange,
  selectedNetwork,
  onNetworkChange,
  timeRemaining,
  onTimeRemainingChange
}: FilterPanelProps) {
  return (
    <div className="bg-background-secondary border border-border rounded-xl p-6 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Sliders size={20} className="text-purple-primary" />
        <h3 className="text-lg font-semibold text-text-primary">Filters</h3>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-3">
          Price Range (ETH)
        </label>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-text-secondary">
            <span>{priceRange[0].toFixed(6)} ETH</span>
            <span>{priceRange[1].toFixed(6)} ETH</span>
          </div>
          
          <input
            type="range"
            min="0"
            max="1"
            step="0.000001"
            value={priceRange[1]}
            onChange={(e) => onPriceRangeChange([priceRange[0], parseFloat(e.target.value)])}
            className="w-full h-2 bg-background-tertiary rounded-lg appearance-none cursor-pointer slider-thumb"
          />
          
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min"
              value={priceRange[0]}
              onChange={(e) => onPriceRangeChange([parseFloat(e.target.value) || 0, priceRange[1]])}
              className="w-full px-2 py-2 bg-background-primary border border-border rounded-lg text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              step="0.000001"
              min="0"
            />
            <input
              type="number"
              placeholder="Max"
              value={priceRange[1]}
              onChange={(e) => onPriceRangeChange([priceRange[0], parseFloat(e.target.value) || 1])}
              className="w-full px-2 py-2 bg-background-primary border border-border rounded-lg text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              step="0.000001"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Promoted Only */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star size={18} className="text-yellow-400" />
          <label className="text-sm font-medium text-text-primary">
            Promoted Only
          </label>
        </div>
        <button
          onClick={() => onOnlyPromotedChange(!onlyPromoted)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            onlyPromoted ? 'bg-purple-primary' : 'bg-background-tertiary'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              onlyPromoted ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Network Filter */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-3">
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-purple-primary" />
            Network
          </div>
        </label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {NETWORK_OPTIONS.map((network) => (
            <button
              key={network.id}
              onClick={() => onNetworkChange(network.id)}
              className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
                selectedNetwork === network.id
                  ? 'bg-purple-primary/20 border border-purple-primary text-text-primary'
                  : 'bg-background-primary border border-border hover:bg-background-tertiary text-text-secondary hover:text-text-primary'
              }`}
            >
              {network.logo ? (
                <Image
                  src={network.logo}
                  alt={network.name}
                  width={20}
                  height={20}
                  className="rounded-full"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-primary to-blue-500" />
              )}
              <span className="text-sm font-medium">{network.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Time Remaining Filter */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-3">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-purple-primary" />
            Mint Time Remaining
          </div>
        </label>
        <div className="space-y-2">
          {TIME_REMAINING_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => onTimeRemainingChange(option.id)}
              className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                timeRemaining === option.id
                  ? 'bg-purple-primary/20 border border-purple-primary text-text-primary'
                  : 'bg-background-primary border border-border hover:bg-background-tertiary text-text-secondary hover:text-text-primary'
              }`}
            >
              <span className="text-sm font-medium">{option.name}</span>
              {option.value !== null && option.value > 0 && (
                <Clock size={12} className="text-text-secondary" />
              )}
              {option.value === 0 && (
                <div className="w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      <button
        onClick={() => {
          onPriceRangeChange([0, 1])
          onOnlyPromotedChange(false)
          onNetworkChange('all')
          onTimeRemainingChange('all')
        }}
        className="w-full py-2 px-4 text-sm text-text-secondary hover:text-text-primary border border-border rounded-lg hover:bg-background-tertiary transition-colors"
      >
        Clear All Filters
      </button>
    </div>
  )
}