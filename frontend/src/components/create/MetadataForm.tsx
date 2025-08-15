import { useState } from 'react'
import { Plus, X, ChevronDown, Info, Clock, Users } from 'lucide-react'
import { getSupportedChainIds, getNetworkConfig, CONTRACT_CONSTANTS } from '@/lib/web3/contracts'

type CreationType = 'collection' | 'personal' | 'token'

interface MetadataFormProps {
  formData: any
  updateFormData: (field: string, value: any) => void
  onNext: () => void
  onBack: () => void
  creationType: CreationType
}

export default function MetadataForm({ formData, updateFormData, onNext, onBack, creationType }: MetadataFormProps) {
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

  const supportedChainIds = getSupportedChainIds()
  const selectedNetwork = getNetworkConfig(formData.networkId || 8453)

  // Validation logic based on creation type
  const getValidationRules = () => {
    const baseRules = {
      title: formData.title.trim(),
      networkId: formData.networkId
    }

    switch (creationType) {
      case 'collection':
        return {
          ...baseRules,
          collectionName: formData.collectionName?.trim(),
          collectionSymbol: formData.collectionSymbol?.trim()
        }
      case 'personal':
        return baseRules
      case 'token':
        return {
          ...baseRules,
          existingCollection: formData.existingCollection?.trim()
        }
      default:
        return baseRules
    }
  }

  const validationRules = getValidationRules()
  const canProceed = Object.values(validationRules).every(Boolean) && 
    (!formData.isCustomPrice || formData.mintEndTime)

  const renderCollectionFields = () => {
    if (creationType !== 'collection') return null

    return (
      <>
        {/* Collection Name */}
        <div>
          <label className="block text-text-primary font-medium mb-2">
            Collection Name *
          </label>
          <input
            type="text"
            value={formData.collectionName || ''}
            onChange={(e) => updateFormData('collectionName', e.target.value)}
            placeholder="My Amazing Collection"
            className="w-full bg-background-tertiary border border-border rounded-lg px-4 py-3 text-text-primary placeholder-text-secondary focus:outline-none focus:border-purple-primary transition-colors"
          />
          <p className="text-text-secondary text-xs mt-1">
            This will be the name of your collection that can hold multiple NFTs
          </p>
        </div>

        {/* Collection Symbol */}
        <div>
          <label className="block text-text-primary font-medium mb-2">
            Collection Symbol *
          </label>
          <input
            type="text"
            value={formData.collectionSymbol || ''}
            onChange={(e) => updateFormData('collectionSymbol', e.target.value.toUpperCase())}
            placeholder="MAC"
            maxLength={10}
            className="w-full bg-background-tertiary border border-border rounded-lg px-4 py-3 text-text-primary placeholder-text-secondary focus:outline-none focus:border-purple-primary transition-colors"
          />
          <p className="text-text-secondary text-xs mt-1">
            Short symbol for your collection (max 10 characters)
          </p>
        </div>

        {/* Collection Description */}
        <div>
          <label className="block text-text-primary font-medium mb-2">
            Collection Description
          </label>
          <textarea
            value={formData.collectionDescription || ''}
            onChange={(e) => updateFormData('collectionDescription', e.target.value)}
            placeholder="Describe your collection and what makes it special"
            rows={3}
            className="w-full bg-background-tertiary border border-border rounded-lg px-4 py-3 text-text-primary placeholder-text-secondary focus:outline-none focus:border-purple-primary transition-colors resize-none"
          />
        </div>
      </>
    )
  }

  const renderTokenFields = () => {
    if (creationType !== 'token') return null

    return (
      <div>
        <label className="block text-text-primary font-medium mb-2">
          Select Collection *
        </label>
        <div className="relative">
          <select
            value={formData.existingCollection || ''}
            onChange={(e) => updateFormData('existingCollection', e.target.value)}
            className="w-full bg-background-tertiary border border-border rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:border-purple-primary transition-colors appearance-none"
          >
            <option value="">Select a collection...</option>
            {/* TODO: Load user's collections dynamically */}
            <option value="collection1">My First Collection</option>
            <option value="collection2">Digital Art Series</option>
          </select>
          <ChevronDown 
            size={16} 
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary pointer-events-none" 
          />
        </div>
        <p className="text-text-secondary text-xs mt-1">
          Choose which collection to add this NFT to
        </p>
      </div>
    )
  }

  return (
    <div className="bg-background-secondary rounded-xl border border-border p-8">
      <h2 className="text-2xl font-bold text-text-primary mb-6">
        {creationType === 'collection' ? 'Collection & NFT Details' :
         creationType === 'personal' ? 'Personal NFT Details' :
         'NFT Token Details'}
      </h2>
      
      <div className="space-y-6">
        {/* Creation Type Info */}
        <div className="bg-background-tertiary rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Info size={16} className="text-blue-primary" />
            <span className="text-text-primary font-medium">
              {creationType === 'collection' ? 'Creating New Collection' :
               creationType === 'personal' ? 'Creating Personal NFT' :
               'Adding to Existing Collection'}
            </span>
          </div>
          <p className="text-text-secondary text-sm">
            {creationType === 'collection' ? 
              'This will create a new collection contract that can hold multiple NFT tokens. You\'ll mint the first NFT in this collection.' :
             creationType === 'personal' ? 
              'This will create a personal collection with just one NFT. Perfect for single artworks.' :
              'This will add a new NFT token to your selected existing collection.'}
          </p>
        </div>

        {/* Collection-specific fields */}
        {renderCollectionFields()}

        {/* Token-specific fields */}
        {renderTokenFields()}

        {/* NFT Title */}
        <div>
          <label className="block text-text-primary font-medium mb-2">
            {creationType === 'collection' ? 'First NFT Title *' : 'NFT Title *'}
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => updateFormData('title', e.target.value)}
            placeholder="Give your NFT a name"
            className="w-full bg-background-tertiary border border-border rounded-lg px-4 py-3 text-text-primary placeholder-text-secondary focus:outline-none focus:border-purple-primary transition-colors"
          />
        </div>

        {/* NFT Description */}
        <div>
          <label className="block text-text-primary font-medium mb-2">
            NFT Description
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
            Blockchain Network *
          </label>
          <div className="relative">
            <select
              value={formData.networkId || 8453}
              onChange={(e) => updateFormData('networkId', parseInt(e.target.value))}
              className="w-full bg-background-tertiary border border-border rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:border-purple-primary transition-colors appearance-none"
            >
              {supportedChainIds.map((chainId) => {
                const network = getNetworkConfig(chainId)
                return (
                  <option key={chainId} value={chainId}>
                    {network.name} - {network.isMainNetwork ? 'Mainnet' : 'Testnet'}
                  </option>
                )
              })}
            </select>
            <ChevronDown 
              size={16} 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary pointer-events-none" 
            />
          </div>
          <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-blue-400 text-xs">
              ⚡ Selected: {selectedNetwork.name} | Block Explorer: {selectedNetwork.blockExplorer}
            </p>
          </div>
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

        {/* Pricing Options */}
        <div>
          <label className="block text-text-primary font-medium mb-3">
            Pricing Model
          </label>
          
          <div className="space-y-3">
            {/* Default Pricing */}
            <label className="flex items-start p-4 bg-background-tertiary rounded-lg border cursor-pointer hover:border-purple-primary transition-colors">
              <input
                type="radio"
                name="pricingModel"
                checked={!formData.isCustomPrice}
                onChange={() => {
                  updateFormData('isCustomPrice', false)
                  updateFormData('price', '')
                  updateFormData('mintEndTime', '')
                }}
                className="w-4 h-4 text-purple-primary mt-1"
              />
              <div className="ml-3 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-text-primary font-medium">Default Price</span>
                  <span className="bg-green-primary/20 text-green-primary px-2 py-0.5 rounded text-xs">Recommended</span>
                </div>
                <p className="text-text-secondary text-sm mb-2">
                  {(BigInt(CONTRACT_CONSTANTS.DEFAULT_MINT_PRICE) / BigInt(10**18)).toString()} ETH per mint
                </p>
                <div className="bg-background-primary rounded p-3">
                  <p className="text-text-secondary text-xs mb-2">Fee Distribution:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>• Creator: 50%</div>
                    <div>• First Minter: 10%</div>
                    <div>• Referral: 20%</div>
                    <div>• Platform: 20%</div>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-green-400">
                    <Clock size={12} />
                    <span className="text-xs">Timer Logic: 1000 mints → 48h countdown</span>
                  </div>
                </div>
              </div>
            </label>

            {/* Custom Pricing */}
            <label className="flex items-start p-4 bg-background-tertiary rounded-lg border cursor-pointer hover:border-purple-primary transition-colors">
              <input
                type="radio"
                name="pricingModel"
                checked={formData.isCustomPrice}
                onChange={() => updateFormData('isCustomPrice', true)}
                className="w-4 h-4 text-purple-primary mt-1"
              />
              <div className="ml-3 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-text-primary font-medium">Custom Price</span>
                  <span className="bg-purple-primary/20 text-purple-primary px-2 py-0.5 rounded text-xs">Advanced</span>
                </div>
                <p className="text-text-secondary text-sm mb-2">
                  Set your own price and time duration
                </p>
                <div className="bg-background-primary rounded p-3">
                  <p className="text-text-secondary text-xs mb-2">Fee Distribution:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>• Creator: 95%</div>
                    <div>• Platform: 5%</div>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-orange-400">
                    <Users size={12} />
                    <span className="text-xs">No first minter rewards or referral system</span>
                  </div>
                </div>
              </div>
            </label>
          </div>

          {/* Custom Price Fields */}
          {formData.isCustomPrice && (
            <div className="mt-4 space-y-4 p-4 bg-background-tertiary rounded-lg border border-purple-primary/20">
              <div>
                <label className="block text-text-primary font-medium mb-2">
                  Custom Price (ETH) *
                </label>
                <input
                  type="number"
                  step="0.000001"
                  min="0"
                  value={formData.price || ''}
                  onChange={(e) => updateFormData('price', e.target.value)}
                  placeholder="0.001"
                  className="w-full bg-background-primary border border-border rounded-lg px-4 py-3 text-text-primary placeholder-text-secondary focus:outline-none focus:border-purple-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-text-primary font-medium mb-2">
                  Mint Duration *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { value: '86400', label: '1 Day' },
                    { value: '259200', label: '3 Days' },
                    { value: '604800', label: '7 Days' },
                    { value: '2592000', label: '30 Days' },
                    { value: '15552000', label: '180 Days' },
                    { value: '31536000', label: '1 Year' }
                  ].map((duration) => (
                    <label 
                      key={duration.value}
                      className="flex items-center p-2 bg-background-primary rounded border cursor-pointer hover:border-purple-primary transition-colors"
                    >
                      <input
                        type="radio"
                        name="mintEndTime"
                        value={duration.value}
                        checked={formData.mintEndTime === duration.value}
                        onChange={(e) => updateFormData('mintEndTime', e.target.value)}
                        className="w-3 h-3 text-purple-primary"
                      />
                      <span className="ml-2 text-text-primary text-sm">{duration.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ERC-1155 Features Info */}
        <div className="bg-gradient-to-r from-purple-primary/10 to-blue-primary/10 rounded-lg p-4 border border-purple-primary/20">
          <h4 className="text-text-primary font-medium mb-2 flex items-center gap-2">
            <span className="bg-purple-primary/20 text-purple-primary px-2 py-1 rounded text-xs">ERC-1155</span>
            Advanced Features
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-text-secondary">Multi-quantity support</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-text-secondary">Gas optimized</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span className="text-text-secondary">First minter rewards</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              <span className="text-text-secondary">Built-in marketplace</span>
            </div>
          </div>
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
            Preview & Create
          </button>
        </div>
      </div>
    </div>
  )
}