'use client'

import { useState, useEffect } from 'react'
import { X, UserPlus, Users, Check } from 'lucide-react'
import Button from '@/components/common/Button'
import UserLink from '@/components/common/UserLink'

interface SuggestedUser {
  id: string
  address: string
  username: string
  nickname: string
  avatar?: string
  followers: number
  isVerified: boolean
  category?: string
}

interface FollowSuggestionsModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (followedUsers: string[]) => void
}

// Mock data for suggested users - in real app this would come from API
const mockSuggestedUsers: SuggestedUser[] = [
  {
    id: '1',
    address: '0x1234...5678',
    username: 'cryptoartist',
    nickname: 'Crypto Artist',
    followers: 15420,
    isVerified: true,
    category: 'Digital Art'
  },
  {
    id: '2',
    address: '0xabcd...efgh',
    username: 'nftcollector',
    nickname: 'NFT Collector Pro',
    followers: 8965,
    isVerified: true,
    category: 'Collector'
  },
  {
    id: '3',
    address: '0x9876...5432',
    username: 'pixelmaster',
    nickname: 'Pixel Master',
    followers: 12340,
    isVerified: false,
    category: 'Pixel Art'
  },
  {
    id: '4',
    address: '0x5555...6666',
    username: 'metacreator',
    nickname: 'Meta Creator',
    followers: 7821,
    isVerified: true,
    category: 'Metaverse'
  },
  {
    id: '5',
    address: '0x7777...8888',
    username: 'artwhale',
    nickname: 'Art Whale',
    followers: 23567,
    isVerified: true,
    category: 'Investment'
  },
  {
    id: '6',
    address: '0x9999...aaaa',
    username: 'digitalnomad',
    nickname: 'Digital Nomad',
    followers: 5432,
    isVerified: false,
    category: 'Photography'
  }
]

export default function FollowSuggestionsModal({ isOpen, onClose, onComplete }: FollowSuggestionsModalProps) {
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([])
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

  // Load random suggestions when modal opens
  useEffect(() => {
    if (isOpen) {
      loadSuggestions()
    }
  }, [isOpen])

  const loadSuggestions = async () => {
    setIsLoading(true)
    try {
      // In real app, this would be an API call to get random popular users
      // For now, we'll randomly select 6 users from our mock data
      const shuffled = [...mockSuggestedUsers].sort(() => Math.random() - 0.5)
      setSuggestions(shuffled.slice(0, 6))
    } catch (error) {
      console.error('Failed to load suggestions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleFollow = (userId: string) => {
    setFollowedUsers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  const handleComplete = () => {
    onComplete(Array.from(followedUsers))
    onClose()
  }

  const handleSkip = () => {
    onComplete([])
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background-secondary border border-border rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <Users className="text-purple-primary" size={24} />
              Follow Popular Creators
            </h2>
            <p className="text-text-secondary text-sm mt-1">
              Discover amazing creators and start building your feed
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Stats */}
        <div className="bg-background-tertiary rounded-lg p-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-primary">
              {followedUsers.size}
            </div>
            <div className="text-sm text-text-secondary">
              creators selected
            </div>
          </div>
        </div>

        {/* Suggestions Grid */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-primary mx-auto"></div>
            <p className="text-text-secondary mt-2">Loading suggestions...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {suggestions.map((user) => (
              <div
                key={user.id}
                className="bg-background-primary border border-border rounded-xl p-4 hover:border-purple-primary/50 transition-all duration-200"
              >
                {/* User Info */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-purple-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-purple-primary font-semibold">
                      {user.nickname.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <h3 className="font-semibold text-text-primary truncate">
                        {user.nickname}
                      </h3>
                      {user.isVerified && (
                        <Check className="text-blue-500" size={16} />
                      )}
                    </div>
                    <UserLink
                      address={user.address}
                      username={user.username}
                      className="text-text-secondary text-sm hover:text-purple-primary"
                    />
                  </div>
                </div>

                {/* Category & Stats */}
                <div className="mb-3">
                  {user.category && (
                    <span className="text-xs bg-purple-primary/20 text-purple-primary px-2 py-1 rounded-full">
                      {user.category}
                    </span>
                  )}
                  <div className="text-sm text-text-secondary mt-2">
                    {user.followers.toLocaleString()} followers
                  </div>
                </div>

                {/* Follow Button */}
                <button
                  onClick={() => toggleFollow(user.id)}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                    followedUsers.has(user.id)
                      ? 'bg-purple-primary text-white hover:bg-purple-hover'
                      : 'bg-background-secondary text-text-primary hover:bg-background-tertiary border border-border hover:border-purple-primary'
                  }`}
                >
                  {followedUsers.has(user.id) ? (
                    <>
                      <Check size={16} />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      Follow
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="secondary"
            size="lg"
            onClick={handleSkip}
            className="flex-1"
          >
            Skip for Now
          </Button>
          <Button
            size="lg"
            onClick={handleComplete}
            className="flex-1"
            disabled={followedUsers.size === 0}
          >
            {followedUsers.size > 0 
              ? `Follow ${followedUsers.size} Creator${followedUsers.size > 1 ? 's' : ''}`
              : 'Continue'
            }
          </Button>
        </div>

        {/* Footer Note */}
        <div className="mt-4 text-center text-xs text-text-secondary">
          You can always discover and follow more creators later in the Explore section
        </div>
      </div>
    </div>
  )
}