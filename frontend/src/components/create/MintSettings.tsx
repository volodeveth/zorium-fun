'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, DollarSign, Info } from 'lucide-react'
import Input from '@/components/common/Input'
import FeeBreakdown from '@/components/common/FeeBreakdown'
import { extractReferralFromUrl } from '@/lib/utils/feeCalculator'

interface MintSettingsProps {
  onUpdate: (settings: MintSettings) => void
  initialSettings?: Partial<MintSettings>
}

export interface MintSettings {
  price: string
  mintDuration: string
  maxSupply: string
  referralAddress?: string
}

export default function MintSettings({ onUpdate, initialSettings }: MintSettingsProps) {
  const [settings, setSettings] = useState<MintSettings>({
    price: initialSettings?.price || '0.000111',
    mintDuration: initialSettings?.mintDuration || '',
    maxSupply: initialSettings?.maxSupply || '',
    referralAddress: initialSettings?.referralAddress || ''
  })

  const [hasReferral, setHasReferral] = useState(false)
  const [useCustomPrice, setUseCustomPrice] = useState(false)

  // Check for referral in URL on component mount
  useEffect(() => {
    const referralFromUrl = extractReferralFromUrl()
    if (referralFromUrl) {
      setSettings(prev => ({ ...prev, referralAddress: referralFromUrl }))
      setHasReferral(true)
    }
  }, [])

  // Update parent component when settings change
  useEffect(() => {
    onUpdate(settings)
  }, [settings, onUpdate])

  // Update hasReferral state when referralAddress changes
  useEffect(() => {
    setHasReferral(!!settings.referralAddress && settings.referralAddress.length > 0)
  }, [settings.referralAddress])

  const handleInputChange = (field: keyof MintSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const handlePriceToggle = (useCustom: boolean) => {
    setUseCustomPrice(useCustom)
    if (!useCustom) {
      setSettings(prev => ({ ...prev, price: '0.000111' }))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-4">Mint Settings</h3>
        
        {/* Price Settings */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Mint Price
            </label>
            
            {/* Price Type Toggle */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => handlePriceToggle(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !useCustomPrice
                    ? 'bg-purple-primary text-white'
                    : 'bg-background-secondary text-text-secondary hover:text-text-primary'
                }`}
              >
                Default (0.000111 ETH)
              </button>
              <button
                type="button"
                onClick={() => handlePriceToggle(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  useCustomPrice
                    ? 'bg-purple-primary text-white'
                    : 'bg-background-secondary text-text-secondary hover:text-text-primary'
                }`}
              >
                Custom Price
              </button>
            </div>

            {useCustomPrice && (
              <div className="relative">
                <DollarSign size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
                <Input
                  type="number"
                  step="0.000001"
                  min="0"
                  value={settings.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="0.000111"
                  className="pl-10"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary text-sm">
                  ETH
                </span>
              </div>
            )}
            
            {!useCustomPrice && (
              <div className="bg-background-secondary rounded-lg p-3 border border-border">
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Info size={16} />
                  <span>Using platform default price with optimized fee distribution</span>
                </div>
              </div>
            )}
          </div>

          {/* Mint Duration */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Mint Duration (Optional)
            </label>
            <div className="relative">
              <Clock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
              <Input
                type="number"
                min="1"
                value={settings.mintDuration}
                onChange={(e) => handleInputChange('mintDuration', e.target.value)}
                placeholder="Leave empty for unlimited time"
                className="pl-10"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary text-sm">
                days
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              If left empty, minting will be available indefinitely
            </p>
          </div>

          {/* Max Supply */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Maximum Supply (Optional)
            </label>
            <div className="relative">
              <Input
                type="number"
                min="1"
                value={settings.maxSupply}
                onChange={(e) => handleInputChange('maxSupply', e.target.value)}
                placeholder="Leave empty for unlimited supply"
                className=""
              />
            </div>
            <p className="text-xs text-text-secondary mt-1">
              If left empty, unlimited copies can be minted
            </p>
          </div>

          {/* Referral Address Display */}
          {settings.referralAddress && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Referral Address
              </label>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-700 dark:text-green-300 font-mono text-xs">
                    {settings.referralAddress}
                  </span>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Referrer will receive 20% of mint fees
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fee Breakdown */}
      <FeeBreakdown 
        hasReferral={hasReferral}
        customTotal={parseFloat(settings.price) || undefined}
        variant="detailed"
      />

      {/* Additional Info */}
      <div className="bg-background-secondary rounded-lg p-4 border border-border">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-purple-primary mt-0.5 flex-shrink-0" />
          <div className="text-sm text-text-secondary">
            <p className="mb-2">
              <strong className="text-text-primary">First Minter Reward:</strong> The first person to mint 
              your NFT will receive 0.000011 ETH as a reward for being first.
            </p>
            <p>
              <strong className="text-text-primary">Creator Earnings:</strong> You'll receive 50% of all 
              mint fees. Additional mints beyond the first will give you the full creator fee.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}