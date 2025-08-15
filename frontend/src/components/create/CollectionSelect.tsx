import { useState, useEffect } from 'react'
import { ChevronDown, Search, Layers, User, Clock } from 'lucide-react'
import { useAccount } from 'wagmi'
import { api } from '@/lib/api'

interface Collection {
  id: string
  name: string
  symbol: string
  contractAddress: string
  description?: string
  isPersonal: boolean
  creatorAddress: string
  chainId: number
  createdAt: string
  _count?: {
    nftTokens: number
  }
}

interface CollectionSelectProps {
  formData: any
  updateFormData: (field: string, value: any) => void
}

export default function CollectionSelect({ formData, updateFormData }: CollectionSelectProps) {
  const { address } = useAccount()
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)

  // Load user's collections
  useEffect(() => {
    const loadCollections = async () => {
      if (!address) return
      
      setLoading(true)
      try {
        const response = await api.collections.getByCreator(address, 1, 50)
        if (response.ok) {
          const data = await response.json()
          setCollections(data.collections || [])
        }
      } catch (error) {
        console.error('Failed to load collections:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCollections()
  }, [address])

  // Filter collections based on search term
  const filteredLayerss = collections.filter(collection =>
    collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collection.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handle collection selection
  const handleSelectLayers = (collection: Collection) => {
    setSelectedCollection(collection)
    updateFormData('existingLayers', collection.contractAddress)
    updateFormData('existingLayersId', collection.id)
    updateFormData('existingLayersName', collection.name)
    setIsOpen(false)
  }

  // Find already selected collection
  useEffect(() => {
    if (formData.existingLayers && collections.length > 0) {
      const found = collections.find(c => c.contractAddress === formData.existingLayers)
      if (found) {
        setSelectedCollection(found)
      }
    }
  }, [formData.existingLayers, collections])

  if (loading) {
    return (
      <div className="bg-background-secondary rounded-xl border border-border p-6 mb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Select Layers</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-background-tertiary rounded w-1/4"></div>
          <div className="h-12 bg-background-tertiary rounded"></div>
          <div className="h-4 bg-background-tertiary rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  if (collections.length === 0) {
    return (
      <div className="bg-background-secondary rounded-xl border border-border p-6 mb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Select Layers</h3>
        <div className="text-center py-8">
          <Layers className="w-12 h-12 text-text-secondary mx-auto mb-4" />
          <h4 className="text-text-primary font-medium mb-2">No Layerss Found</h4>
          <p className="text-text-secondary text-sm mb-4">
            You need to create a collection first before adding tokens to it.
          </p>
          <button
            onClick={() => window.location.href = '/create'}
            className="btn-primary"
          >
            Create New Layers
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background-secondary rounded-xl border border-border p-6 mb-6">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Select Layers</h3>
      <p className="text-text-secondary text-sm mb-4">
        Choose which collection to add this NFT token to. Only collections you've created are shown.
      </p>

      {/* Layers Selector */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-background-tertiary border border-border rounded-lg px-4 py-3 text-left text-text-primary focus:outline-none focus:border-purple-primary transition-colors flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            {selectedCollection ? (
              <>
                <div className="w-8 h-8 rounded-full bg-purple-primary/10 flex items-center justify-center">
                  {selectedCollection.isPersonal ? (
                    <User className="w-4 h-4 text-purple-primary" />
                  ) : (
                    <Layers className="w-4 h-4 text-purple-primary" />
                  )}
                </div>
                <div>
                  <div className="font-medium">{selectedCollection.name}</div>
                  <div className="text-text-secondary text-xs">
                    {selectedCollection.symbol} " {selectedCollection._count?.nftTokens || 0} tokens
                  </div>
                </div>
              </>
            ) : (
              <span className="text-text-secondary">Select a collection...</span>
            )}
          </div>
          <ChevronDown 
            size={16} 
            className={`text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background-tertiary border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search collections..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background-primary border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-purple-primary transition-colors"
                />
              </div>
            </div>

            {/* Layers List */}
            <div className="max-h-60 overflow-y-auto">
              {filteredLayerss.length === 0 ? (
                <div className="p-4 text-center text-text-secondary">
                  No collections found matching "{searchTerm}"
                </div>
              ) : (
                filteredLayerss.map((collection) => (
                  <button
                    key={collection.id}
                    type="button"
                    onClick={() => handleSelectLayers(collection)}
                    className="w-full p-4 text-left hover:bg-background-primary transition-colors flex items-center space-x-3 border-b border-border last:border-b-0"
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-primary/10 flex items-center justify-center flex-shrink-0">
                      {collection.isPersonal ? (
                        <User className="w-5 h-5 text-purple-primary" />
                      ) : (
                        <Layers className="w-5 h-5 text-purple-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-text-primary truncate">
                          {collection.name}
                        </h4>
                        <span className="text-xs text-text-secondary ml-2">
                          {collection.isPersonal ? 'Personal' : 'Layers'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-text-secondary">
                        <span>{collection.symbol}</span>
                        <span>{collection._count?.nftTokens || 0} tokens</span>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(collection.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {collection.description && (
                        <p className="text-xs text-text-secondary mt-1 truncate">
                          {collection.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selected Layers Info */}
      {selectedCollection && (
        <div className="mt-4 p-4 bg-background-tertiary rounded-lg border border-border">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-purple-primary/10 flex items-center justify-center">
              {selectedCollection.isPersonal ? (
                <User className="w-5 h-5 text-purple-primary" />
              ) : (
                <Layers className="w-5 h-5 text-purple-primary" />
              )}
            </div>
            <div>
              <h4 className="font-medium text-text-primary">{selectedCollection.name}</h4>
              <p className="text-text-secondary text-sm">
                {selectedCollection.symbol} " {selectedCollection._count?.nftTokens || 0} tokens
              </p>
            </div>
          </div>
          
          {selectedCollection.description && (
            <p className="text-text-secondary text-sm mb-3">
              {selectedCollection.description}
            </p>
          )}
          
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-text-secondary">Contract:</span>
              <p className="text-text-primary font-mono">
                {selectedCollection.contractAddress.slice(0, 6)}...{selectedCollection.contractAddress.slice(-4)}
              </p>
            </div>
            <div>
              <span className="text-text-secondary">Chain:</span>
              <p className="text-text-primary">
                {selectedCollection.chainId === 8453 ? 'Base' : 
                 selectedCollection.chainId === 7777777 ? 'Zora' : 
                 `Chain ${selectedCollection.chainId}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Validation Message */}
      {!selectedCollection && (
        <p className="text-orange-400 text-xs mt-2 flex items-center gap-1">
          <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
          Please select a collection to continue
        </p>
      )}
    </div>
  )
}