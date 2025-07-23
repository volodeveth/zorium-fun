'use client'

// Temporarily disabled all imports for debugging deployment issues
// import { useState } from 'react'
// import { motion } from 'framer-motion'
// import { Edit, ExternalLink, Copy, Share } from 'lucide-react'
// import ProfileHeader from '@/components/profile/ProfileHeader'
// import ProfileTabs from '@/components/profile/ProfileTabs'
// import NFTCard from '@/components/nft/NFTCard'

// Temporarily disabled mock data for debugging
// const mockProfile = { ... }
// const mockNFTs = [ ... ]
// const mockMintedNFTs = [ ... ]

export default function ProfilePage({ params }: { params: { address: string } }) {
  // Temporarily simplified for debugging deployment issues
  // const [activeTab, setActiveTab] = useState('created')

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Simplified Profile Page - Debugging Mode */}
        <div className="bg-background-secondary rounded-xl border border-border p-8 mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-text-primary mb-4">
              Profile Page - Debug Mode
            </h1>
            <p className="text-text-secondary mb-6">
              Address: {params.address}
            </p>
            <p className="text-text-secondary">
              Temporarily disabled all external dependencies for deployment debugging.
              This page will show static content until issues are resolved.
            </p>
          </div>
        </div>

        {/* Simple static content */}
        <div className="bg-background-secondary rounded-xl border border-border p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">User Profile</h2>
          <div className="space-y-2 text-text-secondary">
            <p>Username: Debug User</p>
            <p>NFTs Created: 0</p>
            <p>NFTs Minted: 0</p>
            <p>Collections: 0</p>
          </div>
        </div>
      </div>
    </div>
  )
}