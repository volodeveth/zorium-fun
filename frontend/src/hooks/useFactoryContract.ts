import { useState, useCallback } from 'react'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import { parseEther, formatEther, Address } from 'viem'
import { toast } from 'react-hot-toast'

import { 
  getFactoryAddress, 
  getNetworkConfig,
  FACTORY_ABI,
  CONTRACT_CONSTANTS,
  CreateCollectionParams,
  CollectionInfo,
  TokenStatus
} from '@/lib/web3/contracts'

interface UseFactoryContractReturn {
  // State
  isLoading: boolean
  error: string | null
  
  // Factory functions
  createCollection: (params: CreateCollectionParams) => Promise<Address | null>
  createPersonalCollection: (nftName: string, tokenURI: string) => Promise<{ collection: Address; tokenId: bigint } | null>
  getCollectionsByCreator: (creator: Address) => Promise<Address[]>
  getCollectionInfo: (collection: Address) => Promise<CollectionInfo | null>
  getTotalCollections: () => Promise<number>
  isValidCollection: (collection: Address) => Promise<boolean>
  
  // Fee calculation
  calculateMintFees: (price: bigint, hasReferrer: boolean, isCustomPrice: boolean) => Promise<{
    creatorFee: bigint
    firstMinterFee: bigint
    referralFee: bigint
    platformFee: bigint
  } | null>
  
  // Constants
  getDefaultMintPrice: () => Promise<bigint | null>
  getTriggerSupply: () => Promise<number>
  getFinalCountdownDuration: () => Promise<number>
}

export function useFactoryContract(chainId?: number): UseFactoryContractReturn {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Get current chain ID (fallback to default)
  const currentChainId = chainId || publicClient?.chain?.id || 8453
  
  // Helper to get factory address and validate network
  const getFactoryConfig = useCallback(() => {
    try {
      const networkConfig = getNetworkConfig(currentChainId)
      return {
        factoryAddress: networkConfig.factory.proxy as Address,
        networkConfig
      }
    } catch (err) {
      setError(`Unsupported network: ${currentChainId}`)
      return null
    }
  }, [currentChainId])
  
  // Create a new collection via factory
  const createCollection = useCallback(async (params: CreateCollectionParams): Promise<Address | null> => {
    if (!walletClient || !address) {
      setError('Wallet not connected')
      return null
    }
    
    const config = getFactoryConfig()
    if (!config) return null
    
    setIsLoading(true)
    setError(null)
    
    try {
      const { factoryAddress } = config
      
      // Prepare parameters tuple
      const collectionParams = [
        params.name,
        params.symbol,
        params.baseURI,
        params.isPersonal
      ] as const
      
      // Estimate gas
      const gas = await publicClient?.estimateContractGas({
        address: factoryAddress,
        abi: FACTORY_ABI,
        functionName: 'createCollection',
        args: [collectionParams],
        account: address
      })
      
      // Execute transaction
      const hash = await walletClient.writeContract({
        address: factoryAddress,
        abi: FACTORY_ABI,
        functionName: 'createCollection',
        args: [collectionParams],
        gas,
        account: address
      })
      
      toast.success('Collection creation transaction sent!')
      
      // Wait for transaction confirmation
      const receipt = await publicClient?.waitForTransactionReceipt({ hash })
      
      if (receipt?.status === 'success') {
        // Parse logs to get collection address
        const logs = receipt.logs
        const collectionCreatedLog = logs.find(log => 
          log.topics[0] === '0x...' // CollectionCreated event signature
        )
        
        if (collectionCreatedLog && collectionCreatedLog.topics[1]) {
          const collectionAddress = `0x${collectionCreatedLog.topics[1].slice(26)}` as Address
          toast.success('Collection created successfully!')
          return collectionAddress
        }
      }
      
      throw new Error('Failed to parse collection address from transaction receipt')
      
    } catch (err: any) {
      console.error('Create collection failed:', err)
      const errorMessage = err.message || 'Failed to create collection'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, address, publicClient, getFactoryConfig])
  
  // Create a personal collection with first NFT
  const createPersonalCollection = useCallback(async (
    nftName: string, 
    tokenURI: string
  ): Promise<{ collection: Address; tokenId: bigint } | null> => {
    if (!walletClient || !address) {
      setError('Wallet not connected')
      return null
    }
    
    const config = getFactoryConfig()
    if (!config) return null
    
    setIsLoading(true)
    setError(null)
    
    try {
      const { factoryAddress } = config
      
      // Estimate gas
      const gas = await publicClient?.estimateContractGas({
        address: factoryAddress,
        abi: FACTORY_ABI,
        functionName: 'createPersonalCollection',
        args: [nftName, tokenURI],
        account: address
      })
      
      // Execute transaction
      const hash = await walletClient.writeContract({
        address: factoryAddress,
        abi: FACTORY_ABI,
        functionName: 'createPersonalCollection',
        args: [nftName, tokenURI],
        gas,
        account: address
      })
      
      toast.success('Personal collection creation transaction sent!')
      
      // Wait for transaction confirmation
      const receipt = await publicClient?.waitForTransactionReceipt({ hash })
      
      if (receipt?.status === 'success') {
        // Parse logs to get collection address and token ID
        const logs = receipt.logs
        const personalCollectionLog = logs.find(log => 
          log.topics[0] === '0x...' // PersonalCollectionCreated event signature
        )
        
        if (personalCollectionLog && personalCollectionLog.topics[1]) {
          const collectionAddress = `0x${personalCollectionLog.topics[1].slice(26)}` as Address
          // Token ID would be in the log data
          const tokenId = BigInt(1) // First token is always ID 1
          
          toast.success('Personal collection created successfully!')
          return { collection: collectionAddress, tokenId }
        }
      }
      
      throw new Error('Failed to parse collection data from transaction receipt')
      
    } catch (err: any) {
      console.error('Create personal collection failed:', err)
      const errorMessage = err.message || 'Failed to create personal collection'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, address, publicClient, getFactoryConfig])
  
  // Get collections created by a specific address
  const getCollectionsByCreator = useCallback(async (creator: Address): Promise<Address[]> => {
    const config = getFactoryConfig()
    if (!config || !publicClient) return []
    
    try {
      const { factoryAddress } = config
      
      const result = await publicClient.readContract({
        address: factoryAddress,
        abi: FACTORY_ABI,
        functionName: 'getCollectionsByCreator',
        args: [creator]
      })
      
      return result as Address[]
    } catch (err: any) {
      console.error('Get collections by creator failed:', err)
      setError(err.message || 'Failed to get collections')
      return []
    }
  }, [publicClient, getFactoryConfig])
  
  // Get collection information
  const getCollectionInfo = useCallback(async (collection: Address): Promise<CollectionInfo | null> => {
    const config = getFactoryConfig()
    if (!config || !publicClient) return null
    
    try {
      const { factoryAddress } = config
      
      const result = await publicClient.readContract({
        address: factoryAddress,
        abi: FACTORY_ABI,
        functionName: 'getCollectionInfo',
        args: [collection]
      })
      
      const [creator, name, symbol, isPersonal, createdAt, totalTokens] = result as [string, string, string, boolean, bigint, bigint]
      
      return {
        creator,
        name,
        symbol,
        isPersonal,
        createdAt: Number(createdAt),
        totalTokens: Number(totalTokens)
      }
    } catch (err: any) {
      console.error('Get collection info failed:', err)
      setError(err.message || 'Failed to get collection info')
      return null
    }
  }, [publicClient, getFactoryConfig])
  
  // Get total number of collections
  const getTotalCollections = useCallback(async (): Promise<number> => {
    const config = getFactoryConfig()
    if (!config || !publicClient) return 0
    
    try {
      const { factoryAddress } = config
      
      const result = await publicClient.readContract({
        address: factoryAddress,
        abi: FACTORY_ABI,
        functionName: 'totalCollections'
      })
      
      return Number(result)
    } catch (err: any) {
      console.error('Get total collections failed:', err)
      return 0
    }
  }, [publicClient, getFactoryConfig])
  
  // Check if address is a valid collection
  const isValidCollection = useCallback(async (collection: Address): Promise<boolean> => {
    const config = getFactoryConfig()
    if (!config || !publicClient) return false
    
    try {
      const { factoryAddress } = config
      
      const result = await publicClient.readContract({
        address: factoryAddress,
        abi: FACTORY_ABI,
        functionName: 'isValidCollection',
        args: [collection]
      })
      
      return result as boolean
    } catch (err: any) {
      console.error('Is valid collection check failed:', err)
      return false
    }
  }, [publicClient, getFactoryConfig])
  
  // Calculate mint fees
  const calculateMintFees = useCallback(async (
    price: bigint, 
    hasReferrer: boolean, 
    isCustomPrice: boolean
  ): Promise<{
    creatorFee: bigint
    firstMinterFee: bigint
    referralFee: bigint
    platformFee: bigint
  } | null> => {
    const config = getFactoryConfig()
    if (!config || !publicClient) return null
    
    try {
      const { factoryAddress } = config
      
      const result = await publicClient.readContract({
        address: factoryAddress,
        abi: FACTORY_ABI,
        functionName: 'calculateMintFees',
        args: [price, hasReferrer, isCustomPrice]
      })
      
      const [creatorFee, firstMinterFee, referralFee, platformFee] = result as [bigint, bigint, bigint, bigint]
      
      return {
        creatorFee,
        firstMinterFee,
        referralFee,
        platformFee
      }
    } catch (err: any) {
      console.error('Calculate mint fees failed:', err)
      setError(err.message || 'Failed to calculate fees')
      return null
    }
  }, [publicClient, getFactoryConfig])
  
  // Get default mint price
  const getDefaultMintPrice = useCallback(async (): Promise<bigint | null> => {
    const config = getFactoryConfig()
    if (!config || !publicClient) return null
    
    try {
      const { factoryAddress } = config
      
      const result = await publicClient.readContract({
        address: factoryAddress,
        abi: FACTORY_ABI,
        functionName: 'DEFAULT_MINT_PRICE'
      })
      
      return result as bigint
    } catch (err: any) {
      console.error('Get default mint price failed:', err)
      return BigInt(CONTRACT_CONSTANTS.DEFAULT_MINT_PRICE)
    }
  }, [publicClient, getFactoryConfig])
  
  // Get trigger supply constant
  const getTriggerSupply = useCallback(async (): Promise<number> => {
    const config = getFactoryConfig()
    if (!config || !publicClient) return CONTRACT_CONSTANTS.TRIGGER_SUPPLY
    
    try {
      const { factoryAddress } = config
      
      const result = await publicClient.readContract({
        address: factoryAddress,
        abi: FACTORY_ABI,
        functionName: 'TRIGGER_SUPPLY'
      })
      
      return Number(result)
    } catch (err: any) {
      console.error('Get trigger supply failed:', err)
      return CONTRACT_CONSTANTS.TRIGGER_SUPPLY
    }
  }, [publicClient, getFactoryConfig])
  
  // Get final countdown duration
  const getFinalCountdownDuration = useCallback(async (): Promise<number> => {
    const config = getFactoryConfig()
    if (!config || !publicClient) return CONTRACT_CONSTANTS.FINAL_COUNTDOWN_DURATION
    
    try {
      const { factoryAddress } = config
      
      const result = await publicClient.readContract({
        address: factoryAddress,
        abi: FACTORY_ABI,
        functionName: 'FINAL_COUNTDOWN_DURATION'
      })
      
      return Number(result)
    } catch (err: any) {
      console.error('Get final countdown duration failed:', err)
      return CONTRACT_CONSTANTS.FINAL_COUNTDOWN_DURATION
    }
  }, [publicClient, getFactoryConfig])
  
  return {
    isLoading,
    error,
    createCollection,
    createPersonalCollection,
    getCollectionsByCreator,
    getCollectionInfo,
    getTotalCollections,
    isValidCollection,
    calculateMintFees,
    getDefaultMintPrice,
    getTriggerSupply,
    getFinalCountdownDuration
  }
}