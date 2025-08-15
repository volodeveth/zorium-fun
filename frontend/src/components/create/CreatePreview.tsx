import React, { useState, useEffect } from 'react'
import { Zap, Clock, DollarSign, CheckCircle, AlertCircle } from 'lucide-react'
import { getNetworkConfig, getSupportedChainIds, CONTRACT_CONSTANTS } from '@/lib/web3/contracts'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { useFactoryContract } from '@/hooks/useFactoryContract'
import { useCollectionContract } from '@/hooks/useCollectionContract'
import { useAccount, useSwitchChain } from 'wagmi'
import { parseEther, Address } from 'viem'

type CreationType = 'collection' | 'personal' | 'token'

interface CreatePreviewProps {
  formData: any
  onBack: () => void
  creationType: CreationType
}

export default function CreatePreview({ formData, onBack, creationType }: CreatePreviewProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>('')
  const [metadataURI, setMetadataURI] = useState<string>('')
  const [metadataResponse, setMetadataResponse] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  
  const { address } = useAuth()
  const { chain } = useAccount()
  const { switchChain } = useSwitchChain()
  const factoryContract = useFactoryContract()
  const collectionContract = useCollectionContract(formData.existingCollection as Address)
  
  // Get network info
  const selectedNetwork = getNetworkConfig(formData.networkId)
  
  // Determine price and fee structure
  const finalPrice = formData.price || (BigInt(CONTRACT_CONSTANTS.DEFAULT_MINT_PRICE) / BigInt(10**18)).toString()
  const isDefaultPrice = !formData.price || formData.price === '' || formData.price === (BigInt(CONTRACT_CONSTANTS.DEFAULT_MINT_PRICE) / BigInt(10**18)).toString()

  const handleCreateNFT = async () => {
    if (!address || !formData.file) {
      setError('Please connect your wallet and upload a file first')
      return
    }

    setIsCreating(true)
    setError('')
    setSuccess('')
    
    try {
      // Check if user is on correct network
      if (chain?.id !== formData.networkId) {
        setUploadProgress('Switching network...')
        await switchChain({ chainId: formData.networkId })
      }
      
      // Step 1: Create NFT metadata with IPFS
      setUploadProgress('Uploading to IPFS...')
      
      const attributes = formData.tags.map((tag: string) => ({
        trait_type: 'Tag',
        value: tag
      }))
      
      // Add collection info if it's a token being added to existing collection
      if (creationType === 'token' && formData.existingCollectionName) {
        attributes.push({
          trait_type: 'Collection',
          value: formData.existingCollectionName
        })
      }
      
      console.log('📤 Uploading NFT metadata:', {
        name: formData.title,
        description: formData.description || '',
        hasImageFile: !!formData.filePreview,
        imageFileLength: formData.filePreview?.length,
        creatorAddress: address,
        attributesCount: attributes.length,
        attributes,
        collection: formData.existingCollectionName || formData.collectionName,
        external_url: `${window.location.origin}/nft/new`
      })
      
      console.log('🌐 API URL being used:', typeof window !== 'undefined' && 'API_BASE_URL' in window ? window.API_BASE_URL : 'Not available')

      const metadataResponse = await api.upload.nftMetadata({
        name: formData.title,
        description: formData.description || '',
        imageFile: formData.filePreview || '',
        creatorAddress: address,
        attributes,
        collection: formData.existingCollectionName || formData.collectionName,
        external_url: `${window.location.origin}/nft/new`
      })
      
      console.log('📥 Metadata upload response:', {
        status: metadataResponse.status,
        statusText: metadataResponse.statusText,
        ok: metadataResponse.ok,
        url: metadataResponse.url
      })
      
      if (!metadataResponse.ok) {
        const errorText = await metadataResponse.text()
        console.error('❌ Metadata upload failed:', {
          status: metadataResponse.status,
          statusText: metadataResponse.statusText,
          errorText,
          url: metadataResponse.url
        })
        
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText || 'Failed to upload metadata to IPFS' }
        }
        
        const errorMsg = errorData.error || errorData.message || errorText || 'Unknown error'
        throw new Error(`Upload failed (${metadataResponse.status}): ${errorMsg}`)
      }
      
      const metadataData = await metadataResponse.json()
      console.log('Received metadata data:', metadataData)
      
      // Extract the correct IPFS URI
      let tokenURI = metadataData.metadata?.metadataURI || 
                    metadataData.metadataURI || 
                    metadataData.metadata?.metadataUrl ||
                    metadataData.metadataUrl
      
      // Proper IPFS URI handling
      if (tokenURI) {
        if (tokenURI.startsWith('ipfs://')) {
          tokenURI = tokenURI
        } else if (tokenURI.startsWith('Qm') || tokenURI.startsWith('baf')) {
          tokenURI = `ipfs://${tokenURI}`
        } else {
          const hashMatch = tokenURI.match(/(?:ipfs\/|\/ipfs\/)([Qm][1-9A-HJ-NP-Z]{44,}|b[a-z2-7]{58,})/i)
          if (hashMatch) {
            tokenURI = `ipfs://${hashMatch[1]}`
          } else {
            throw new Error('Invalid IPFS URI format received from metadata service')
          }
        }
      }
      
      if (!tokenURI) {
        throw new Error('No valid IPFS URI received from metadata upload')
      }
      
      console.log('✅ Final IPFS URI:', tokenURI)
      setMetadataURI(tokenURI)
      setMetadataResponse(metadataData)
      
      // Step 2: Create NFT based on type
      if (creationType === 'collection') {
        // Create new collection with first NFT
        setUploadProgress('Creating collection contract...')
        
        const result = await factoryContract.createCollection({
          name: formData.collectionName,
          symbol: formData.collectionSymbol,
          baseURI: '',
          isPersonal: false
        })
        
        if (result) {
          setSuccess(`Collection "${formData.collectionName}" created successfully!`)
          // Save to database via API
          await api.collections.create({
            name: formData.collectionName,
            symbol: formData.collectionSymbol,
            description: formData.collectionDescription,
            chainId: formData.networkId,
            isPersonal: false
          })
        }
        
      } else if (creationType === 'personal') {
        // Create personal collection
        setUploadProgress('Creating personal NFT...')
        
        const result = await factoryContract.createPersonalCollection(
          formData.title,
          tokenURI
        )
        
        if (result) {
          setSuccess(`Personal NFT "${formData.title}" created successfully!`)
          // Save to database via API
          await api.collections.createPersonal({
            nftName: formData.title,
            tokenURI,
            chainId: formData.networkId,
            customPrice: formData.price,
            mintEndTime: formData.mintEndTime ? parseInt(formData.mintEndTime) : undefined
          })
        }
        
      } else if (creationType === 'token') {
        // Add token to existing collection
        setUploadProgress('Adding token to collection...')
        
        if (!formData.existingCollection) {
          throw new Error('No collection selected')
        }
        
        const tokenId = await collectionContract.createTokenSimple(
          tokenURI,
          formData.isCustomPrice ? parseEther(formData.price || '0') : BigInt(0),
          formData.mintEndTime ? BigInt(Date.now() / 1000 + parseInt(formData.mintEndTime)) : BigInt(0)
        )
        
        if (tokenId) {
          setSuccess(`Token "${formData.title}" added to collection successfully!`)
          // Save to database via API
          await api.nfts.createToken(formData.existingCollection, {
            tokenURI,
            customPrice: formData.price,
            mintEndTime: formData.mintEndTime ? parseInt(formData.mintEndTime) : undefined
          })
        }
      }
      
      setUploadProgress('')
      
      // Redirect after success
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 3000)
      
    } catch (error) {
      console.error('NFT creation error:', error)
      setError(`Failed to create NFT: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setUploadProgress('')
    } finally {
      setIsCreating(false)
    }
  }
  

  return (
    <div className="bg-background-secondary rounded-xl border border-border p-8">
      <h2 className="text-2xl font-bold text-text-primary mb-6">
        {creationType === 'collection' ? 'Preview Collection & First NFT' :
         creationType === 'personal' ? 'Preview Personal NFT' :
         'Preview New Token'}
      </h2>
      
      {/* Status Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
          <AlertCircle className="text-red-500" size={20} />
          <span className="text-red-400">{error}</span>
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3">
          <CheckCircle className="text-green-500" size={20} />
          <span className="text-green-400">{success}</span>
        </div>
      )}
      
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
                  {creationType === 'collection' ? 'Token #1' :
                   creationType === 'personal' ? 'Token #1' :
                   'New Token'}
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
          
          {/* Smart Contract Info */}
          <div className="bg-background-tertiary rounded-lg p-4">
            <h4 className="text-text-primary font-semibold mb-2">Contract Details</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Network:</span>
                <span className="text-text-primary">{selectedNetwork.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Type:</span>
                <span className="text-text-primary">
                  {creationType === 'collection' ? 'New Collection (ERC-1155)' :
                   creationType === 'personal' ? 'Personal NFT (ERC-1155)' :
                   'Add to Existing Collection'}
                </span>
              </div>
              {creationType === 'token' && formData.existingCollection && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Collection:</span>
                  <span className="text-text-primary font-mono text-xs">
                    {formData.existingCollection.slice(0, 6)}...{formData.existingCollection.slice(-4)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-text-secondary">Creator Mint:</span>
                <span className="text-green-400">
                  FREE (Gas Only)
                </span>
              </div>
              {metadataURI && (
                <div className="mt-2">
                  <span className="text-text-secondary text-xs">IPFS Metadata:</span>
                  <div className="text-green-400 font-mono text-xs break-all">
                    {metadataURI}
                  </div>
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
              
              {creationType === 'collection' && (
                <div>
                  <span className="text-text-secondary text-sm">Collection Name:</span>
                  <p className="text-text-primary font-medium">{formData.collectionName}</p>
                </div>
              )}
              
              {creationType === 'collection' && (
                <div>
                  <span className="text-text-secondary text-sm">Collection Symbol:</span>
                  <p className="text-text-primary font-medium">{formData.collectionSymbol}</p>
                </div>
              )}
              
              {creationType === 'token' && formData.existingCollectionName && (
                <div>
                  <span className="text-text-secondary text-sm">Adding to Collection:</span>
                  <p className="text-text-primary font-medium">{formData.existingCollectionName}</p>
                </div>
              )}
              
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
                <span className="text-text-secondary">Creation Cost:</span>
                <span className="text-text-primary font-medium">
                  Gas Only
                  <span className="text-green-400 ml-2">(FREE for Creator!)</span>
                </span>
              </div>
              
              <div className="mt-3 p-3 bg-background-primary rounded border">
                <h5 className="text-text-primary text-sm font-medium mb-2">Future Mint Fees:</h5>
                <div className="space-y-1 text-xs">
                  {formData.isCustomPrice ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Creator:</span>
                        <span className="text-green-500">95%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Platform:</span>
                        <span className="text-text-secondary">5%</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Creator:</span>
                        <span className="text-green-500">50%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">First Minter:</span>
                        <span className="text-blue-400">10%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Platform:</span>
                        <span className="text-text-secondary">40%</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
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
                <span className="text-text-secondary">Network Estimate:</span>
                <span className="text-text-primary">Low Fee (~$0.01)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Gas Estimation:</span>
                <span className="text-green-400">Automatic (Network Optimized)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Network:</span>
                <span className="text-text-primary">{selectedNetwork.name}</span>
              </div>
              <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-green-400 text-xs">
                  ✅ Automatic gas estimation ensures optimal cost based on network conditions.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <button
              onClick={onBack}
              className="btn-secondary"
              disabled={isCreating}
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
                  {uploadProgress || 'Creating...'}
                </>
              ) : (
                creationType === 'collection' ? 'Create Collection' :
                creationType === 'personal' ? 'Create Personal NFT' :
                'Add Token to Collection'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}