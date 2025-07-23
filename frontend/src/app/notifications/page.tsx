'use client'

import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import NotificationList from '@/components/notifications/NotificationList'
import Link from 'next/link'

export default function NotificationsPage() {
  const { isConnected } = useAccount()
  const router = useRouter()

  useEffect(() => {
    if (!isConnected) {
      router.push('/')
    }
  }, [isConnected, router])

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-4">Connect Your Wallet</h1>
          <p className="text-text-secondary mb-6">You need to connect your wallet to view notifications.</p>
          <Link href="/" className="btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-primary py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2">Notifications</h1>
          <p className="text-text-secondary">Stay updated with your NFT activity</p>
        </div>
        
        <NotificationList />
      </div>
    </div>
  )
}