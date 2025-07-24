'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Menu, X, Bell, Search } from 'lucide-react'
import ConnectWallet from '@/components/web3/ConnectWallet'
import SearchModal from '@/components/common/SearchModal'

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 glass-effect">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image 
              src="/images/zoriumfun-logo.png" 
              alt="Zorium Logo" 
              width={32} 
              height={32}
              className="transition-transform duration-200 hover:scale-110"
            />
            <div className="text-2xl font-bold gradient-text">
              zorium.fun
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-text-secondary hover:text-text-primary transition-colors">
              Home
            </Link>
            <Link href="/explore" className="text-text-secondary hover:text-text-primary transition-colors">
              Explore
            </Link>
            <Link href="/trending" className="text-text-secondary hover:text-text-primary transition-colors">
              Trending
            </Link>
            <Link href="/create" className="text-text-secondary hover:text-text-primary transition-colors">
              Create
            </Link>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <button 
              onClick={() => setIsSearchModalOpen(true)}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors"
              title="Search"
            >
              <Search size={20} />
            </button>
            
            {/* Notifications */}
            <Link href="/notifications" className="p-2 text-text-secondary hover:text-text-primary transition-colors relative">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-primary rounded-full"></span>
            </Link>

            {/* Connect Wallet */}
            <ConnectWallet />

            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2 text-text-secondary hover:text-text-primary"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col space-y-4">
              <Link href="/" className="text-text-secondary hover:text-text-primary transition-colors">
                Home
              </Link>
              <Link href="/explore" className="text-text-secondary hover:text-text-primary transition-colors">
                Explore
              </Link>
              <Link href="/trending" className="text-text-secondary hover:text-text-primary transition-colors">
                Trending
              </Link>
              <Link href="/create" className="text-text-secondary hover:text-text-primary transition-colors">
                Create
              </Link>
            </nav>
          </div>
        )}
      </div>

      {/* Search Modal */}
      <SearchModal 
        isOpen={isSearchModalOpen} 
        onClose={() => setIsSearchModalOpen(false)} 
      />
    </header>
  )
}