'use client'

import { useState } from 'react'
import { X, Mail, User, UserCheck } from 'lucide-react'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'

interface EmailRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { email: string; username: string; nickname: string }) => Promise<void>
  walletAddress: string
  isLoading: boolean
}

export default function EmailRegistrationModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  walletAddress,
  isLoading 
}: EmailRegistrationModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    nickname: ''
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    // Username validation (login)
    if (!formData.username) {
      newErrors.username = 'Username is required'
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores'
    }
    
    // Nickname validation
    if (!formData.nickname) {
      newErrors.nickname = 'Display name is required'
    } else if (formData.nickname.length < 2) {
      newErrors.nickname = 'Display name must be at least 2 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Registration error:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background-secondary border border-border rounded-2xl p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Complete Registration</h2>
            <p className="text-text-secondary text-sm mt-1">
              Link your wallet to create your account
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Wallet Info */}
        <div className="bg-background-tertiary rounded-lg p-3 mb-6">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 bg-purple-primary/20 rounded-full flex items-center justify-center">
              <User className="text-purple-primary" size={16} />
            </div>
            <div>
              <div className="text-text-secondary">Wallet Address:</div>
              <div className="text-text-primary font-medium">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </div>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Email Address *
            </label>
            <Input
              type="email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              error={errors.email}
              icon={<Mail size={18} />}
              disabled={isLoading}
            />
            <p className="text-xs text-text-secondary mt-1">
              You'll receive a verification email to activate your account
            </p>
          </div>

          {/* Username Field */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Username (Login) *
            </label>
            <Input
              type="text"
              placeholder="username123"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value.toLowerCase())}
              error={errors.username}
              icon={<User size={18} />}
              disabled={isLoading}
            />
            <p className="text-xs text-text-secondary mt-1">
              Unique identifier for login (letters, numbers, underscores only)
            </p>
          </div>

          {/* Nickname Field */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Display Name *
            </label>
            <Input
              type="text"
              placeholder="Your Display Name"
              value={formData.nickname}
              onChange={(e) => handleInputChange('nickname', e.target.value)}
              error={errors.nickname}
              icon={<UserCheck size={18} />}
              disabled={isLoading}
            />
            <p className="text-xs text-text-secondary mt-1">
              How others will see your name on the platform
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account & Send Verification'}
            </Button>
          </div>
        </form>

        {/* Footer Note */}
        <div className="mt-6 p-4 bg-purple-primary/10 border border-purple-primary/20 rounded-lg">
          <div className="flex items-start gap-2">
            <Mail className="text-purple-primary mt-0.5" size={16} />
            <div className="text-sm">
              <div className="text-text-primary font-medium mb-1">Email Verification Required</div>
              <div className="text-text-secondary">
                After submitting, check your email for a verification link. 
                Your account will be activated once you click the link.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}