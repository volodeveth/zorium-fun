'use client'

import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import EditProfile from '@/components/profile/EditProfile'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ProfileSettings() {
  const { address, isConnected } = useAccount()
  const router = useRouter()

  useEffect(() => {
    if (!isConnected) {
      router.push('/')
    }
  }, [isConnected, router])

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-4">Connect Your Wallet</h1>
          <p className="text-text-secondary mb-6">You need to connect your wallet to access profile settings.</p>
          <Link href="/" className="btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-primary">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            href={`/profile/${address}`}
            className="p-2 rounded-lg bg-background-secondary hover:bg-background-tertiary border border-border transition-colors"
          >
            <ArrowLeft size={20} className="text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Profile Settings</h1>
            <p className="text-text-secondary mt-1">Manage your profile information and privacy settings</p>
          </div>
        </div>

        {/* Edit Profile Component */}
        <EditProfile />
      </div>
    </div>
  )
}