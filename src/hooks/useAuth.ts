import { useAccount, useSignMessage, useDisconnect } from 'wagmi'
import { useState, useEffect } from 'react'

interface User {
  address: string
  email?: string
  username?: string
  avatar?: string
  isVerified: boolean
}

export function useAuth() {
  const { address, isConnected, isConnecting } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const { disconnect } = useDisconnect()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if user exists in our database when wallet connects
  useEffect(() => {
    if (address && isConnected) {
      checkUserExists(address)
    } else {
      setUser(null)
    }
  }, [address, isConnected])

  const checkUserExists = async (walletAddress: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/users/${walletAddress}`)
      
      if (response.ok) {
        const userData = await response.json()
        setUser({
          address: walletAddress,
          ...userData,
          isVerified: true
        })
      } else if (response.status === 404) {
        // User doesn't exist, needs to register
        setUser({
          address: walletAddress,
          isVerified: false
        })
      }
    } catch (err) {
      console.error('Error checking user:', err)
      setError('Failed to verify user')
      // For development, create a mock user
      setUser({
        address: walletAddress,
        isVerified: false
      })
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async (message: string = 'Sign in to zorium.fun') => {
    if (!address) throw new Error('No wallet connected')
    
    setIsLoading(true)
    setError(null)
    
    try {
      const signature = await signMessageAsync({ message })
      
      // TODO: Send signature to backend for verification
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          message,
          signature
        })
      })
      
      if (!response.ok) throw new Error('Signature verification failed')
      
      const userData = await response.json()
      setUser(prev => prev ? { ...prev, ...userData, isVerified: true } : null)
      
      return signature
    } catch (err) {
      console.error('Sign in error:', err)
      setError(err instanceof Error ? err.message : 'Failed to sign in')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const registerUser = async (email: string, username?: string) => {
    if (!address) throw new Error('No wallet connected')
    
    setIsLoading(true)
    setError(null)
    
    try {
      // First, sign a message to verify wallet ownership
      const message = `Register account for zorium.fun with email: ${email}`
      const signature = await signMessageAsync({ message })
      
      // TODO: Send registration data to backend
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          email,
          username,
          message,
          signature
        })
      })
      
      if (!response.ok) throw new Error('Registration failed')
      
      const userData = await response.json()
      setUser({
        address,
        ...userData,
        isVerified: true
      })
      
      return userData
    } catch (err) {
      console.error('Registration error:', err)
      setError(err instanceof Error ? err.message : 'Registration failed')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = () => {
    disconnect()
    setUser(null)
    setError(null)
  }

  return {
    // Wallet connection state
    address,
    isConnected,
    isConnecting,
    
    // User state
    user,
    isAuthenticated: user?.isVerified ?? false,
    isRegistered: user !== null,
    
    // Loading and error states
    isLoading,
    error,
    
    // Actions
    signIn,
    registerUser,
    signOut,
    
    // Helpers
    needsRegistration: isConnected && user && !user.isVerified,
    shortAddress: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '',
  }
}