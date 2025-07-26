import { useAccount, useSignMessage, useDisconnect } from 'wagmi'
import { useState, useEffect } from 'react'

interface User {
  address: string
  email?: string
  username?: string
  nickname?: string
  avatar?: string
  isVerified: boolean
  isEmailVerified: boolean
  registrationStep: 'wallet_connected' | 'email_pending' | 'email_verified' | 'completed'
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
          isVerified: userData.isEmailVerified && userData.registrationStep === 'completed'
        })
      } else if (response.status === 404) {
        // User doesn't exist, needs to register
        setUser({
          address: walletAddress,
          isVerified: false,
          isEmailVerified: false,
          registrationStep: 'wallet_connected'
        })
      }
    } catch (err) {
      console.error('Error checking user:', err)
      setError('Failed to verify user')
      // For development, create a mock user
      setUser({
        address: walletAddress,
        isVerified: false,
        isEmailVerified: false,
        registrationStep: 'wallet_connected'
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

  const registerUser = async (data: { email: string; username: string; nickname: string }) => {
    if (!address) throw new Error('No wallet connected')
    
    setIsLoading(true)
    setError(null)
    
    try {
      // First, sign a message to verify wallet ownership
      const message = `Register account for zorium.fun with email: ${data.email}`
      const signature = await signMessageAsync({ message })
      
      // Send registration data to backend
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          email: data.email,
          username: data.username,
          nickname: data.nickname,
          message,
          signature
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Registration failed')
      }
      
      const userData = await response.json()
      setUser({
        address,
        ...userData,
        isVerified: false, // Will be true after email verification
        isEmailVerified: false,
        registrationStep: 'email_pending'
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

  const verifyEmail = async (token: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })
      
      if (!response.ok) throw new Error('Email verification failed')
      
      const userData = await response.json()
      setUser(prev => prev ? {
        ...prev,
        ...userData,
        isEmailVerified: true,
        registrationStep: 'email_verified',
        isVerified: false // Still needs to complete onboarding
      } : null)
      
      return userData
    } catch (err) {
      console.error('Email verification error:', err)
      setError(err instanceof Error ? err.message : 'Email verification failed')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const completeOnboarding = async (followedUsers: string[] = []) => {
    if (!user || !address) throw new Error('No user or wallet connected')
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/auth/complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          followedUsers
        })
      })
      
      if (!response.ok) throw new Error('Onboarding completion failed')
      
      const userData = await response.json()
      setUser(prev => prev ? {
        ...prev,
        ...userData,
        registrationStep: 'completed',
        isVerified: true
      } : null)
      
      return userData
    } catch (err) {
      console.error('Onboarding completion error:', err)
      setError(err instanceof Error ? err.message : 'Onboarding completion failed')
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
    verifyEmail,
    completeOnboarding,
    signOut,
    
    // Helpers
    needsRegistration: isConnected && user && user.registrationStep === 'wallet_connected',
    needsEmailVerification: isConnected && user && user.registrationStep === 'email_pending',
    needsOnboarding: isConnected && user && user.registrationStep === 'email_verified',
    shortAddress: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '',
  }
}