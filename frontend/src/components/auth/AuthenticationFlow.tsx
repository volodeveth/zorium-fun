'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import EmailRegistrationModal from './EmailRegistrationModal'
import FollowSuggestionsModal from './FollowSuggestionsModal'
import { CheckCircle, Mail, Clock, Users } from 'lucide-react'

export default function AuthenticationFlow() {
  // Temporarily disable email flow - skip registration modal
  const ENABLE_AUTH_FLOW = false
  
  if (!ENABLE_AUTH_FLOW) {
    return null
  }

  const { 
    user, 
    needsRegistration, 
    needsEmailVerification, 
    needsOnboarding,
    registerUser, 
    completeOnboarding,
    isLoading,
    error
  } = useAuth()

  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [showFollowSuggestions, setShowFollowSuggestions] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)

  // Show registration modal when new wallet connects
  if (needsRegistration && !showRegistrationModal && !registrationSuccess) {
    setShowRegistrationModal(true)
  }

  // Show follow suggestions after email verification
  if (needsOnboarding && !showFollowSuggestions) {
    setShowFollowSuggestions(true)
  }

  const handleRegistrationSubmit = async (data: { email: string; username: string; nickname: string }) => {
    try {
      await registerUser(data)
      setShowRegistrationModal(false)
      setRegistrationSuccess(true)
    } catch (error) {
      console.error('Registration failed:', error)
      // Error is handled by the hook
    }
  }

  const handleFollowSuggestionsComplete = async (followedUsers: string[]) => {
    try {
      await completeOnboarding(followedUsers)
      setShowFollowSuggestions(false)
    } catch (error) {
      console.error('Onboarding completion failed:', error)
    }
  }

  return (
    <>
      {/* Email Registration Modal */}
      <EmailRegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        onSubmit={handleRegistrationSubmit}
        walletAddress={user?.address || ''}
        isLoading={isLoading}
      />

      {/* Follow Suggestions Modal */}
      <FollowSuggestionsModal
        isOpen={showFollowSuggestions}
        onClose={() => setShowFollowSuggestions(false)}
        onComplete={handleFollowSuggestionsComplete}
      />

      {/* Email Verification Pending Banner */}
      {needsEmailVerification && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 max-w-md w-full mx-4">
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Mail className="text-yellow-500 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-text-primary mb-1">
                  Verify Your Email
                </h3>
                <p className="text-sm text-text-secondary mb-2">
                  We've sent a verification link to <strong>{user?.email}</strong>
                </p>
                <p className="text-xs text-text-secondary">
                  Click the link in your email to activate your account
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Registration Success Banner */}
      {registrationSuccess && needsEmailVerification && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 max-w-md w-full mx-4">
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-500 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-text-primary mb-1">
                  Registration Successful!
                </h3>
                <p className="text-sm text-text-secondary">
                  Check your email to verify your account
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 max-w-md w-full mx-4">
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-white text-xs">!</span>
              </div>
              <div>
                <h3 className="font-semibold text-text-primary mb-1">
                  Error
                </h3>
                <p className="text-sm text-text-secondary">
                  {error}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}