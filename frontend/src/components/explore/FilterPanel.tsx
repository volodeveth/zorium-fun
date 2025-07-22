'use client'

import { Sliders, Star } from 'lucide-react'

interface FilterPanelProps {
  priceRange: number[]
  onPriceRangeChange: (range: number[]) => void
  onlyPromoted: boolean
  onOnlyPromotedChange: (promoted: boolean) => void
}

export default function FilterPanel({ 
  priceRange, 
  onPriceRangeChange,
  onlyPromoted,
  onOnlyPromotedChange
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
          
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={priceRange[0]}
              onChange={(e) => onPriceRangeChange([parseFloat(e.target.value) || 0, priceRange[1]])}
              className="flex-1 px-3 py-2 bg-background-primary border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              step="0.000001"
            />
            <input
              type="number"
              placeholder="Max"
              value={priceRange[1]}
              onChange={(e) => onPriceRangeChange([priceRange[0], parseFloat(e.target.value) || 1])}
              className="flex-1 px-3 py-2 bg-background-primary border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              step="0.000001"
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

      {/* Clear Filters */}
      <button
        onClick={() => {
          onPriceRangeChange([0, 1])
          onOnlyPromotedChange(false)
        }}
        className="w-full py-2 px-4 text-sm text-text-secondary hover:text-text-primary border border-border rounded-lg hover:bg-background-tertiary transition-colors"
      >
        Clear All Filters
      </button>
    </div>
  )
}