import { useState, useCallback } from 'react'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import { parseEther, formatEther, Address } from 'viem'
import { toast } from 'react-hot-toast'

import { 
  COLLECTION_ABI,
  CreateTokenParams,
  MintParams,
  TokenInfo,
  TokenStatus
} from '@/lib/web3/contracts'

interface UseCollectionContractReturn {
  // State
  isLoading: boolean
  error: string | null
  
  // Collection info
  getCollectionName: () => Promise<string | null>
  getCollectionSymbol: () => Promise<string | null>
  getCollectionCreator: () => Promise<Address | null>
  
  // Token management
  createToken: (params: CreateTokenParams) => Promise<bigint | null>
  createTokenSimple: (tokenURI: string, customPrice: bigint, mintEndTime: bigint) => Promise<bigint | null>
  mint: (params: MintParams, value: bigint) => Promise<boolean>
  
  // Token info
  getTokenInfo: (tokenId: bigint) => Promise<TokenInfo | null>
  isMintingActive: (tokenId: bigint) => Promise<boolean>
  getCountdownTimeLeft: (tokenId: bigint) => Promise<number>
  
  // ERC-1155 functions
  balanceOf: (owner: Address, tokenId: bigint) => Promise<bigint>
  totalSupply: (tokenId: bigint) => Promise<bigint>
  uri: (tokenId: bigint) => Promise<string | null>
  
  // Marketplace
  listForSale: (tokenId: bigint, amount: bigint, pricePerToken: bigint) => Promise<boolean>
  buyNFT: (listingId: bigint, amount: bigint, value: bigint) => Promise<boolean>
  delistNFT: (listingId: bigint) => Promise<boolean>
  
  // Fee management
  getAccumulatedFees: (address: Address) => Promise<bigint>
  withdrawFees: () => Promise<boolean>
}

export function useCollectionContract(collectionAddress?: Address): UseCollectionContractReturn {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Helper to validate collection address
  const validateCollectionAddress = useCallback(() => {
    if (!collectionAddress) {
      setError('Collection address not provided')
      return false
    }
    return true
  }, [collectionAddress])
  
  // Get collection name
  const getCollectionName = useCallback(async (): Promise<string | null> => {
    if (!validateCollectionAddress() || !publicClient) return null
    
    try {
      const result = await publicClient.readContract({
        address: collectionAddress!,
        abi: COLLECTION_ABI,
        functionName: 'name'
      })
      
      return result as string
    } catch (err: any) {
      console.error('Get collection name failed:', err)
      setError(err.message || 'Failed to get collection name')
      return null
    }
  }, [publicClient, collectionAddress, validateCollectionAddress])
  
  // Get collection symbol
  const getCollectionSymbol = useCallback(async (): Promise<string | null> => {
    if (!validateCollectionAddress() || !publicClient) return null
    
    try {
      const result = await publicClient.readContract({
        address: collectionAddress!,
        abi: COLLECTION_ABI,
        functionName: 'symbol'
      })
      
      return result as string
    } catch (err: any) {
      console.error('Get collection symbol failed:', err)
      setError(err.message || 'Failed to get collection symbol')
      return null
    }
  }, [publicClient, collectionAddress, validateCollectionAddress])
  
  // Get collection creator
  const getCollectionCreator = useCallback(async (): Promise<Address | null> => {
    if (!validateCollectionAddress() || !publicClient) return null
    
    try {
      const result = await publicClient.readContract({
        address: collectionAddress!,
        abi: COLLECTION_ABI,
        functionName: 'creator'
      })
      
      return result as Address
    } catch (err: any) {
      console.error('Get collection creator failed:', err)
      setError(err.message || 'Failed to get collection creator')
      return null
    }
  }, [publicClient, collectionAddress, validateCollectionAddress])
  
  // Create a new token (complex parameters)
  const createToken = useCallback(async (params: CreateTokenParams): Promise<bigint | null> => {
    if (!walletClient || !address || !validateCollectionAddress()) return null
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Prepare parameters tuple
      const tokenParams = [
        params.tokenURI,
        BigInt(params.customPrice),
        BigInt(params.mintEndTime)
      ] as const
      
      // Estimate gas
      const gas = await publicClient?.estimateContractGas({
        address: collectionAddress!,
        abi: COLLECTION_ABI,
        functionName: 'createToken',
        args: [tokenParams],
        account: address
      })
      
      // Execute transaction
      const hash = await walletClient.writeContract({
        address: collectionAddress!,
        abi: COLLECTION_ABI,
        functionName: 'createToken',
        args: [tokenParams],
        gas,
        account: address
      })
      
      toast.success('Token creation transaction sent!')
      
      // Wait for transaction confirmation
      const receipt = await publicClient?.waitForTransactionReceipt({ hash })
      
      if (receipt?.status === 'success') {
        // Parse logs to get token ID
        const logs = receipt.logs
        const tokenCreatedLog = logs.find(log => 
          log.topics[0] === '0x...' // TokenCreated event signature
        )
        
        if (tokenCreatedLog) {
          // Token ID would be in the first indexed parameter
          const tokenId = BigInt(tokenCreatedLog.topics[1] || '0')
          toast.success('Token created successfully!')
          return tokenId
        }
      }
      
      throw new Error('Failed to parse token ID from transaction receipt')
      
    } catch (err: any) {
      console.error('Create token failed:', err)
      const errorMessage = err.message || 'Failed to create token'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, address, publicClient, collectionAddress, validateCollectionAddress])
  
  // Create token with simple parameters
  const createTokenSimple = useCallback(async (
    tokenURI: string, 
    customPrice: bigint, 
    mintEndTime: bigint
  ): Promise<bigint | null> => {
    if (!walletClient || !address || !validateCollectionAddress()) return null
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Estimate gas
      const gas = await publicClient?.estimateContractGas({
        address: collectionAddress!,
        abi: COLLECTION_ABI,
        functionName: 'createTokenSimple',
        args: [tokenURI, customPrice, mintEndTime],
        account: address
      })
      
      // Execute transaction
      const hash = await walletClient.writeContract({
        address: collectionAddress!,
        abi: COLLECTION_ABI,
        functionName: 'createTokenSimple',
        args: [tokenURI, customPrice, mintEndTime],
        gas,
        account: address
      })
      
      toast.success('Token creation transaction sent!')
      
      // Wait for transaction confirmation
      const receipt = await publicClient?.waitForTransactionReceipt({ hash })
      
      if (receipt?.status === 'success') {
        toast.success('Token created successfully!')
        // Return next expected token ID (since we can't easily parse from logs)
        return BigInt(1) // This would typically be determined by calling a view function
      }
      
      throw new Error('Transaction failed')
      
    } catch (err: any) {
      console.error('Create token simple failed:', err)
      const errorMessage = err.message || 'Failed to create token'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, address, publicClient, collectionAddress, validateCollectionAddress])
  
  // Mint tokens
  const mint = useCallback(async (params: MintParams, value: bigint): Promise<boolean> => {
    if (!walletClient || !address || !validateCollectionAddress()) return false
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Prepare mint parameters tuple
      const mintParams = [
        params.to as Address,
        BigInt(params.tokenId),
        BigInt(params.amount),
        params.referrer as Address
      ] as const
      
      // Estimate gas
      const gas = await publicClient?.estimateContractGas({
        address: collectionAddress!,
        abi: COLLECTION_ABI,
        functionName: 'mint',
        args: [mintParams],
        value,
        account: address
      })
      
      // Execute transaction
      const hash = await walletClient.writeContract({
        address: collectionAddress!,
        abi: COLLECTION_ABI,
        functionName: 'mint',
        args: [mintParams],
        value,
        gas,
        account: address
      })
      
      toast.success('Mint transaction sent!')
      
      // Wait for transaction confirmation
      const receipt = await publicClient?.waitForTransactionReceipt({ hash })
      
      if (receipt?.status === 'success') {
        toast.success('NFT minted successfully!')
        return true
      }
      
      throw new Error('Transaction failed')
      
    } catch (err: any) {
      console.error('Mint failed:', err)
      const errorMessage = err.message || 'Failed to mint NFT'
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, address, publicClient, collectionAddress, validateCollectionAddress])
  
  // Get token information
  const getTokenInfo = useCallback(async (tokenId: bigint): Promise<TokenInfo | null> => {
    if (!validateCollectionAddress() || !publicClient) return null
    
    try {
      const result = await publicClient.readContract({
        address: collectionAddress!,
        abi: COLLECTION_ABI,
        functionName: 'getTokenInfo',
        args: [tokenId]
      })
      
      const [
        creator,
        firstMinter,
        mintPrice,
        isCustomPrice,
        mintEndTime,
        totalMinted,
        finalCountdownStart,
        status,
        referrer,
        tokenURI
      ] = result as [string, string, bigint, boolean, bigint, bigint, bigint, number, string, string]
      
      return {
        creator,
        firstMinter,
        mintPrice: mintPrice.toString(),
        isCustomPrice,
        mintEndTime: Number(mintEndTime),
        totalMinted: Number(totalMinted),
        finalCountdownStart: Number(finalCountdownStart),
        status: status as TokenStatus,
        referrer,
        tokenURI
      }
    } catch (err: any) {
      console.error('Get token info failed:', err)
      setError(err.message || 'Failed to get token info')
      return null
    }
  }, [publicClient, collectionAddress, validateCollectionAddress])
  
  // Check if minting is active for token
  const isMintingActive = useCallback(async (tokenId: bigint): Promise<boolean> => {
    if (!validateCollectionAddress() || !publicClient) return false
    
    try {
      const result = await publicClient.readContract({
        address: collectionAddress!,
        abi: COLLECTION_ABI,
        functionName: 'isMintingActive',
        args: [tokenId]
      })
      
      return result as boolean
    } catch (err: any) {
      console.error('Is minting active check failed:', err)
      return false
    }
  }, [publicClient, collectionAddress, validateCollectionAddress])
  
  // Get countdown time left
  const getCountdownTimeLeft = useCallback(async (tokenId: bigint): Promise<number> => {
    if (!validateCollectionAddress() || !publicClient) return 0
    
    try {
      const result = await publicClient.readContract({
        address: collectionAddress!,
        abi: COLLECTION_ABI,
        functionName: 'getCountdownTimeLeft',
        args: [tokenId]
      })
      
      return Number(result)
    } catch (err: any) {
      console.error('Get countdown time left failed:', err)
      return 0
    }
  }, [publicClient, collectionAddress, validateCollectionAddress])
  
  // Get balance of address for token
  const balanceOf = useCallback(async (owner: Address, tokenId: bigint): Promise<bigint> => {
    if (!validateCollectionAddress() || !publicClient) return BigInt(0)
    
    try {
      const result = await publicClient.readContract({
        address: collectionAddress!,
        abi: COLLECTION_ABI,
        functionName: 'balanceOf',
        args: [owner, tokenId]
      })
      
      return result as bigint
    } catch (err: any) {
      console.error('Balance of failed:', err)
      return BigInt(0)
    }
  }, [publicClient, collectionAddress, validateCollectionAddress])
  
  // Get total supply of token
  const totalSupply = useCallback(async (tokenId: bigint): Promise<bigint> => {
    if (!validateCollectionAddress() || !publicClient) return BigInt(0)
    
    try {
      const result = await publicClient.readContract({
        address: collectionAddress!,
        abi: COLLECTION_ABI,
        functionName: 'totalSupply',
        args: [tokenId]
      })
      
      return result as bigint
    } catch (err: any) {
      console.error('Total supply failed:', err)
      return BigInt(0)
    }
  }, [publicClient, collectionAddress, validateCollectionAddress])
  
  // Get token URI
  const uri = useCallback(async (tokenId: bigint): Promise<string | null> => {
    if (!validateCollectionAddress() || !publicClient) return null
    
    try {
      const result = await publicClient.readContract({
        address: collectionAddress!,
        abi: COLLECTION_ABI,
        functionName: 'uri',
        args: [tokenId]
      })
      
      return result as string
    } catch (err: any) {
      console.error('Get URI failed:', err)
      setError(err.message || 'Failed to get token URI')
      return null
    }
  }, [publicClient, collectionAddress, validateCollectionAddress])
  
  // List token for sale
  const listForSale = useCallback(async (
    tokenId: bigint, 
    amount: bigint, 
    pricePerToken: bigint
  ): Promise<boolean> => {
    if (!walletClient || !address || !validateCollectionAddress()) return false
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Estimate gas
      const gas = await publicClient?.estimateContractGas({
        address: collectionAddress!,
        abi: COLLECTION_ABI,
        functionName: 'listForSale',
        args: [tokenId, amount, pricePerToken],
        account: address
      })
      
      // Execute transaction
      const hash = await walletClient.writeContract({
        address: collectionAddress!,
        abi: COLLECTION_ABI,
        functionName: 'listForSale',
        args: [tokenId, amount, pricePerToken],
        gas,
        account: address
      })
      
      toast.success('List for sale transaction sent!')
      
      // Wait for transaction confirmation
      const receipt = await publicClient?.waitForTransactionReceipt({ hash })
      
      if (receipt?.status === 'success') {
        toast.success('NFT listed for sale successfully!')
        return true
      }
      
      throw new Error('Transaction failed')
      
    } catch (err: any) {
      console.error('List for sale failed:', err)
      const errorMessage = err.message || 'Failed to list NFT for sale'
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, address, publicClient, collectionAddress, validateCollectionAddress])
  
  // Buy NFT from marketplace
  const buyNFT = useCallback(async (
    listingId: bigint, 
    amount: bigint, 
    value: bigint
  ): Promise<boolean> => {
    if (!walletClient || !address || !validateCollectionAddress()) return false
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Estimate gas
      const gas = await publicClient?.estimateContractGas({
        address: collectionAddress!,
        abi: COLLECTION_ABI,
        functionName: 'buyNFT',
        args: [listingId, amount],
        value,
        account: address
      })
      
      // Execute transaction
      const hash = await walletClient.writeContract({
        address: collectionAddress!,
        abi: COLLECTION_ABI,
        functionName: 'buyNFT',
        args: [listingId, amount],
        value,
        gas,
        account: address
      })
      
      toast.success('Purchase transaction sent!')
      
      // Wait for transaction confirmation
      const receipt = await publicClient?.waitForTransactionReceipt({ hash })
      
      if (receipt?.status === 'success') {
        toast.success('NFT purchased successfully!')
        return true
      }
      
      throw new Error('Transaction failed')
      
    } catch (err: any) {
      console.error('Buy NFT failed:', err)
      const errorMessage = err.message || 'Failed to purchase NFT'
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, address, publicClient, collectionAddress, validateCollectionAddress])
  
  // Delist NFT from marketplace
  const delistNFT = useCallback(async (listingId: bigint): Promise<boolean> => {
    if (!walletClient || !address || !validateCollectionAddress()) return false
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Estimate gas
      const gas = await publicClient?.estimateContractGas({
        address: collectionAddress!,
        abi: COLLECTION_ABI,
        functionName: 'delistNFT',
        args: [listingId],
        account: address
      })
      
      // Execute transaction
      const hash = await walletClient.writeContract({
        address: collectionAddress!,
        abi: COLLECTION_ABI,
        functionName: 'delistNFT',
        args: [listingId],
        gas,
        account: address
      })
      
      toast.success('Delist transaction sent!')
      
      // Wait for transaction confirmation
      const receipt = await publicClient?.waitForTransactionReceipt({ hash })
      
      if (receipt?.status === 'success') {
        toast.success('NFT delisted successfully!')
        return true
      }
      
      throw new Error('Transaction failed')
      
    } catch (err: any) {
      console.error('Delist NFT failed:', err)
      const errorMessage = err.message || 'Failed to delist NFT'
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, address, publicClient, collectionAddress, validateCollectionAddress])
  
  // Get accumulated fees for address
  const getAccumulatedFees = useCallback(async (address: Address): Promise<bigint> => {
    if (!validateCollectionAddress() || !publicClient) return BigInt(0)
    
    try {
      const result = await publicClient.readContract({
        address: collectionAddress!,
        abi: COLLECTION_ABI,
        functionName: 'accumulatedFees',
        args: [address]
      })
      
      return result as bigint
    } catch (err: any) {
      console.error('Get accumulated fees failed:', err)
      return BigInt(0)
    }
  }, [publicClient, collectionAddress, validateCollectionAddress])
  
  // Withdraw accumulated fees
  const withdrawFees = useCallback(async (): Promise<boolean> => {
    if (!walletClient || !address || !validateCollectionAddress()) return false
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Estimate gas
      const gas = await publicClient?.estimateContractGas({
        address: collectionAddress!,
        abi: COLLECTION_ABI,
        functionName: 'withdrawFees',
        account: address
      })
      
      // Execute transaction
      const hash = await walletClient.writeContract({
        address: collectionAddress!,
        abi: COLLECTION_ABI,
        functionName: 'withdrawFees',
        gas,
        account: address
      })
      
      toast.success('Withdraw fees transaction sent!')
      
      // Wait for transaction confirmation
      const receipt = await publicClient?.waitForTransactionReceipt({ hash })
      
      if (receipt?.status === 'success') {
        toast.success('Fees withdrawn successfully!')
        return true
      }
      
      throw new Error('Transaction failed')
      
    } catch (err: any) {
      console.error('Withdraw fees failed:', err)
      const errorMessage = err.message || 'Failed to withdraw fees'
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, address, publicClient, collectionAddress, validateCollectionAddress])
  
  return {
    isLoading,
    error,
    getCollectionName,
    getCollectionSymbol,
    getCollectionCreator,
    createToken,
    createTokenSimple,
    mint,
    getTokenInfo,
    isMintingActive,
    getCountdownTimeLeft,
    balanceOf,
    totalSupply,
    uri,
    listForSale,
    buyNFT,
    delistNFT,
    getAccumulatedFees,
    withdrawFees
  }
}