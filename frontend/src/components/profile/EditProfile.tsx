'use client'

import { useState, useRef } from 'react'
import { useAccount, useEnsName, useEnsAvatar } from 'wagmi'
import { Camera, Save, User, Mail, Globe, Twitter, Upload, X } from 'lucide-react'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'

interface ProfileData {
  displayName: string
  bio: string
  email: string
  website: string
  twitter: string
  farcaster: string
  avatar: string | null
}

export default function EditProfile() {
  const { address } = useAccount()
  const { data: ensName } = useEnsName({ address })
  const { data: ensAvatar } = useEnsAvatar({ name: ensName || undefined })
  
  const [isLoading, setSaving] = useState(false)
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: ensName || '',
    bio: '',
    email: '',
    website: '',
    twitter: '',
    farcaster: '',
    avatar: ensAvatar || null
  })

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('File size must be less than 5MB')
        return
      }
      
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setPreviewAvatar(result)
        setProfileData(prev => ({
          ...prev,
          avatar: result
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const removeAvatar = () => {
    setPreviewAvatar(null)
    setProfileData(prev => ({
      ...prev,
      avatar: null
    }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Here you would typically send the data to your API
      console.log('Saving profile data:', profileData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const currentAvatar = previewAvatar || ensAvatar || profileData.avatar

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Avatar Section */}
      <div className="bg-background-secondary rounded-lg p-6 border border-border">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Profile Picture</h2>
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-r from-purple-primary to-blue-primary flex items-center justify-center">
              {currentAvatar ? (
                <img
                  src={currentAvatar}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={32} className="text-white" />
              )}
            </div>
            {currentAvatar && (
              <button
                onClick={removeAvatar}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </div>
          
          <div className="space-y-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarUpload}
              accept="image/*"
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Camera size={16} />
              Upload Photo
            </Button>
            <p className="text-text-secondary text-sm">
              JPG, PNG or GIF. Max size 5MB.
            </p>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-background-secondary rounded-lg p-6 border border-border">
        <h2 className="text-xl font-semibold text-text-primary mb-6">Basic Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-text-primary font-medium mb-2">
              Display Name
            </label>
            <Input
              value={profileData.displayName}
              onChange={(e) => handleInputChange('displayName', e.target.value)}
              placeholder="Enter your display name"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-text-primary font-medium mb-2">
              Bio
            </label>
            <textarea
              value={profileData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell us about yourself..."
              rows={4}
              className="w-full px-4 py-2 bg-background-primary border border-border rounded-lg text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-purple-primary focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-text-primary font-medium mb-2">
              Email
            </label>
            <Input
              type="email"
              value={profileData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="your@email.com"
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-background-secondary rounded-lg p-6 border border-border">
        <h2 className="text-xl font-semibold text-text-primary mb-6">Social Links</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-text-primary font-medium mb-2 flex items-center gap-2">
              <Globe size={16} />
              Website
            </label>
            <Input
              type="url"
              value={profileData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="https://yourwebsite.com"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-text-primary font-medium mb-2 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              X (Twitter)
            </label>
            <Input
              value={profileData.twitter}
              onChange={(e) => handleInputChange('twitter', e.target.value)}
              placeholder="@username"
              className="w-full"
            />
            <p className="text-text-secondary text-xs mt-1">
              Your X handle (will link to x.com)
            </p>
          </div>

          <div>
            <label className="block text-text-primary font-medium mb-2 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.2 12c0-1.36-.67-2.57-1.7-3.31V5.5c0-.83-.67-1.5-1.5-1.5h-4c-.83 0-1.5.67-1.5 1.5v3.19c-1.03.74-1.7 1.95-1.7 3.31s.67 2.57 1.7 3.31V18.5c0 .83.67 1.5 1.5 1.5h4c.83 0 1.5-.67 1.5-1.5v-3.19c1.03-.74 1.7-1.95 1.7-3.31zM3.5 4C2.67 4 2 4.67 2 5.5v13c0 .83.67 1.5 1.5 1.5h4c.83 0 1.5-.67 1.5-1.5v-13C9 4.67 8.33 4 7.5 4h-4z"/>
              </svg>
              Farcaster
            </label>
            <Input
              value={profileData.farcaster}
              onChange={(e) => handleInputChange('farcaster', e.target.value)}
              placeholder="@username"
              className="w-full"
            />
            <p className="text-text-secondary text-xs mt-1">
              Your Farcaster handle (will link to Warpcast)
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-background-secondary rounded-lg p-6 border border-border">
        <h2 className="text-xl font-semibold text-text-primary mb-6">Privacy Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-text-primary font-medium">Profile Visibility</h3>
              <p className="text-text-secondary text-sm">Allow others to see your profile</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-background-tertiary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-text-primary font-medium">Show NFT Collection</h3>
              <p className="text-text-secondary text-sm">Display your NFTs on your profile</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-background-tertiary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-text-primary font-medium">Activity Status</h3>
              <p className="text-text-secondary text-sm">Show when you're online</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-background-tertiary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-primary"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="flex items-center gap-2 px-8"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Saving...
            </>
          ) : (
            <>
              <Save size={16} />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}