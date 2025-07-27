/**
 * Formats numbers according to Zorium display rules:
 * - 1 to 9999: show full number
 * - 10000+: show abbreviated (10K, 10.2K, 20K, 100K, 150K, 1M, etc.)
 */
export function formatZoriumBalance(balance: number): string {
  if (balance < 10000) {
    return balance.toString()
  }
  
  if (balance < 1000000) {
    // Format as K (thousands)
    const thousands = balance / 1000
    if (thousands >= 100) {
      // 100K+, no decimal
      return `${Math.floor(thousands)}K`
    } else if (thousands >= 10) {
      // 10K-99K, show decimal only if needed
      const rounded = Math.round(thousands * 10) / 10
      return rounded % 1 === 0 ? `${rounded}K` : `${rounded}K`
    } else {
      // This shouldn't happen with our logic, but just in case
      return `${Math.round(thousands * 10) / 10}K`
    }
  }
  
  if (balance < 1000000000) {
    // Format as M (millions)
    const millions = balance / 1000000
    if (millions >= 100) {
      // 100M+, no decimal
      return `${Math.floor(millions)}M`
    } else if (millions >= 10) {
      // 10M-99M, show decimal only if needed
      const rounded = Math.round(millions * 10) / 10
      return rounded % 1 === 0 ? `${rounded}M` : `${rounded}M`
    } else {
      // 1M-9.9M, show one decimal if needed
      const rounded = Math.round(millions * 10) / 10
      return rounded % 1 === 0 ? `${rounded}M` : `${rounded}M`
    }
  }
  
  // Format as B (billions)
  const billions = balance / 1000000000
  const rounded = Math.round(billions * 10) / 10
  return rounded % 1 === 0 ? `${rounded}B` : `${rounded}B`
}

/**
 * Mock function to get user's ZRM balance
 * In real implementation, this would call a smart contract or API
 */
export async function getZoriumBalance(address: string): Promise<number> {
  // Mock implementation - replace with actual contract call
  // This simulates different balance ranges for demo
  const mockBalances: Record<string, number> = {
    // Example addresses with different balance ranges
    default: Math.floor(Math.random() * 999999) + 1000 // Random balance between 1K-1M
  }
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  return mockBalances[address] || mockBalances.default
}