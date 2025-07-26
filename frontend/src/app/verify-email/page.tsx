'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Mail, Loader } from 'lucide-react'
import Button from '@/components/common/Button'
import { useAuth } from '@/hooks/useAuth'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { verifyEmail, user } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    
    if (!token) {
      setStatus('error')
      setMessage('Verification token is missing')
      return
    }
    
    handleVerification(token)
  }, [searchParams])

  const handleVerification = async (token: string) => {
    try {
      await verifyEmail(token)
      setStatus('success')
      setMessage('Your email has been verified successfully!')
      
      // Redirect to home after 2 seconds
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Email verification failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-background-secondary border border-border rounded-2xl p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 bg-purple-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader className="text-purple-primary animate-spin" size={32} />
              </div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">
                Verifying Email
              </h1>
              <p className="text-text-secondary">
                Please wait while we verify your email address...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-green-500" size={32} />
              </div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">
                Email Verified!
              </h1>
              <p className="text-text-secondary mb-6">
                {message}
              </p>
              <p className="text-sm text-text-secondary mb-4">
                You will be redirected to complete your profile setup...
              </p>
              <Button onClick={() => router.push('/')} className="w-full">
                Continue to Platform
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="text-red-500" size={32} />
              </div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">
                Verification Failed
              </h1>
              <p className="text-text-secondary mb-6">
                {message}
              </p>
              <div className="space-y-3">
                <Button onClick={() => router.push('/')} className="w-full">
                  Return to Home
                </Button>
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full text-purple-primary hover:text-purple-hover transition-colors text-sm"
                >
                  Try Again
                </button>
              </div>
            </>
          )}

          {/* Help Section */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Mail className="text-text-secondary" size={16} />
              <span className="text-sm text-text-secondary">Need help?</span>
            </div>
            <p className="text-xs text-text-secondary">
              If you're having trouble, please contact support or try registering again.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}