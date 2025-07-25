import { useState } from 'react'
import { Plus, X, ChevronDown } from 'lucide-react'
import { SUPPORTED_NETWORKS, DEFAULT_MINT_PRICE, DEFAULT_FEE_BREAKDOWN, CUSTOM_FEE_BREAKDOWN } from '@/lib/web3/wagmi'

interface MetadataFormProps {
  formData: any
  updateFormData: (field: string, value: any) => void
  onNext: () => void
  onBack: () => void
}

export default function MetadataForm({ formData, updateFormData, onNext, onBack }: MetadataFormProps) {
  const [newTag, setNewTag] = useState('')

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      updateFormData('tags', [...formData.tags, newTag.trim()])
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    updateFormData('tags', formData.tags.filter((tag: string) => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  const canProceed = formData.title.trim() && formData.collection.trim()

  return (
    <div className="bg-background-secondary rounded-xl border border-border p-8">
      <h2 className="text-2xl font-bold text-text-primary mb-6">Add Details</h2>
      
      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-text-primary font-medium mb-2">
            Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => updateFormData('title', e.target.value)}
            placeholder="Give your NFT a name"
            className="w-full bg-background-tertiary border border-border rounded-lg px-4 py-3 text-text-primary placeholder-text-secondary focus:outline-none focus:border-purple-primary transition-colors"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-text-primary font-medium mb-2">
            Optional Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => updateFormData('description', e.target.value)}
            placeholder="Tell the world about your NFT"
            rows={4}
            className="w-full bg-background-tertiary border border-border rounded-lg px-4 py-3 text-text-primary placeholder-text-secondary focus:outline-none focus:border-purple-primary transition-colors resize-none"
          />
        </div>

        {/* Network Selection */}
        <div>
          <label className="block text-text-primary font-medium mb-2">
            Network *
          </label>
          <div className="relative">
            <select
              value={formData.networkId || 8453} // Default to Base
              onChange={(e) => updateFormData('networkId', parseInt(e.target.value))}
              className="w-full bg-background-tertiary border border-border rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:border-purple-primary transition-colors appearance-none"
            >
              {SUPPORTED_NETWORKS.map((network) => (
                <option key={network.id} value={network.id}>
                  {network.name} ({network.symbol})
                  {network.isDefault ? ' - Default' : ''}
                </option>
              ))}
            </select>
            <ChevronDown 
              size={16} 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary pointer-events-none" 
            />
          </div>
          <p className="text-text-secondary text-sm mt-1">
            Select the blockchain network to deploy your NFT on
          </p>
          
          {/* Gas fee hint */}
          {formData.networkId && (
            <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-400 text-xs">
                ⚡ Estimated gas cost: {SUPPORTED_NETWORKS.find(n => n.id === formData.networkId)?.estimatedGas || '~$0.01'}
              </p>
            </div>
          )}
        </div>

        {/* Collection */}
        <div>
          <label className="block text-text-primary font-medium mb-2">
            Collection *
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.collection}
              onChange={(e) => updateFormData('collection', e.target.value)}
              placeholder="Choose or create new"
              className="w-full bg-background-tertiary border border-border rounded-lg px-4 py-3 text-text-primary placeholder-text-secondary focus:outline-none focus:border-purple-primary transition-colors"
            />
            <button 
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-purple-primary transition-colors"
            >
              <ChevronDown size={16} />
            </button>
          </div>
          <p className="text-text-secondary text-sm mt-1">
            Create new collection or select existing one
          </p>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-text-primary font-medium mb-2">
            Tags
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add a tag"
              className="flex-1 bg-background-tertiary border border-border rounded-lg px-4 py-2 text-text-primary placeholder-text-secondary focus:outline-none focus:border-purple-primary transition-colors"
            />
            <button
              type="button"
              onClick={addTag}
              className="btn-secondary"
            >
              <Plus size={16} />
            </button>
          </div>
          
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag: string, index: number) => (
                <span
                  key={index}
                  className="bg-purple-primary/20 text-purple-primary px-3 py-1 rounded-full text-sm flex items-center gap-1"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Mint Price */}
        <div>
          <label className="block text-text-primary font-medium mb-2">
            Mint Price (ETH)
          </label>
          <input
            type="text"
            value={formData.price || ''}
            onChange={(e) => updateFormData('price', e.target.value)}
            placeholder={DEFAULT_MINT_PRICE}
            className="w-full bg-background-tertiary border border-border rounded-lg px-4 py-3 text-text-primary placeholder-text-secondary focus:outline-none focus:border-purple-primary transition-colors"
          />
          <p className="text-text-secondary text-sm mt-1">
            Leave empty = default {DEFAULT_MINT_PRICE} ETH
          </p>
          
          <div className="mt-3 p-3 bg-background-tertiary rounded-lg">
            {(!formData.price || formData.price === '' || formData.price === DEFAULT_MINT_PRICE) ? (
              // Default fee structure
              <div className="text-text-secondary text-sm space-y-1">
                <div className="text-text-primary font-medium mb-2">Default fee structure ({DEFAULT_MINT_PRICE} ETH):</div>
                <div className="flex justify-between">
                  <span>Creator fee:</span>
                  <span>{DEFAULT_FEE_BREAKDOWN.CREATOR} ETH (50%)</span>
                </div>
                <div className="flex justify-between">
                  <span>First minter reward:</span>
                  <span>{DEFAULT_FEE_BREAKDOWN.FIRST_MINTER} ETH (10%)</span>
                </div>
                <div className="flex justify-between">
                  <span>Referral fee:</span>
                  <span>{DEFAULT_FEE_BREAKDOWN.REFERRAL} ETH (20%)</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform fee:</span>
                  <span>{DEFAULT_FEE_BREAKDOWN.PLATFORM} ETH (20%)</span>
                </div>
              </div>
            ) : (
              // Custom price fee structure
              <div className="text-text-secondary text-sm space-y-1">
                <div className="text-text-primary font-medium mb-2">Custom price fee structure:</div>
                <div className="flex justify-between">
                  <span>Creator fee:</span>
                  <span>{(parseFloat(formData.price || '0') * CUSTOM_FEE_BREAKDOWN.CREATOR_PERCENTAGE).toFixed(6)} ETH (95%)</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform fee:</span>
                  <span>{(parseFloat(formData.price || '0') * CUSTOM_FEE_BREAKDOWN.PLATFORM_PERCENTAGE).toFixed(6)} ETH (5%)</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* NFT Promotion */}
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="promote"
              checked={formData.promotionEnabled || false}
              onChange={(e) => updateFormData('promotionEnabled', e.target.checked)}
              className="w-4 h-4 text-purple-primary bg-background-tertiary border-border rounded focus:ring-purple-primary focus:ring-2"
            />
            <label htmlFor="promote" className="ml-3 text-text-primary font-medium">
              Promote NFT (requires ZRM tokens)
            </label>
          </div>
          
          {formData.promotionEnabled && (
            <div className="ml-7 space-y-3">
              <p className="text-text-secondary text-sm">
                Choose promotion duration. You'll need to approve ZRM tokens for promotion.
              </p>
              
              <div className="space-y-2">
                <label className="flex items-center p-3 bg-background-tertiary rounded-lg border cursor-pointer hover:border-purple-primary transition-colors">
                  <input
                    type="radio"
                    name="promotionDuration"
                    value="12h"
                    checked={formData.promotionDuration === '12h'}
                    onChange={(e) => updateFormData('promotionDuration', e.target.value)}
                    className="w-4 h-4 text-purple-primary"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-text-primary font-medium">12 Hours</span>
                      <span className="text-purple-primary font-bold">10,000 ZRM</span>
                    </div>
                  </div>
                </label>
                
                <label className="flex items-center p-3 bg-background-tertiary rounded-lg border cursor-pointer hover:border-purple-primary transition-colors">
                  <input
                    type="radio"
                    name="promotionDuration"
                    value="1d"
                    checked={formData.promotionDuration === '1d'}
                    onChange={(e) => updateFormData('promotionDuration', e.target.value)}
                    className="w-4 h-4 text-purple-primary"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-text-primary font-medium">1 Day</span>
                      <span className="text-purple-primary font-bold">18,000 ZRM</span>
                    </div>
                  </div>
                </label>
                
                <label className="flex items-center p-3 bg-background-tertiary rounded-lg border cursor-pointer hover:border-purple-primary transition-colors">
                  <input
                    type="radio"
                    name="promotionDuration"
                    value="3d"
                    checked={formData.promotionDuration === '3d'}
                    onChange={(e) => updateFormData('promotionDuration', e.target.value)}
                    className="w-4 h-4 text-purple-primary"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-text-primary font-medium">3 Days</span>
                      <span className="text-purple-primary font-bold">50,000 ZRM</span>
                    </div>
                  </div>
                </label>
                
                <label className="flex items-center p-3 bg-background-tertiary rounded-lg border cursor-pointer hover:border-purple-primary transition-colors">
                  <input
                    type="radio"
                    name="promotionDuration"
                    value="5d"
                    checked={formData.promotionDuration === '5d'}
                    onChange={(e) => updateFormData('promotionDuration', e.target.value)}
                    className="w-4 h-4 text-purple-primary"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-text-primary font-medium">5 Days</span>
                      <span className="text-purple-primary font-bold">80,000 ZRM</span>
                    </div>
                  </div>
                </label>
                
                <label className="flex items-center p-3 bg-background-tertiary rounded-lg border cursor-pointer hover:border-purple-primary transition-colors">
                  <input
                    type="radio"
                    name="promotionDuration"
                    value="7d"
                    checked={formData.promotionDuration === '7d'}
                    onChange={(e) => updateFormData('promotionDuration', e.target.value)}
                    className="w-4 h-4 text-purple-primary"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-text-primary font-medium">7 Days</span>
                      <span className="text-purple-primary font-bold">100,000 ZRM</span>
                    </div>
                  </div>
                </label>
              </div>
              
              <div className="bg-purple-primary/10 border border-purple-primary/20 rounded-lg p-3">
                <p className="text-purple-primary text-sm">
                  <strong>Note:</strong> ZRM tokens will be deducted from your approved balance when the NFT is created. 
                  Make sure to approve sufficient ZRM tokens in your wallet first.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <button
            onClick={onBack}
            className="btn-secondary"
          >
            Back
          </button>
          <button
            onClick={onNext}
            disabled={!canProceed}
            className={`btn-primary ${
              !canProceed ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Preview NFT
          </button>
        </div>
      </div>
    </div>
  )
}