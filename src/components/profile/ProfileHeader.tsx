import { Share, Settings, UserPlus } from 'lucide-react'

interface Profile {
  address: string
  username: string
  bio: string
  avatar: string
  followers: number
  following: number
  nftsCreated: number
  nftsMinted: number
  totalEarnings: string
}

interface ProfileHeaderProps {
  profile: Profile
}

export default function ProfileHeader({ profile }: ProfileHeaderProps) {
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
              <p className="text-text-secondary mb-2">
                {profile.address} " ZORIUM (ZRM)
              </p>
              <p className="text-text-secondary max-w-2xl">
                {profile.bio}
              </p>
            </div>
            
            <div className="flex gap-2 mt-4 sm:mt-0">
              <button className="btn-secondary">
                <Settings size={16} className="mr-2" />
                Edit Profile
              </button>
              <button className="btn-primary">
                <UserPlus size={16} className="mr-2" />
                Unfollow
              </button>
              <button className="btn-secondary">
                <Share size={16} />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-text-primary">
                {profile.followers.toLocaleString()}
              </div>
              <div className="text-text-secondary text-sm">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-text-primary">
                {profile.following.toLocaleString()}
              </div>
              <div className="text-text-secondary text-sm">Following</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-text-primary">
                {profile.nftsCreated}
              </div>
              <div className="text-text-secondary text-sm">Created</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-text-primary">
                {profile.nftsMinted}
              </div>
              <div className="text-text-secondary text-sm">Minted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-text-primary">
                {profile.totalEarnings} ETH
              </div>
              <div className="text-text-secondary text-sm">Earnings</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}