import { useAccount, useSignMessage, useDisconnect } from 'wagmi'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

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
      // Store wallet address for admin API calls
      localStorage.setItem('wallet_address', address)
      checkUserExists(address)
    } else {
      setUser(null)
      localStorage.removeItem('wallet_address')
    }
  }, [address, isConnected])

  const checkUserExists = async (walletAddress: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Check if we already have a JWT token
      const existingToken = localStorage.getItem('auth_token')
      if (existingToken) {
        // Try to verify the token by checking session
        try {
          const sessionResponse = await api.auth.getSession()
          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json()
            setUser({
              address: walletAddress,
              email: sessionData.user?.email,
              username: sessionData.user?.username,
              nickname: sessionData.user?.displayName,
              isVerified: sessionData.user?.isVerified || true,
              isEmailVerified: true,
              registrationStep: 'completed'
            })
            setIsLoading(false)
            return
          }
        } catch (err) {
          // Token is invalid, remove it
          localStorage.removeItem('auth_token')
        }
      }
      
      // Automatically sign in the user to get a JWT token
      try {
        await signIn()
        return
      } catch (signInError) {
        console.log('Auto sign-in failed, creating user without backend auth:', signInError)
      }
      
      // Check ZRM balance and user data from backend
      const response = await api.users.getZrmBalance(walletAddress)
      
      if (response.ok) {
        const userData = await response.json()
        if (userData.user) {
          // User exists in database
          setUser({
            address: walletAddress,
            email: userData.user.email,
            username: userData.user.username,
            nickname: userData.user.displayName,
            isVerified: userData.user.isVerified || false,
            isEmailVerified: true, // Assume email is verified if user exists
            registrationStep: 'completed'
          })
        } else {
          // User doesn't exist, auto-register without email for now
          setUser({
            address: walletAddress,
            isVerified: true, // Temporarily auto-verify
            isEmailVerified: true, // Skip email verification
            registrationStep: 'completed' // Skip registration flow
          })
        }
      } else {
        // API error, auto-register without email for now
        setUser({
          address: walletAddress,
          isVerified: true, // Temporarily auto-verify
          isEmailVerified: true, // Skip email verification
          registrationStep: 'completed' // Skip registration flow
        })
      }
    } catch (err) {
      console.error('Error checking user:', err)
      setError('Failed to connect to backend')
      // Create a mock user without email requirement
      setUser({
        address: walletAddress,
        isVerified: true, // Temporarily auto-verify
        isEmailVerified: true, // Skip email verification
        registrationStep: 'completed' // Skip registration flow
      })
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async () => {
    if (!address) throw new Error('No wallet connected')
    
    setIsLoading(true)
    setError(null)
    
    try {
      // First, get nonce from backend
      const nonceResponse = await api.auth.getNonce(address)
      if (!nonceResponse.ok) throw new Error('Failed to get nonce')
      
      const { message } = await nonceResponse.json()
      
      // Sign the message
      const signature = await signMessageAsync({ message })
      
      // Send signature to backend for verification
      const response = await api.auth.login({ address, signature })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Login failed')
      }
      
      const userData = await response.json()
      setUser({
        address,
        email: userData.user?.email,
        username: userData.user?.username,
        nickname: userData.user?.displayName,
        isVerified: userData.user?.isVerified || false,
        isEmailVerified: true,
        registrationStep: 'completed'
      })
      
      // Store JWT token in localStorage for future requests
      if (userData.token) {
        localStorage.setItem('auth_token', userData.token)
      }
      
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
      // First, get nonce from backend
      const nonceResponse = await api.auth.getNonce(address)
      if (!nonceResponse.ok) throw new Error('Failed to get nonce')
      
      const { message } = await nonceResponse.json()
      
      // Sign the message to verify wallet ownership
      const signature = await signMessageAsync({ message })
      
      // Send registration data to backend
      const response = await api.auth.register({
        address,
        email: data.email,
        username: data.username,
        signature
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Registration failed')
      }
      
      const userData = await response.json()
      setUser({
        address,
        email: data.email,
        username: data.username,
        nickname: data.nickname,
        isVerified: userData.user?.isVerified || false,
        isEmailVerified: true, // Backend handles registration as complete
        registrationStep: 'completed'
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
      const response = await api.auth.verifyEmail(token)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Email verification failed')
      }
      
      const userData = await response.json()
      
      if (userData.success && userData.user) {
        setUser({
          address: userData.user.address,
          email: userData.user.email,
          username: userData.user.username,
          nickname: userData.user.displayName,
          isVerified: userData.user.isVerified,
          isEmailVerified: userData.user.emailVerified,
          registrationStep: 'completed'
        })
        
        // Store user session if available
        localStorage.setItem('user_verified', 'true')
      }
      
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
    // Clear stored JWT token
    localStorage.removeItem('auth_token')
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