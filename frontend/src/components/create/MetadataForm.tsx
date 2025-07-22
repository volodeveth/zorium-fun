import { useState } from 'react'
import { Plus, X, ChevronDown } from 'lucide-react'

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
            Leave empty = default 0.000111 ETH
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
            value={formData.price}
            onChange={(e) => updateFormData('price', e.target.value)}
            placeholder="0.000111"
            className="w-full bg-background-tertiary border border-border rounded-lg px-4 py-3 text-text-primary placeholder-text-secondary focus:outline-none focus:border-purple-primary transition-colors"
          />
          <div className="mt-2 p-3 bg-background-tertiary rounded-lg">
            <div className="text-text-secondary text-sm space-y-1">
              <div className="flex justify-between">
                <span>Creator fee:</span>
                <span>0.000055 ETH</span>
              </div>
              <div className="flex justify-between">
                <span>First minter reward:</span>
                <span>0.000011 ETH</span>
              </div>
              <div className="flex justify-between">
                <span>Referral fee:</span>
                <span>0.000022 ETH</span>
              </div>
              <div className="flex justify-between">
                <span>Platform fee:</span>
                <span>0.000022 ETH</span>
              </div>
            </div>
          </div>
        </div>

        {/* Promote minting time limit */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="promote"
            className="w-4 h-4 text-purple-primary bg-background-tertiary border-border rounded focus:ring-purple-primary focus:ring-2"
          />
          <label htmlFor="promote" className="ml-3 text-text-primary">
            Promote minting time limit
          </label>
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