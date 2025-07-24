import Link from 'next/link'
import { useState } from 'react'
import { Share, Settings, UserPlus, UserMinus } from 'lucide-react'
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
    { id: '1', username: 'ArtistAlex', address: '0x123...abc', isFollowing: false },
    { id: '2', username: 'CryptoCollector', address: '0x456...def', isFollowing: true },
    { id: '3', username: 'NFTEnthusiast', address: '0x789...ghi', isFollowing: false },
  ])
  
  const [mockFollowing, setMockFollowing] = useState<User[]>([
    { id: '4', username: 'DigitalCreator', address: '0xabc...123', isFollowing: true },
    { id: '5', username: 'BlockchainArt', address: '0xdef...456', isFollowing: true },
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
              
              <p className="text-text-secondary max-w-2xl">
                {profile.bio}
              </p>
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