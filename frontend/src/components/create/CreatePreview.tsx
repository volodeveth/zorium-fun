import { useState } from 'react'
import { Zap, Clock, DollarSign } from 'lucide-react'
import { SUPPORTED_NETWORKS, DEFAULT_MINT_PRICE, DEFAULT_FEE_BREAKDOWN, CUSTOM_FEE_BREAKDOWN } from '@/lib/web3/wagmi'

interface CreatePreviewProps {
  formData: any
  onBack: () => void
}

export default function CreatePreview({ formData, onBack }: CreatePreviewProps) {
  const [isCreating, setIsCreating] = useState(false)
  
  // Get network info
  const selectedNetwork = SUPPORTED_NETWORKS.find(n => n.id === formData.networkId) || SUPPORTED_NETWORKS[0]
  
  // Determine price and fee structure
  const finalPrice = formData.price || DEFAULT_MINT_PRICE
  const isDefaultPrice = !formData.price || formData.price === '' || formData.price === DEFAULT_MINT_PRICE

  const handleCreateNFT = async () => {
    setIsCreating(true)
    // Simulate NFT creation
    setTimeout(() => {
      setIsCreating(false)
      alert('NFT created successfully!')
    }, 3000)
  }

  return (
    <div className="bg-background-secondary rounded-xl border border-border p-8">
      <h2 className="text-2xl font-bold text-text-primary mb-6">Preview & Create</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* NFT Preview */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-text-primary">NFT Preview</h3>
          
          {/* NFT Card Preview */}
          <div className="nft-card">
            {/* Image */}
            <div className="relative aspect-square overflow-hidden">
              {formData.filePreview ? (
                formData.file.type.startsWith('image/') ? (
                  <img
                    src={formData.filePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  // For videos, show thumbnail if available, otherwise show video
                  formData.thumbnail ? (
                    <img
                      src={formData.thumbnail}
                      alt="Video thumbnail"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={formData.filePreview}
                      className="w-full h-full object-cover"
                    />
                  )
                )
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-primary/20 to-blue-500/20 flex items-center justify-center">
                  <div className="text-text-secondary text-sm">NFT Preview</div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-text-primary font-semibold truncate">
                  {formData.title || 'Untitled'}
                </h3>
              </div>
              
              <p className="text-text-secondary text-sm mb-3">
                by @you
              </p>
              
              <div className="flex justify-between items-center">
                <div className="text-text-primary font-medium">
                  {finalPrice} ETH
                </div>
                <div className="text-text-secondary text-sm">
                  0 mints
                </div>
              </div>
              
              {/* Tags */}
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.tags.slice(0, 3).map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="bg-purple-primary/20 text-purple-primary px-2 py-1 rounded-full text-xs"
                    >
                      #{tag}
                    </span>
                  ))}
                  {formData.tags.length > 3 && (
                    <span className="text-text-secondary text-xs">
                      +{formData.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details & Summary */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-text-primary">Details</h3>
          
          {/* Metadata Summary */}
          <div className="bg-background-tertiary rounded-xl p-6">
            <div className="space-y-3">
              <div>
                <span className="text-text-secondary text-sm">Title:</span>
                <p className="text-text-primary font-medium">{formData.title || 'Untitled'}</p>
              </div>
              
              {formData.description && (
                <div>
                  <span className="text-text-secondary text-sm">Description:</span>
                  <p className="text-text-primary">{formData.description}</p>
                </div>
              )}
              
              <div>
                <span className="text-text-secondary text-sm">Collection:</span>
                <p className="text-text-primary font-medium">{formData.collection}</p>
              </div>
              
              {formData.tags.length > 0 && (
                <div>
                  <span className="text-text-secondary text-sm">Tags:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formData.tags.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="bg-purple-primary/20 text-purple-primary px-2 py-1 rounded-full text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fees Breakdown */}
          <div className="bg-background-tertiary rounded-xl p-6">
            <h4 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
              <DollarSign size={18} />
              Fee Breakdown
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Mint Price:</span>
                <span className="text-text-primary font-medium">{finalPrice} ETH</span>
              </div>
              
              {isDefaultPrice ? (
                // Default fee structure
                <>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Creator Fee:</span>
                    <span className="text-green-500">{DEFAULT_FEE_BREAKDOWN.CREATOR} ETH (50%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">First Minter Reward:</span>
                    <span className="text-blue-400">{DEFAULT_FEE_BREAKDOWN.FIRST_MINTER} ETH (10%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Referral Fee:</span>
                    <span className="text-purple-400">{DEFAULT_FEE_BREAKDOWN.REFERRAL} ETH (20%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Platform Fee:</span>
                    <span className="text-text-secondary">{DEFAULT_FEE_BREAKDOWN.PLATFORM} ETH (20%)</span>
                  </div>
                </>
              ) : (
                // Custom fee structure
                <>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Creator Fee:</span>
                    <span className="text-green-500">{(parseFloat(finalPrice) * CUSTOM_FEE_BREAKDOWN.CREATOR_PERCENTAGE).toFixed(6)} ETH (95%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Platform Fee:</span>
                    <span className="text-text-secondary">{(parseFloat(finalPrice) * CUSTOM_FEE_BREAKDOWN.PLATFORM_PERCENTAGE).toFixed(6)} ETH (5%)</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Gas Estimation */}
          <div className="bg-background-tertiary rounded-xl p-6">
            <h4 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
              <Zap size={18} />
              Gas Estimation
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Estimated Gas:</span>
                <span className="text-text-primary">{selectedNetwork.estimatedGas}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Network:</span>
                <span className="text-text-primary">{selectedNetwork.name}</span>
              </div>
              {selectedNetwork.id === 1 && (
                <div className="mt-2 p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <p className="text-orange-400 text-xs">
                    💡 Consider using L2 networks like Base or Optimism for lower gas fees
                  </p>
                </div>
              )}
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
              onClick={handleCreateNFT}
              disabled={isCreating}
              className={`btn-primary flex items-center gap-2 ${
                isCreating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Creating NFT...
                </>
              ) : (
                'Create NFT'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}