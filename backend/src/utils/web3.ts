import { ethers } from 'ethers'
import { logger } from './logger'
import { 
  getNetworkConfig, 
  getFactoryAddress, 
  FACTORY_ABI, 
  COLLECTION_ABI,
  CONTRACT_CONSTANTS,
  TokenStatus,
  type CollectionInfo,
  type TokenInfo,
  type MintParams,
  type CreateTokenParams
} from '../config/contracts'

// Platform Contract Configuration (Legacy ZRM system)
export const PLATFORM_CONTRACT_ADDRESS = '0x1B2221E8c1AEdf3a6Db7929453A253739dC64f3c'
export const ZRM_TOKEN_ADDRESS = '0x538D6F4fb9598dC74e15e6974049B109ae0AbC6a'
export const ZORA_RPC_URL = 'https://rpc.zora.energy'
export const ZORA_CHAIN_ID = 7777777

// Network providers (v2.0)
export const providers = {
  [8453]: new ethers.JsonRpcProvider('https://mainnet.base.org'),      // Base
  [7777777]: new ethers.JsonRpcProvider('https://rpc.zora.energy')     // Zora
}

// Platform Manager Contract ABI
export const PLATFORM_CONTRACT_ABI = [
  // Events
  'event TreasuryDeposit(address indexed admin, uint256 amount)',
  'event UserAllocation(address indexed user, uint256 amount, string reason)',
  'event UserDeposit(address indexed user, uint256 amount)',
  'event PromotionSpent(address indexed user, uint256 amount)',
  'event WheelSpun(address indexed user, uint256 reward)',
  'event FeesWithdrawn(address indexed admin, uint256 amount, address to)',
  'event EarlyBirdAllocated(address indexed user, uint256 amount)',
  'event EarlyBirdCampaignUpdated(uint256 maxUsers, uint256 rewardAmount)',
  
  // View functions
  'function getTreasuryBalance() view returns (uint256)',
  'function getAvailableZRM() view returns (uint256)',
  'function allocatedBalances(address user) view returns (uint256)',
  'function canUserSpinWheel(address user) view returns (bool)',
  'function getWheelCooldownTime(address user) view returns (uint256)',
  'function getPlatformStats() view returns (uint256 contractBalance, uint256 availableZRM, uint256 adminDeposits, uint256 userDeposits, uint256 promotionRevenue, uint256 earlyBirdAllocated, uint256 wheelRewards, uint256 adminWithdrawn)',
  'function earlyBirdRewardAmount() view returns (uint256)',
  'function maxEarlyBirdUsers() view returns (uint256)',
  'function totalEarlyBirdUsers() view returns (uint256)',
  'function hasReceivedEarlyBird(address user) view returns (bool)',
  
  // Admin functions
  'function depositToTreasury(uint256 amount)',
  'function allocateToUser(address user, uint256 amount, string reason)',
  'function withdrawAccumulatedFees(uint256 amount, address to)',
  'function setEarlyBirdCampaign(uint256 maxUsers, uint256 rewardAmount)',
  'function allocateEarlyBirdBonus(address user)',
  'function batchAllocateEarlyBird(address[] users)',
  
  // User functions
  'function depositZRM(uint256 amount)',
  'function spendOnPromotion(uint256 amount)',
  'function spinWheel() returns (uint256)'
]

// ZRM Token ABI (ERC-20)
export const ZRM_TOKEN_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)'
]

// Create provider and contract instances
export const provider = new ethers.JsonRpcProvider(ZORA_RPC_URL)
export const platformContract = new ethers.Contract(PLATFORM_CONTRACT_ADDRESS, PLATFORM_CONTRACT_ABI, provider)
export const zrmTokenContract = new ethers.Contract(ZRM_TOKEN_ADDRESS, ZRM_TOKEN_ABI, provider)

// Nonce storage (in production use Redis)
const nonces = new Map<string, { nonce: string; expires: number }>()

// Generate a random nonce for wallet signature
export function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Store nonce for address
export function storeNonce(address: string): string {
  const nonce = generateNonce()
  const expires = Date.now() + (10 * 60 * 1000) // 10 minutes
  
  nonces.set(address.toLowerCase(), { nonce, expires })
  
  // Clean up expired nonces
  setTimeout(() => {
    const stored = nonces.get(address.toLowerCase())
    if (stored && stored.expires <= Date.now()) {
      nonces.delete(address.toLowerCase())
    }
  }, 11 * 60 * 1000) // 11 minutes
  
  return nonce
}

// Get stored nonce for address
export function getNonce(address: string): string | null {
  const stored = nonces.get(address.toLowerCase())
  
  if (!stored) {
    return null
  }
  
  if (stored.expires <= Date.now()) {
    nonces.delete(address.toLowerCase())
    return null
  }
  
  return stored.nonce
}

// Remove nonce after use
export function consumeNonce(address: string): void {
  nonces.delete(address.toLowerCase())
}

// Verify wallet signature
export async function verifySignature(
  address: string,
  signature: string,
  nonce: string
): Promise<boolean> {
  try {
    // Create the message that should have been signed
    const message = `Sign this message to authenticate with Zorium: ${nonce}`
    
    // Recover the address from the signature
    const recoveredAddress = ethers.verifyMessage(message, signature)
    
    // Check if recovered address matches the claimed address
    const isValid = recoveredAddress.toLowerCase() === address.toLowerCase()
    
    logger.info('Signature verification:', {
      address,
      recoveredAddress,
      isValid,
      nonce
    })
    
    return isValid
    
  } catch (error) {
    logger.error('Signature verification failed:', error)
    return false
  }
}

// Generate authentication message
export function generateAuthMessage(nonce: string): string {
  return `Sign this message to authenticate with Zorium: ${nonce}`
}

// Validate Ethereum address format
export function isValidEthereumAddress(address: string): boolean {
  try {
    return ethers.isAddress(address)
  } catch (error) {
    return false
  }
}

// Clean up expired nonces (call periodically)
export function cleanupNonces(): void {
  const now = Date.now()
  for (const [address, data] of nonces.entries()) {
    if (data.expires <= now) {
      nonces.delete(address)
    }
  }
}

// Set up periodic cleanup
setInterval(cleanupNonces, 5 * 60 * 1000) // Every 5 minutes

// ============ ZRM CONTRACT FUNCTIONS ============

// Get ZRM platform statistics from blockchain
export async function getZRMPlatformStats(): Promise<{
  contractBalance: string;
  availableZRM: string;
  adminDeposits: string;
  userDeposits: string;
  promotionRevenue: string;
  earlyBirdAllocated: string;
  wheelRewards: string;
  adminWithdrawn: string;
}> {
  try {
    const [contractBalance, availableZRM, adminDeposits, userDeposits, promotionRevenue, earlyBirdAllocated, wheelRewards, adminWithdrawn] = await platformContract.getPlatformStats()
    
    return {
      contractBalance: ethers.formatEther(contractBalance),
      availableZRM: ethers.formatEther(availableZRM),
      adminDeposits: ethers.formatEther(adminDeposits),
      userDeposits: ethers.formatEther(userDeposits),
      promotionRevenue: ethers.formatEther(promotionRevenue),
      earlyBirdAllocated: ethers.formatEther(earlyBirdAllocated),
      wheelRewards: ethers.formatEther(wheelRewards),
      adminWithdrawn: ethers.formatEther(adminWithdrawn)
    }
  } catch (error) {
    logger.error('Failed to get ZRM platform stats from blockchain:', error)
    throw error
  }
}

// Get user's allocated ZRM balance from blockchain
export async function getUserAllocatedBalance(userAddress: string): Promise<string> {
  try {
    const balance = await platformContract.allocatedBalances(userAddress)
    return ethers.formatEther(balance)
  } catch (error) {
    logger.error(`Failed to get allocated balance for ${userAddress}:`, error)
    throw error
  }
}

// Check if user can spin wheel
export async function canUserSpinWheel(userAddress: string): Promise<boolean> {
  try {
    return await platformContract.canUserSpinWheel(userAddress)
  } catch (error) {
    logger.error(`Failed to check wheel availability for ${userAddress}:`, error)
    throw error
  }
}

// Get wheel cooldown time for user
export async function getWheelCooldownTime(userAddress: string): Promise<number> {
  try {
    const cooldownTime = await platformContract.getWheelCooldownTime(userAddress)
    return Number(cooldownTime)
  } catch (error) {
    logger.error(`Failed to get wheel cooldown for ${userAddress}:`, error)
    throw error
  }
}

// Get user's transferable ZRM balance
export async function getUserZRMBalance(userAddress: string): Promise<string> {
  try {
    const balance = await zrmTokenContract.balanceOf(userAddress)
    return ethers.formatEther(balance)
  } catch (error) {
    logger.error(`Failed to get ZRM balance for ${userAddress}:`, error)
    throw error
  }
}

// ============ BLOCKCHAIN EVENT LISTENERS ============

// Event handler type definitions
export interface ZRMEventHandlers {
  onTreasuryDeposit?: (admin: string, amount: string) => Promise<void>;
  onUserAllocation?: (user: string, amount: string, reason: string) => Promise<void>;
  onUserDeposit?: (user: string, amount: string) => Promise<void>;
  onPromotionSpent?: (user: string, amount: string) => Promise<void>;
  onFeesWithdrawn?: (admin: string, amount: string, to: string) => Promise<void>;
  onWheelSpun?: (user: string, reward: string) => Promise<void>;
  onEarlyBirdAllocated?: (user: string, amount: string) => Promise<void>;
  onEarlyBirdCampaignUpdated?: (maxUsers: string, rewardAmount: string) => Promise<void>;
}

// Set up blockchain event listeners
export function setupZRMEventListeners(handlers: ZRMEventHandlers): void {
  logger.info('Setting up ZRM contract event listeners...')

  // Listen for TreasuryDeposit events
  if (handlers.onTreasuryDeposit) {
    platformContract.on('TreasuryDeposit', async (admin: string, amount: bigint, event: any) => {
      try {
        const amountFormatted = ethers.formatEther(amount)
        logger.info(`TreasuryDeposit event: admin=${admin}, amount=${amountFormatted} ZRM`)
        await handlers.onTreasuryDeposit!(admin, amountFormatted)
      } catch (error) {
        logger.error('Error handling TreasuryDeposit event:', error)
      }
    })
  }

  // Listen for UserAllocation events
  if (handlers.onUserAllocation) {
    platformContract.on('UserAllocation', async (user: string, amount: bigint, reason: string, event: any) => {
      try {
        const amountFormatted = ethers.formatEther(amount)
        logger.info(`UserAllocation event: user=${user}, amount=${amountFormatted} ZRM, reason=${reason}`)
        await handlers.onUserAllocation!(user, amountFormatted, reason)
      } catch (error) {
        logger.error('Error handling UserAllocation event:', error)
      }
    })
  }

  // Listen for UserDeposit events
  if (handlers.onUserDeposit) {
    platformContract.on('UserDeposit', async (user: string, amount: bigint, event: any) => {
      try {
        const amountFormatted = ethers.formatEther(amount)
        logger.info(`UserDeposit event: user=${user}, amount=${amountFormatted} ZRM`)
        await handlers.onUserDeposit!(user, amountFormatted)
      } catch (error) {
        logger.error('Error handling UserDeposit event:', error)
      }
    })
  }

  // Listen for PromotionSpent events
  if (handlers.onPromotionSpent) {
    platformContract.on('PromotionSpent', async (user: string, amount: bigint, event: any) => {
      try {
        const amountFormatted = ethers.formatEther(amount)
        logger.info(`PromotionSpent event: user=${user}, amount=${amountFormatted} ZRM`)
        await handlers.onPromotionSpent!(user, amountFormatted)
      } catch (error) {
        logger.error('Error handling PromotionSpent event:', error)
      }
    })
  }

  // Listen for FeesWithdrawn events
  if (handlers.onFeesWithdrawn) {
    platformContract.on('FeesWithdrawn', async (admin: string, amount: bigint, to: string, event: any) => {
      try {
        const amountFormatted = ethers.formatEther(amount)
        logger.info(`FeesWithdrawn event: admin=${admin}, amount=${amountFormatted} ZRM, to=${to}`)
        await handlers.onFeesWithdrawn!(admin, amountFormatted, to)
      } catch (error) {
        logger.error('Error handling FeesWithdrawn event:', error)
      }
    })
  }

  // Listen for WheelSpun events
  if (handlers.onWheelSpun) {
    platformContract.on('WheelSpun', async (user: string, reward: bigint, event: any) => {
      try {
        const rewardFormatted = ethers.formatEther(reward)
        logger.info(`WheelSpun event: user=${user}, reward=${rewardFormatted} ZRM`)
        await handlers.onWheelSpun!(user, rewardFormatted)
      } catch (error) {
        logger.error('Error handling WheelSpun event:', error)
      }
    })
  }

  // Listen for EarlyBirdAllocated events
  if (handlers.onEarlyBirdAllocated) {
    platformContract.on('EarlyBirdAllocated', async (user: string, amount: bigint, event: any) => {
      try {
        const amountFormatted = ethers.formatEther(amount)
        logger.info(`EarlyBirdAllocated event: user=${user}, amount=${amountFormatted} ZRM`)
        await handlers.onEarlyBirdAllocated!(user, amountFormatted)
      } catch (error) {
        logger.error('Error handling EarlyBirdAllocated event:', error)
      }
    })
  }

  // Listen for EarlyBirdCampaignUpdated events
  if (handlers.onEarlyBirdCampaignUpdated) {
    platformContract.on('EarlyBirdCampaignUpdated', async (maxUsers: bigint, rewardAmount: bigint, event: any) => {
      try {
        const rewardFormatted = ethers.formatEther(rewardAmount)
        logger.info(`EarlyBirdCampaignUpdated event: maxUsers=${maxUsers.toString()}, rewardAmount=${rewardFormatted} ZRM`)
        await handlers.onEarlyBirdCampaignUpdated!(maxUsers.toString(), rewardFormatted)
      } catch (error) {
        logger.error('Error handling EarlyBirdCampaignUpdated event:', error)
      }
    })
  }


  logger.info('ZRM contract event listeners set up successfully')
}

// Stop listening to all events
export function stopZRMEventListeners(): void {
  platformContract.removeAllListeners()
  logger.info('ZRM contract event listeners stopped')
}

// ============ BLOCKCHAIN VERIFICATION FUNCTIONS ============

// Verify a transaction exists on Zora Network
export async function verifyTransaction(txHash: string): Promise<{
  exists: boolean;
  transaction?: any;
  receipt?: any;
}> {
  try {
    const [transaction, receipt] = await Promise.all([
      provider.getTransaction(txHash),
      provider.getTransactionReceipt(txHash)
    ])

    if (!transaction) {
      return { exists: false }
    }

    return {
      exists: true,
      transaction,
      receipt
    }
  } catch (error) {
    logger.error(`Failed to verify transaction ${txHash}:`, error)
    return { exists: false }
  }
}

// Verify ZRM deposit transaction
export async function verifyZRMDepositTransaction(
  txHash: string,
  expectedAdmin: string,
  expectedAmount: string
): Promise<{
  valid: boolean;
  actualAmount?: string;
  error?: string;
}> {
  try {
    const verification = await verifyTransaction(txHash)
    
    if (!verification.exists || !verification.receipt) {
      return { valid: false, error: 'Transaction not found or not confirmed' }
    }

    const { transaction, receipt } = verification

    // Check if transaction was successful
    if (receipt.status !== 1) {
      return { valid: false, error: 'Transaction failed' }
    }

    // Check if transaction is to our Platform contract
    if (transaction.to?.toLowerCase() !== PLATFORM_CONTRACT_ADDRESS.toLowerCase()) {
      return { valid: false, error: 'Transaction not sent to Platform contract' }
    }

    // Check if sender matches expected admin
    if (transaction.from?.toLowerCase() !== expectedAdmin.toLowerCase()) {
      return { valid: false, error: 'Transaction sender does not match expected admin' }
    }

    // Parse logs to find TokensDeposited event
    const depositEvent = receipt.logs.find((log: any) => {
      try {
        const parsedLog = platformContract.interface.parseLog(log)
        return parsedLog.name === 'TreasuryDeposit'
      } catch {
        return false
      }
    })

    if (!depositEvent) {
      return { valid: false, error: 'No TreasuryDeposit event found in transaction' }
    }

    const parsedEvent = platformContract.interface.parseLog(depositEvent)
    const actualAmount = ethers.formatEther(parsedEvent.args.amount)

    // Verify amount matches
    if (actualAmount !== expectedAmount) {
      return { 
        valid: false, 
        error: `Amount mismatch: expected ${expectedAmount}, actual ${actualAmount}`,
        actualAmount
      }
    }

    return { valid: true, actualAmount }

  } catch (error) {
    logger.error(`Error verifying ZRM deposit transaction:`, error)
    return { valid: false, error: 'Verification failed due to technical error' }
  }
}

// Verify ZRM allocation transaction (admin allocating to user)
export async function verifyZRMAllocationTransaction(
  txHash: string,
  expectedAdmin: string,
  expectedRecipient: string,
  expectedAmount: string
): Promise<{
  valid: boolean;
  actualAmount?: string;
  actualRecipient?: string;
  reason?: string;
  error?: string;
}> {
  try {
    const verification = await verifyTransaction(txHash)
    
    if (!verification.exists || !verification.receipt) {
      return { valid: false, error: 'Transaction not found or not confirmed' }
    }

    const { transaction, receipt } = verification

    if (receipt.status !== 1) {
      return { valid: false, error: 'Transaction failed' }
    }

    if (transaction.to?.toLowerCase() !== PLATFORM_CONTRACT_ADDRESS.toLowerCase()) {
      return { valid: false, error: 'Transaction not sent to ZRM contract' }
    }

    if (transaction.from?.toLowerCase() !== expectedAdmin.toLowerCase()) {
      return { valid: false, error: 'Transaction sender does not match expected admin' }
    }

    // Parse logs to find TokensAllocated event
    const allocationEvent = receipt.logs.find((log: any) => {
      try {
        const parsedLog = platformContract.interface.parseLog(log)
        return parsedLog.name === 'UserAllocation'
      } catch {
        return false
      }
    })

    if (!allocationEvent) {
      return { valid: false, error: 'No UserAllocation event found in transaction' }
    }

    const parsedEvent = platformContract.interface.parseLog(allocationEvent)
    const actualRecipient = parsedEvent.args.user.toLowerCase()
    const actualAmount = ethers.formatEther(parsedEvent.args.amount)
    const reason = parsedEvent.args.reason

    // Verify recipient matches
    if (actualRecipient !== expectedRecipient.toLowerCase()) {
      return { 
        valid: false, 
        error: `Recipient mismatch: expected ${expectedRecipient}, actual ${actualRecipient}`,
        actualRecipient
      }
    }

    // Verify amount matches
    if (actualAmount !== expectedAmount) {
      return { 
        valid: false, 
        error: `Amount mismatch: expected ${expectedAmount}, actual ${actualAmount}`,
        actualAmount,
        actualRecipient
      }
    }

    return { 
      valid: true, 
      actualAmount, 
      actualRecipient, 
      reason 
    }

  } catch (error) {
    logger.error(`Error verifying ZRM allocation transaction:`, error)
    return { valid: false, error: 'Verification failed due to technical error' }
  }
}

// Verify user promotion spending transaction
export async function verifyPromotionSpendingTransaction(
  txHash: string,
  expectedUser: string,
  expectedAmount: string,
  expectedPromotionType: string
): Promise<{
  valid: boolean;
  actualAmount?: string;
  actualPromotionType?: string;
  error?: string;
}> {
  try {
    const verification = await verifyTransaction(txHash)
    
    if (!verification.exists || !verification.receipt) {
      return { valid: false, error: 'Transaction not found or not confirmed' }
    }

    const { transaction, receipt } = verification

    if (receipt.status !== 1) {
      return { valid: false, error: 'Transaction failed' }
    }

    if (transaction.to?.toLowerCase() !== PLATFORM_CONTRACT_ADDRESS.toLowerCase()) {
      return { valid: false, error: 'Transaction not sent to ZRM contract' }
    }

    if (transaction.from?.toLowerCase() !== expectedUser.toLowerCase()) {
      return { valid: false, error: 'Transaction sender does not match expected user' }
    }

    // Parse logs to find PromotionPaid event
    const promotionEvent = receipt.logs.find((log: any) => {
      try {
        const parsedLog = platformContract.interface.parseLog(log)
        return parsedLog.name === 'PromotionSpent'
      } catch {
        return false
      }
    })

    if (!promotionEvent) {
      return { valid: false, error: 'No PromotionSpent event found in transaction' }
    }

    const parsedEvent = platformContract.interface.parseLog(promotionEvent)
    const actualAmount = ethers.formatEther(parsedEvent.args.amount)
    // Verify amount matches
    if (actualAmount !== expectedAmount) {
      return { 
        valid: false, 
        error: `Amount mismatch: expected ${expectedAmount}, actual ${actualAmount}`,
        actualAmount
      }
    }

    return { 
      valid: true, 
      actualAmount,
      actualPromotionType: 'promotion' // New contract doesn't have promotion type parameter
    }

  } catch (error) {
    logger.error(`Error verifying promotion spending transaction:`, error)
    return { valid: false, error: 'Verification failed due to technical error' }
  }
}

// Get current block number
export async function getCurrentBlockNumber(): Promise<number> {
  try {
    return await provider.getBlockNumber()
  } catch (error) {
    logger.error('Failed to get current block number:', error)
    throw error
  }
}

// Get network information
export async function getNetworkInfo(): Promise<{
  chainId: number;
  name: string;
  blockNumber: number;
}> {
  try {
    const [network, blockNumber] = await Promise.all([
      provider.getNetwork(),
      provider.getBlockNumber()
    ])

    return {
      chainId: Number(network.chainId),
      name: network.name,
      blockNumber
    }
  } catch (error) {
    logger.error('Failed to get network info:', error)
    throw error
  }
}

// ============ FACTORY CONTRACT FUNCTIONS (v2.0) ============

// Get factory contract instance
export function getFactoryContract(chainId: number) {
  const provider = providers[chainId]
  if (!provider) {
    throw new Error(`No provider for chain ID ${chainId}`)
  }
  
  const factoryAddress = getFactoryAddress(chainId)
  return new ethers.Contract(factoryAddress, FACTORY_ABI, provider)
}

// Get collection contract instance
export function getCollectionContract(chainId: number, collectionAddress: string) {
  const provider = providers[chainId]
  if (!provider) {
    throw new Error(`No provider for chain ID ${chainId}`)
  }
  
  return new ethers.Contract(collectionAddress, COLLECTION_ABI, provider)
}

// Get collections created by a specific address
export async function getCollectionsByCreator(chainId: number, creatorAddress: string): Promise<string[]> {
  try {
    const factory = getFactoryContract(chainId)
    const collections = await factory.getCollectionsByCreator(creatorAddress)
    
    logger.info(`Found ${collections.length} collections for creator ${creatorAddress} on chain ${chainId}`)
    return collections
  } catch (error) {
    logger.error(`Failed to get collections for creator ${creatorAddress} on chain ${chainId}:`, error)
    throw error
  }
}

// Get collection info from factory
export async function getCollectionInfoFromFactory(chainId: number, collectionAddress: string): Promise<CollectionInfo> {
  try {
    const factory = getFactoryContract(chainId)
    const info = await factory.getCollectionInfo(collectionAddress)
    
    return {
      creator: info[0],
      name: info[1],
      symbol: info[2],
      isPersonal: info[3],
      createdAt: Number(info[4]),
      totalTokens: Number(info[5])
    }
  } catch (error) {
    logger.error(`Failed to get collection info for ${collectionAddress} on chain ${chainId}:`, error)
    throw error
  }
}

// Check if collection is valid
export async function isValidCollection(chainId: number, collectionAddress: string): Promise<boolean> {
  try {
    const factory = getFactoryContract(chainId)
    return await factory.isValidCollection(collectionAddress)
  } catch (error) {
    logger.error(`Failed to validate collection ${collectionAddress} on chain ${chainId}:`, error)
    return false
  }
}

// Get total collections count
export async function getTotalCollections(chainId: number): Promise<number> {
  try {
    const factory = getFactoryContract(chainId)
    const total = await factory.totalCollections()
    return Number(total)
  } catch (error) {
    logger.error(`Failed to get total collections count on chain ${chainId}:`, error)
    throw error
  }
}

// ============ COLLECTION CONTRACT FUNCTIONS (v2.0) ============

// Get token info from collection
export async function getTokenInfo(chainId: number, collectionAddress: string, tokenId: number): Promise<TokenInfo> {
  try {
    const collection = getCollectionContract(chainId, collectionAddress)
    const info = await collection.getTokenInfo(tokenId)
    
    return {
      creator: info[0],
      firstMinter: info[1],
      mintPrice: ethers.formatEther(info[2]),
      isCustomPrice: info[3],
      mintEndTime: Number(info[4]),
      totalMinted: Number(info[5]),
      finalCountdownStart: Number(info[6]),
      status: info[7] as TokenStatus,
      referrer: info[8],
      tokenURI: info[9]
    }
  } catch (error) {
    logger.error(`Failed to get token info for token ${tokenId} in collection ${collectionAddress} on chain ${chainId}:`, error)
    throw error
  }
}

// Check if token minting is active
export async function isMintingActive(chainId: number, collectionAddress: string, tokenId: number): Promise<boolean> {
  try {
    const collection = getCollectionContract(chainId, collectionAddress)
    return await collection.isMintingActive(tokenId)
  } catch (error) {
    logger.error(`Failed to check minting status for token ${tokenId} in collection ${collectionAddress} on chain ${chainId}:`, error)
    return false
  }
}

// Get countdown time left for token
export async function getCountdownTimeLeft(chainId: number, collectionAddress: string, tokenId: number): Promise<number> {
  try {
    const collection = getCollectionContract(chainId, collectionAddress)
    const timeLeft = await collection.getCountdownTimeLeft(tokenId)
    return Number(timeLeft)
  } catch (error) {
    logger.error(`Failed to get countdown time for token ${tokenId} in collection ${collectionAddress} on chain ${chainId}:`, error)
    return 0
  }
}

// Get token balance for address
export async function getTokenBalance(chainId: number, collectionAddress: string, address: string, tokenId: number): Promise<number> {
  try {
    const collection = getCollectionContract(chainId, collectionAddress)
    const balance = await collection.balanceOf(address, tokenId)
    return Number(balance)
  } catch (error) {
    logger.error(`Failed to get token balance for ${address} token ${tokenId} in collection ${collectionAddress} on chain ${chainId}:`, error)
    return 0
  }
}

// Get token total supply
export async function getTokenTotalSupply(chainId: number, collectionAddress: string, tokenId: number): Promise<number> {
  try {
    const collection = getCollectionContract(chainId, collectionAddress)
    const supply = await collection.totalSupply(tokenId)
    return Number(supply)
  } catch (error) {
    logger.error(`Failed to get total supply for token ${tokenId} in collection ${collectionAddress} on chain ${chainId}:`, error)
    return 0
  }
}

// Get token URI
export async function getTokenURI(chainId: number, collectionAddress: string, tokenId: number): Promise<string> {
  try {
    const collection = getCollectionContract(chainId, collectionAddress)
    return await collection.uri(tokenId)
  } catch (error) {
    logger.error(`Failed to get token URI for token ${tokenId} in collection ${collectionAddress} on chain ${chainId}:`, error)
    return ''
  }
}

// Get collection basic info
export async function getCollectionBasicInfo(chainId: number, collectionAddress: string): Promise<{
  name: string;
  symbol: string;
  creator: string;
}> {
  try {
    const collection = getCollectionContract(chainId, collectionAddress)
    
    const [name, symbol, creator] = await Promise.all([
      collection.name(),
      collection.symbol(),
      collection.creator()
    ])
    
    return { name, symbol, creator }
  } catch (error) {
    logger.error(`Failed to get basic info for collection ${collectionAddress} on chain ${chainId}:`, error)
    throw error
  }
}

// Get accumulated fees for address
export async function getAccumulatedFees(chainId: number, collectionAddress: string, address: string): Promise<string> {
  try {
    const collection = getCollectionContract(chainId, collectionAddress)
    const fees = await collection.accumulatedFees(address)
    return ethers.formatEther(fees)
  } catch (error) {
    logger.error(`Failed to get accumulated fees for ${address} in collection ${collectionAddress} on chain ${chainId}:`, error)
    return '0'
  }
}

// ============ FEE CALCULATION FUNCTIONS ============

// Calculate mint fees from factory
export async function calculateMintFees(chainId: number, price: string, hasReferrer: boolean, isCustomPrice: boolean): Promise<{
  creatorFee: string;
  firstMinterFee: string;
  referralFee: string;
  platformFee: string;
}> {
  try {
    const factory = getFactoryContract(chainId)
    const priceWei = ethers.parseEther(price)
    
    const [creatorFee, firstMinterFee, referralFee, platformFee] = await factory.calculateMintFees(
      priceWei,
      hasReferrer,
      isCustomPrice
    )
    
    return {
      creatorFee: ethers.formatEther(creatorFee),
      firstMinterFee: ethers.formatEther(firstMinterFee),
      referralFee: ethers.formatEther(referralFee),
      platformFee: ethers.formatEther(platformFee)
    }
  } catch (error) {
    logger.error(`Failed to calculate mint fees for price ${price} on chain ${chainId}:`, error)
    throw error
  }
}

// Calculate sale fees from factory
export async function calculateSaleFees(chainId: number, price: string): Promise<{
  royaltyFee: string;
  marketplaceFee: string;
  netAmount: string;
}> {
  try {
    const factory = getFactoryContract(chainId)
    const priceWei = ethers.parseEther(price)
    
    const [royaltyFee, marketplaceFee, netAmount] = await factory.calculateSaleFees(priceWei)
    
    return {
      royaltyFee: ethers.formatEther(royaltyFee),
      marketplaceFee: ethers.formatEther(marketplaceFee),
      netAmount: ethers.formatEther(netAmount)
    }
  } catch (error) {
    logger.error(`Failed to calculate sale fees for price ${price} on chain ${chainId}:`, error)
    throw error
  }
}

// ============ EVENT PARSING HELPERS ============

// Parse collection created event
export function parseCollectionCreatedEvent(log: any): {
  creator: string;
  collection: string;
  name: string;
  symbol: string;
  isPersonal: boolean;
  timestamp: number;
} | null {
  try {
    const factory = getFactoryContract(8453) // Use any chain to get interface
    const parsedLog = factory.interface.parseLog(log)
    
    if (parsedLog?.name === 'CollectionCreated') {
      return {
        creator: parsedLog.args.creator,
        collection: parsedLog.args.collection,
        name: parsedLog.args.name,
        symbol: parsedLog.args.symbol,
        isPersonal: parsedLog.args.isPersonal,
        timestamp: Number(parsedLog.args.timestamp)
      }
    }
    
    return null
  } catch (error) {
    logger.error('Failed to parse CollectionCreated event:', error)
    return null
  }
}

// Parse token minted event
export function parseTokenMintedEvent(log: any): {
  tokenId: number;
  creator: string;
  minter: string;
  amount: number;
  price: string;
  isFirstMint: boolean;
} | null {
  try {
    const collection = getCollectionContract(8453, ethers.ZeroAddress) // Use any chain to get interface
    const parsedLog = collection.interface.parseLog(log)
    
    if (parsedLog?.name === 'TokenMinted') {
      return {
        tokenId: Number(parsedLog.args.tokenId),
        creator: parsedLog.args.creator,
        minter: parsedLog.args.minter,
        amount: Number(parsedLog.args.amount),
        price: ethers.formatEther(parsedLog.args.price),
        isFirstMint: parsedLog.args.isFirstMint
      }
    }
    
    return null
  } catch (error) {
    logger.error('Failed to parse TokenMinted event:', error)
    return null
  }
}