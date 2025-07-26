import Link from 'next/link'
import { useState } from 'react'
import { Share, Settings, UserPlus, UserMinus, ExternalLink, Globe } from 'lucide-react'
import FollowersModal from './FollowersModal'

interface User {
  id: string
  username: string
  address: string
  avatar?: string
  isFollowing: boolean
}

interface Profile {
  address: string
  username: string
  bio: string
  avatar: string
  followers: number
  following: number
  website?: string
  twitterHandle?: string
  farcasterHandle?: string
}

interface ProfileHeaderProps {
  profile: Profile
  isOwnProfile?: boolean
  currentUserId?: string
}

export default function ProfileHeader({ profile, isOwnProfile = true, currentUserId = 'current-user' }: ProfileHeaderProps) {
  const [isFollowing, setIsFollowing] = useState(false)
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false)
  const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false)
  
  // Mock data for demonstration
  const [mockFollowers, setMockFollowers] = useState<User[]>([
    { id: '1', username: 'ArtistAlex', address: '0x1234567890abcdef1234567890abcdef12345678', isFollowing: false },
    { id: '2', username: 'CryptoCollector', address: '0x9876543210fedcba9876543210fedcba98765432', isFollowing: true },
    { id: '3', username: 'NFTEnthusiast', address: '0xabcdef1234567890abcdef1234567890abcdef12', isFollowing: false },
  ])
  
  const [mockFollowing, setMockFollowing] = useState<User[]>([
    { id: '4', username: 'DigitalCreator', address: '0xfedcba0987654321fedcba0987654321fedcba09', isFollowing: true },
    { id: '5', username: 'BlockchainArt', address: '0x5555555555555555555555555555555555555555', isFollowing: true },
  ])

  const handleFollow = () => {
    setIsFollowing(!isFollowing)
    // TODO: Implement actual follow/unfollow API call
  }

  const handleModalFollowToggle = (userId: string, isCurrentlyFollowing: boolean) => {
    // Update followers list
    setMockFollowers(prev => 
      prev.map(user => 
        user.id === userId 
          ? { ...user, isFollowing: !isCurrentlyFollowing }
          : user
      )
    )
    
    // Update following list
    setMockFollowing(prev => 
      prev.map(user => 
        user.id === userId 
          ? { ...user, isFollowing: !isCurrentlyFollowing }
          : user
      )
    )
    
    // TODO: Implement actual API call
    console.log(`${isCurrentlyFollowing ? 'Unfollowing' : 'Following'} user ${userId}`)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.username} - Zorium.fun`,
          text: `Check out ${profile.username}'s profile on Zorium.fun`,
          url: window.location.href,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href)
        // TODO: Show toast notification
        console.log('Profile link copied to clipboard')
      } catch (error) {
        console.log('Error copying to clipboard:', error)
      }
    }
  }
  return (
    <div className="bg-background-secondary rounded-xl border border-border p-8 mb-8">
      <div className="flex flex-col md:flex-row items-start gap-6">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-primary/50 to-blue-500/50 flex items-center justify-center text-2xl font-bold text-white">
            GD
          </div>
        </div>

        {/* Profile Info */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                {profile.username}
              </h1>
              <p className="text-text-secondary mb-3">
                {profile.address} " ZORIUM (ZRM)
              </p>
              
              {/* Followers/Following counts at top */}
              <div className="flex gap-6 mb-4">
                <button 
                  onClick={() => setIsFollowersModalOpen(true)}
                  className="text-center hover:opacity-75 transition-opacity"
                >
                  <div className="text-xl font-bold text-text-primary">
                    {profile.followers.toLocaleString()}
                  </div>
                  <div className="text-text-secondary text-sm">Followers</div>
                </button>
                <button 
                  onClick={() => setIsFollowingModalOpen(true)}
                  className="text-center hover:opacity-75 transition-opacity"
                >
                  <div className="text-xl font-bold text-text-primary">
                    {profile.following.toLocaleString()}
                  </div>
                  <div className="text-text-secondary text-sm">Following</div>
                </button>
              </div>
              
              <p className="text-text-secondary max-w-2xl mb-4">
                {profile.bio}
              </p>
              
              {/* Social Links */}
              {(profile.website || profile.twitterHandle || profile.farcasterHandle) && (
                <div className="flex items-center gap-4 flex-wrap">
                  {profile.website && (
                    <a 
                      href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-text-secondary hover:text-purple-primary transition-colors"
                    >
                      <Globe size={16} />
                      <span className="text-sm">{profile.website.replace(/^https?:\/\//, '')}</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                  
                  {profile.twitterHandle && (
                    <a 
                      href={`https://x.com/${profile.twitterHandle.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-text-secondary hover:text-purple-primary transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      <span className="text-sm">@{profile.twitterHandle.replace('@', '')}</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                  
                  {profile.farcasterHandle && (
                    <a 
                      href={`https://warpcast.com/${profile.farcasterHandle.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-text-secondary hover:text-purple-primary transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.2 12c0-1.36-.67-2.57-1.7-3.31V5.5c0-.83-.67-1.5-1.5-1.5h-4c-.83 0-1.5.67-1.5 1.5v3.19c-1.03.74-1.7 1.95-1.7 3.31s.67 2.57 1.7 3.31V18.5c0 .83.67 1.5 1.5 1.5h4c.83 0 1.5-.67 1.5-1.5v-3.19c1.03-.74 1.7-1.95 1.7-3.31zM3.5 4C2.67 4 2 4.67 2 5.5v13c0 .83.67 1.5 1.5 1.5h4c.83 0 1.5-.67 1.5-1.5v-13C9 4.67 8.33 4 7.5 4h-4z"/>
                      </svg>
                      <span className="text-sm">@{profile.farcasterHandle.replace('@', '')}</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex gap-2 mt-4 sm:mt-0">
              {isOwnProfile ? (
                <>
                  <Link href="/profile/settings" className="btn-secondary">
                    <Settings size={16} className="mr-2" />
                    Edit Profile
                  </Link>
                  <button className="btn-secondary" onClick={handleShare}>
                    <Share size={16} />
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className={isFollowing ? "btn-secondary" : "btn-primary"}
                    onClick={handleFollow}
                  >
                    {isFollowing ? (
                      <>
                        <UserMinus size={16} className="mr-2" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} className="mr-2" />
                        Follow
                      </>
                    )}
                  </button>
                  <button className="btn-secondary" onClick={handleShare}>
                    <Share size={16} />
                  </button>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
      
      {/* Followers Modal */}
      <FollowersModal
        isOpen={isFollowersModalOpen}
        onClose={() => setIsFollowersModalOpen(false)}
        type="followers"
        users={mockFollowers}
        currentUserId={currentUserId}
        profileOwnerId={profile.address}
        onFollowToggle={handleModalFollowToggle}
      />
      
      {/* Following Modal */}
      <FollowersModal
        isOpen={isFollowingModalOpen}
        onClose={() => setIsFollowingModalOpen(false)}
        type="following"
        users={mockFollowing}
        currentUserId={currentUserId}
        profileOwnerId={profile.address}
        onFollowToggle={handleModalFollowToggle}
      />
    </div>
  )
}