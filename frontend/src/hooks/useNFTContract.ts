import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { NFT_CONTRACT_ADDRESSES, MARKETPLACE_CONTRACT_ADDRESSES, DEFAULT_MINT_PRICE } from '@/lib/web3/wagmi'
import { NFT_ABI } from '@/lib/web3/contracts'

export interface MintParams {
  to: string
  tokenURI: string
  isCreatorFirstMint: boolean
  referrer?: string
  customPrice?: string
}

export function useNFTContract(chainId?: number) {
  const { address, chain } = useAccount()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const currentChainId = chainId || chain?.id || 8453 // Default to Base
  const contractAddress = NFT_CONTRACT_ADDRESSES[currentChainId as keyof typeof NFT_CONTRACT_ADDRESSES]

  // Read functions
  const { data: nextTokenId } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: NFT_ABI,
    functionName: 'getCurrentTokenId',
    chainId: currentChainId,
  })

  const { data: hasCreatorMinted } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: NFT_ABI,
    functionName: 'hasCreatorMinted',
    args: address ? [address] : undefined,
    chainId: currentChainId,
  })

  // Calculate mint fee
  const { data: mintFees } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: NFT_ABI,
    functionName: 'calculateMintFees',
    args: [
      parseEther(DEFAULT_MINT_PRICE),
      false, // hasReferrer
      false, // isCustomPrice
    ],
    chainId: currentChainId,
  })

  // Mint function with fixed gas limits to prevent overestimation
  const mint = async (params: MintParams) => {
    if (!contractAddress || !address) {
      throw new Error('Contract not available or wallet not connected')
    }

    // Basic validation - just check if it's not empty and starts with ipfs://
    if (!params.tokenURI || params.tokenURI.length === 0) {
      throw new Error('Token URI is required')
    }
    
    if (!params.tokenURI.startsWith('ipfs://')) {
      throw new Error('Invalid token URI format. Must start with ipfs://')
    }

    const mintPrice = params.customPrice ? parseEther(params.customPrice) : parseEther(DEFAULT_MINT_PRICE)
    // For new NFTs, creator first mint is always free (only gas cost)
    const value = params.isCreatorFirstMint ? BigInt(0) : mintPrice

    // AUTO GAS: Let the network estimate optimal gas limit
    // No fixed gas limit - will be estimated automatically

    console.log('Minting NFT with params:', {
      to: params.to,
      tokenURI: params.tokenURI,
      isCreatorFirstMint: params.isCreatorFirstMint,
      value: value.toString(),
      customPrice: params.customPrice,
      gasEstimation: 'automatic',
      chainId: currentChainId,
      contractAddress
    })

    return writeContract({
      address: contractAddress as `0x${string}`,
      abi: NFT_ABI,
      functionName: 'mint',
      args: [
        {
          to: params.to as `0x${string}`,
          tokenURI: params.tokenURI,
          isCreatorFirstMint: params.isCreatorFirstMint,
          referrer: (params.referrer || '0x0000000000000000000000000000000000000000') as `0x${string}`,
          customPrice: params.customPrice ? parseEther(params.customPrice) : BigInt(0),
        },
      ],
      value,
      chainId: currentChainId,
      // Remove gas parameter to allow automatic estimation
    })
  }

  // List for sale function
  const listForSale = async (tokenId: number, price: string) => {
    if (!contractAddress) {
      throw new Error('Contract not available')
    }

    return writeContract({
      address: contractAddress as `0x${string}`,
      abi: NFT_ABI,
      functionName: 'listForSale',
      args: [BigInt(tokenId), parseEther(price)],
      chainId: currentChainId,
      // Auto gas estimation for listing
    })
  }

  // Buy NFT function
  const buyNFT = async (tokenId: number, price: string) => {
    if (!contractAddress) {
      throw new Error('Contract not available')
    }

    return writeContract({
      address: contractAddress as `0x${string}`,
      abi: NFT_ABI,
      functionName: 'buyNFT',
      args: [BigInt(tokenId)],
      value: parseEther(price),
      chainId: currentChainId,
      // Auto gas estimation for buying
    })
  }

  // Get token info
  const { data: tokenInfo } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: NFT_ABI,
    functionName: 'getTokenInfo',
    args: [BigInt(1)], // Example token ID
    chainId: currentChainId,
  })

  return {
    // Contract info
    contractAddress,
    chainId: currentChainId,
    
    // State
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    
    // Read data
    nextTokenId: nextTokenId ? Number(nextTokenId) : 1,
    hasCreatorMinted: Boolean(hasCreatorMinted),
    mintFees: mintFees ? {
      creator: formatEther(mintFees[0]),
      firstMinter: formatEther(mintFees[1]),
      referral: formatEther(mintFees[2]),
      platform: formatEther(mintFees[3]),
    } : null,
    
    // Gas estimation - using automatic network estimation (no fixed limits)
    gasEstimation: 'automatic', // Network will estimate optimal gas based on current conditions
    
    // Functions
    mint,
    listForSale,
    buyNFT,
    
    // Helper
    isReady: Boolean(contractAddress && address),
  }
}