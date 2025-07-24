'use client'

import { useState } from 'react'
import { X, UserPlus, UserMinus } from 'lucide-react'

interface User {
  id: string
  username: string
  address: string
  avatar?: string
  isFollowing: boolean
}

interface FollowersModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'followers' | 'following'
  users: User[]
  currentUserId: string
  profileOwnerId: string
  onFollowToggle: (userId: string, isCurrentlyFollowing: boolean) => void
}

export default function FollowersModal({ 
  isOpen, 
  onClose, 
  type, 
  users, 
  currentUserId, 
  profileOwnerId, 
  onFollowToggle 
}: FollowersModalProps) {
  if (!isOpen) return null

  const isOwnProfile = currentUserId === profileOwnerId
  const title = type === 'followers' ? 'Followers' : 'Following'

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background-secondary rounded-xl border border-border w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-text-primary">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-background-tertiary rounded-lg transition-colors"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-6">
          {users.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-text-secondary mb-2">
                No {type} yet
              </div>
              <div className="text-text-secondary text-sm">
                {type === 'followers' 
                  ? 'When people follow this profile, they\'ll show up here' 
                  : 'When this user follows others, they\'ll show up here'
                }
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-primary/50 to-blue-500/50 flex items-center justify-center text-sm font-bold text-white">
                      {user.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-text-primary font-medium">
                        {user.username}
                      </div>
                      <div className="text-text-secondary text-sm">
                        {user.address}
                      </div>
                    </div>
                  </div>

                  {/* Follow/Unfollow Button - Only show if not own profile and not viewing own followers */}
                  {!isOwnProfile && user.id !== currentUserId && (
                    <button
                      onClick={() => onFollowToggle(user.id, user.isFollowing)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        user.isFollowing
                          ? 'bg-background-tertiary text-text-primary hover:bg-red-500/20 hover:text-red-400'
                          : 'bg-purple-primary text-white hover:bg-purple-hover'
                      }`}
                    >
                      {user.isFollowing ? (
                        <>
                          <UserMinus size={14} className="mr-1 inline" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus size={14} className="mr-1 inline" />
                          Follow
                        </>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}