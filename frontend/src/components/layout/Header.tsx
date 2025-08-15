'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Menu, X, Bell, Search, Gift } from 'lucide-react'
import { useRouter } from 'next/navigation'
import ConnectWallet from '@/components/web3/ConnectWallet'
import SearchModal from '@/components/common/SearchModal'
import ThemeToggle from '@/components/common/ThemeToggle'
import ZoriumBalance from '@/components/common/ZoriumBalance'
import { useEarlyBirdNotification } from '@/hooks/useEarlyBirdNotification'

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const router = useRouter()
  
  // Early Bird functionality
  const { 
    earlyBirdStatus 
  } = useEarlyBirdNotification()

  // Log Early Bird status changes for debugging
  useEffect(() => {
    console.log('🎗️ Header: Early Bird status changed:', earlyBirdStatus)
  }, [earlyBirdStatus])

  const handleMobileNavClick = (href: string) => {
    setIsMobileMenuOpen(false)
    router.push(href)
  }

  return (
    <header className="sticky top-0 z-50 glass-effect">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <Image 
              src="/images/zoriumfun-logo.png" 
              alt="Zorium Logo" 
              width={32} 
              height={32}
              className="transition-transform duration-200 hover:scale-110"
            />
            <div className="text-xl sm:text-2xl font-bold gradient-text">
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
            <Link href="/wheel" className="text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1">
              🎰 Wheel
            </Link>
            <Link href="/create" className="text-text-secondary hover:text-text-primary transition-colors">
              Create
            </Link>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
            {/* Search - Hidden on mobile, shown in mobile menu */}
            <button 
              onClick={() => setIsSearchModalOpen(true)}
              className="hidden sm:block p-2 text-text-secondary hover:text-text-primary transition-colors"
              title="Search"
            >
              <Search size={20} />
            </button>
            
            {/* Theme Toggle - Always visible but smaller on mobile */}
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            
            {/* Zorium Balance - Desktop */}
            <div className="hidden sm:block">
              <ZoriumBalance />
            </div>
            
            {/* Early Bird Bonus - Show only if eligible */}
            {earlyBirdStatus.isEligible && !earlyBirdStatus.hasReceived && (
              <button 
                onClick={() => {
                  console.log('🎯 Desktop Early Bird button clicked')
                  window.dispatchEvent(new Event('earlybird-show'))
                }}
                className="hidden sm:flex items-center gap-1 px-3 py-1 bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 transition-colors rounded-lg border border-yellow-500/20"
                title="Claim your Early Bird bonus!"
              >
                <Gift size={16} />
                <span className="text-sm font-medium">Early Bird</span>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              </button>
            )}
            
            {/* Notifications - Hidden on mobile */}
            <Link href="/notifications" className="hidden sm:block p-2 text-text-secondary hover:text-text-primary transition-colors relative">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-primary rounded-full"></span>
            </Link>

            {/* Connect Wallet - Simplified on mobile */}
            <div className="flex-shrink-0">
              <ConnectWallet />
            </div>

            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2 text-text-secondary hover:text-text-primary flex-shrink-0"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col space-y-4">
              <button
                onClick={() => handleMobileNavClick('/')}
                className="text-left text-text-secondary hover:text-text-primary transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => handleMobileNavClick('/explore')}
                className="text-left text-text-secondary hover:text-text-primary transition-colors"
              >
                Explore
              </button>
              <button
                onClick={() => handleMobileNavClick('/trending')}
                className="text-left text-text-secondary hover:text-text-primary transition-colors"
              >
                Trending
              </button>
              <button
                onClick={() => handleMobileNavClick('/wheel')}
                className="text-left text-text-secondary hover:text-text-primary transition-colors"
              >
                🎰 Wheel
              </button>
              <button
                onClick={() => handleMobileNavClick('/create')}
                className="text-left text-text-secondary hover:text-text-primary transition-colors"
              >
                Create
              </button>
              
              {/* Early Bird Bonus - Mobile */}
              {earlyBirdStatus.isEligible && !earlyBirdStatus.hasReceived && (
                <button 
                  onClick={() => {
                    console.log('🎯 Mobile Early Bird button clicked')
                    setIsMobileMenuOpen(false)
                    window.dispatchEvent(new Event('earlybird-show'))
                  }}
                  className="flex items-center gap-2 w-full p-3 bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 transition-colors rounded-lg border border-yellow-500/20"
                >
                  <Gift size={18} />
                  <span className="font-medium">Claim Early Bird Bonus (10,000 ZRM)</span>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse ml-auto"></div>
                </button>
              )}
              
              {/* Mobile-only actions */}
              <div className="pt-4 border-t border-border space-y-4">
                {/* Zorium Balance - Mobile */}
                <div className="sm:hidden">
                  <ZoriumBalance />
                </div>
                
                {/* Search in mobile menu */}
                <button
                  onClick={() => {
                    setIsSearchModalOpen(true)
                    setIsMobileMenuOpen(false)
                  }}
                  className="flex items-center space-x-2 text-text-secondary hover:text-text-primary transition-colors w-full text-left"
                >
                  <Search size={18} />
                  <span>Search</span>
                </button>
                
                {/* Notifications in mobile menu */}
                <button
                  onClick={() => handleMobileNavClick('/notifications')}
                  className="flex items-center space-x-2 text-text-secondary hover:text-text-primary transition-colors relative w-full text-left"
                >
                  <Bell size={18} />
                  <span>Notifications</span>
                  <span className="w-2 h-2 bg-purple-primary rounded-full ml-1"></span>
                </button>
                
                {/* Theme toggle in mobile menu */}
                <div className="flex items-center space-x-2">
                  <span className="text-text-secondary">Theme</span>
                  <ThemeToggle />
                </div>
              </div>
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