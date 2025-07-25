'use client'

import { useState } from 'react'
import { X, Edit, Megaphone, Eye, EyeOff, Share2, BarChart3 } from 'lucide-react'

interface NFT {
  id: number
  title: string
  creator: string
  image: string
  price: string
  promoted?: boolean
  likes: number
  mints: number
  description?: string
  isVisible?: boolean
}

interface NFTManageModalProps {
  isOpen: boolean
  onClose: () => void
  nft: NFT
  onUpdate: (updatedNft: NFT) => void
}

export default function NFTManageModal({ isOpen, onClose, nft, onUpdate }: NFTManageModalProps) {
  const [editMode, setEditMode] = useState<'view' | 'edit' | 'promote'>('view')
  const [editedNft, setEditedNft] = useState<NFT>(nft)

  if (!isOpen) return null

  const handleSave = () => {
    onUpdate(editedNft)
    setEditMode('view')
  }


  const handleToggleVisibility = () => {
    const updated = { ...editedNft, isVisible: !editedNft.isVisible }
    setEditedNft(updated)
    onUpdate(updated)
  }

  const handlePromote = () => {
    setEditMode('promote')
  }

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/nft/${nft.id}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: nft.title,
          text: `Check out "${nft.title}" NFT on Zorium.fun`,
          url: shareUrl,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl)
        // TODO: Show toast notification
        console.log('NFT link copied to clipboard')
      } catch (error) {
        console.log('Error copying to clipboard:', error)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background-secondary rounded-xl border border-border w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-text-primary">
            {editMode === 'edit' ? 'Edit NFT' : editMode === 'promote' ? 'Promote NFT' : 'Manage NFT'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-background-tertiary rounded-lg transition-colors"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {editMode === 'view' && (
            <div className="space-y-6">
              {/* NFT Preview */}
              <div className="flex gap-6">
                <div className="w-48 h-48 bg-gradient-to-br from-purple-primary/20 to-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <div className="text-text-secondary">NFT Preview</div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-text-primary mb-2">{nft.title}</h3>
                  <p className="text-text-secondary mb-4">by {nft.creator}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Price:</span>
                      <span className="text-text-primary font-medium">{nft.price} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Likes:</span>
                      <span className="text-text-primary">{nft.likes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Mints:</span>
                      <span className="text-text-primary">{nft.mints}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Status:</span>
                      <span className={`${nft.promoted ? 'text-purple-primary' : 'text-text-primary'}`}>
                        {nft.promoted ? 'Promoted' : 'Standard'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Management Actions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => setEditMode('edit')}
                  className="flex flex-col items-center p-4 bg-background-tertiary hover:bg-purple-primary/20 rounded-lg transition-colors"
                >
                  <Edit size={24} className="text-purple-primary mb-2" />
                  <span className="text-text-primary text-sm">Edit</span>
                </button>

                <button
                  onClick={handlePromote}
                  className="flex flex-col items-center p-4 bg-background-tertiary hover:bg-purple-primary/20 rounded-lg transition-colors"
                >
                  <Megaphone size={24} className="text-purple-primary mb-2" />
                  <span className="text-text-primary text-sm">Promote</span>
                </button>

                <button
                  onClick={handleToggleVisibility}
                  className="flex flex-col items-center p-4 bg-background-tertiary hover:bg-purple-primary/20 rounded-lg transition-colors"
                >
                  {editedNft.isVisible === false ? <EyeOff size={24} className="text-yellow-500 mb-2" /> : <Eye size={24} className="text-green-500 mb-2" />}
                  <span className="text-text-primary text-sm">
                    {editedNft.isVisible === false ? 'Show' : 'Hide'}
                  </span>
                </button>

                <button
                  onClick={handleShare}
                  className="flex flex-col items-center p-4 bg-background-tertiary hover:bg-purple-primary/20 rounded-lg transition-colors"
                >
                  <Share2 size={24} className="text-blue-500 mb-2" />
                  <span className="text-text-primary text-sm">Share</span>
                </button>
              </div>

              {/* Analytics */}
              <div className="bg-background-tertiary rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 size={20} className="text-purple-primary" />
                  <h4 className="text-text-primary font-semibold">Analytics</h4>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-text-primary">{nft.likes}</div>
                    <div className="text-text-secondary text-sm">Total Likes</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-text-primary">{nft.mints}</div>
                    <div className="text-text-secondary text-sm">Total Mints</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-text-primary">
                      {(parseFloat(nft.price) * nft.mints).toFixed(3)}
                    </div>
                    <div className="text-text-secondary text-sm">Total Earned (ETH)</div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {editMode === 'edit' && (
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
                <p className="text-blue-400 text-sm">
                  <strong>Note:</strong> NFT title and media cannot be edited after creation due to blockchain immutability.
                </p>
              </div>
              
              {/* Only show price editing if it's not the default price */}
              {editedNft.price !== '0.000111' && (
                <div>
                  <label className="block text-text-primary font-medium mb-2">
                    Price (ETH)
                    <span className="text-text-secondary text-sm ml-2">(Custom price can be edited)</span>
                  </label>
                  <input
                    type="text"
                    value={editedNft.price}
                    onChange={(e) => setEditedNft({ ...editedNft, price: e.target.value })}
                    className="w-full bg-background-tertiary border border-border rounded-lg px-4 py-2 text-text-primary"
                    placeholder="0.001"
                  />
                </div>
              )}
              
              {/* Show readonly price if it's default */}
              {editedNft.price === '0.000111' && (
                <div>
                  <label className="block text-text-primary font-medium mb-2">
                    Price (ETH)
                    <span className="text-text-secondary text-sm ml-2">(Default price cannot be changed)</span>
                  </label>
                  <div className="w-full bg-background-tertiary border border-border rounded-lg px-4 py-2 text-text-secondary">
                    {editedNft.price} ETH (Default)
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-text-primary font-medium mb-2">Description</label>
                <textarea
                  value={editedNft.description || ''}
                  onChange={(e) => setEditedNft({ ...editedNft, description: e.target.value })}
                  rows={4}
                  className="w-full bg-background-tertiary border border-border rounded-lg px-4 py-2 text-text-primary"
                  placeholder="Update your NFT description..."
                />
              </div>
            </div>
          )}

          {editMode === 'promote' && (
            <div className="space-y-4">
              <div className="bg-purple-primary/10 border border-purple-primary/20 rounded-lg p-4">
                <h4 className="text-purple-primary font-semibold mb-2">Promote Your NFT</h4>
                <p className="text-text-secondary text-sm mb-4">
                  Boost your NFT's visibility using ZRM tokens. Promoted NFTs appear in featured sections and get more exposure.
                </p>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 bg-background-tertiary rounded-lg border cursor-pointer hover:border-purple-primary transition-colors">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="promotionDuration"
                        value="12h"
                        className="w-4 h-4 text-purple-primary mr-3"
                      />
                      <span className="text-text-primary font-medium">12 Hours</span>
                    </div>
                    <span className="text-purple-primary font-bold">10,000 ZRM</span>
                  </label>
                  
                  <label className="flex items-center justify-between p-3 bg-background-tertiary rounded-lg border cursor-pointer hover:border-purple-primary transition-colors">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="promotionDuration"
                        value="1d"
                        className="w-4 h-4 text-purple-primary mr-3"
                      />
                      <span className="text-text-primary font-medium">1 Day</span>
                    </div>
                    <span className="text-purple-primary font-bold">18,000 ZRM</span>
                  </label>
                  
                  <label className="flex items-center justify-between p-3 bg-background-tertiary rounded-lg border cursor-pointer hover:border-purple-primary transition-colors">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="promotionDuration"
                        value="3d"
                        className="w-4 h-4 text-purple-primary mr-3"
                      />
                      <span className="text-text-primary font-medium">3 Days</span>
                    </div>
                    <span className="text-purple-primary font-bold">50,000 ZRM</span>
                  </label>
                  
                  <label className="flex items-center justify-between p-3 bg-background-tertiary rounded-lg border cursor-pointer hover:border-purple-primary transition-colors">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="promotionDuration"
                        value="5d"
                        className="w-4 h-4 text-purple-primary mr-3"
                      />
                      <span className="text-text-primary font-medium">5 Days</span>
                    </div>
                    <span className="text-purple-primary font-bold">80,000 ZRM</span>
                  </label>
                  
                  <label className="flex items-center justify-between p-3 bg-background-tertiary rounded-lg border cursor-pointer hover:border-purple-primary transition-colors">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="promotionDuration"
                        value="7d"
                        className="w-4 h-4 text-purple-primary mr-3"
                      />
                      <span className="text-text-primary font-medium">7 Days</span>
                    </div>
                    <span className="text-purple-primary font-bold">100,000 ZRM</span>
                  </label>
                </div>
                
                <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <p className="text-blue-400 text-sm">
                    <strong>Note:</strong> Make sure you have approved sufficient ZRM tokens in the NFT Promotion page first. 
                    ZRM tokens will be deducted from your approved balance when promotion starts.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-border">
          {editMode === 'edit' && (
            <>
              <button
                onClick={() => setEditMode('view')}
                className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-purple-primary hover:bg-purple-hover text-white px-4 py-2 rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </>
          )}
          {editMode === 'promote' && (
            <>
              <button
                onClick={() => setEditMode('view')}
                className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // TODO: Implement promotion logic
                  console.log('Promoting NFT:', nft.id)
                  setEditMode('view')
                }}
                className="bg-purple-primary hover:bg-purple-hover text-white px-4 py-2 rounded-lg transition-colors"
              >
                Start Promotion
              </button>
            </>
          )}
          {editMode === 'view' && (
            <button
              onClick={onClose}
              className="bg-purple-primary hover:bg-purple-hover text-white px-4 py-2 rounded-lg transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}