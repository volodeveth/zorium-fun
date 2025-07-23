'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount, useEnsName, useEnsAvatar } from 'wagmi'
import { User, Settings, LogOut, Copy, Check } from 'lucide-react'

interface UserProfileDropdownProps {
  address: string
}

export default function UserProfileDropdown({ address }: UserProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  
  const { disconnect } = useAccount()
  const { data: ensName } = useEnsName({ address: address as `0x${string}` })
  const { data: ensAvatar } = useEnsAvatar({ name: ensName })

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy address:', err)
    }
  }

  const handleProfileClick = () => {
    router.push(`/profile/${address}`)
    setIsOpen(false)
  }

  const handleSettingsClick = () => {
    router.push('/profile/settings')
    setIsOpen(false)
  }

  const handleDisconnect = () => {
    disconnect()
    setIsOpen(false)
  }

  const displayName = ensName || `${address.slice(0, 6)}...${address.slice(-4)}`

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg bg-background-secondary hover:bg-background-tertiary border border-border transition-colors duration-200"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-r from-purple-primary to-blue-primary flex items-center justify-center">
          {ensAvatar ? (
            <img
              src={ensAvatar}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <User size={16} className="text-white" />
          )}
        </div>
        <span className="hidden sm:block text-text-primary font-medium">
          {displayName}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-background-primary border border-border rounded-lg shadow-lg z-50">
          {/* User Info Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-purple-primary to-blue-primary flex items-center justify-center">
                {ensAvatar ? (
                  <img
                    src={ensAvatar}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={20} className="text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-text-primary font-medium truncate">
                  {displayName}
                </div>
                <div className="flex items-center gap-2 text-text-secondary text-sm">
                  <span className="truncate">{address}</span>
                  <button
                    onClick={handleCopyAddress}
                    className="p-1 hover:bg-background-secondary rounded transition-colors"
                    title="Copy address"
                  >
                    {copied ? (
                      <Check size={12} className="text-green-500" />
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={handleProfileClick}
              className="w-full flex items-center gap-3 px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-background-secondary transition-colors"
            >
              <User size={16} />
              <span>View Profile</span>
            </button>
            
            <button
              onClick={handleSettingsClick}
              className="w-full flex items-center gap-3 px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-background-secondary transition-colors"
            >
              <Settings size={16} />
              <span>Settings</span>
            </button>
            
            <div className="border-t border-border my-2"></div>
            
            <button
              onClick={handleDisconnect}
              className="w-full flex items-center gap-3 px-4 py-2 text-red-500 hover:text-red-400 hover:bg-background-secondary transition-colors"
            >
              <LogOut size={16} />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}