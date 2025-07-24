'use client'

import Link from 'next/link'
import { User } from 'lucide-react'

interface UserLinkProps {
  address: string
  username: string
  avatar?: string
  showAvatar?: boolean
  showAt?: boolean
  className?: string
  hoverEffect?: boolean
}

export default function UserLink({ 
  address, 
  username, 
  avatar, 
  showAvatar = false, 
  showAt = true,
  className = '',
  hoverEffect = true
}: UserLinkProps) {
  const baseClasses = `inline-flex items-center gap-2 transition-colors ${
    hoverEffect ? 'hover:text-purple-primary' : ''
  }`
  
  return (
    <Link 
      href={`/profile/${address}`}
      className={`${baseClasses} ${className}`}
    >
      {showAvatar && (
        <div className="w-6 h-6 bg-purple-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
          {avatar ? (
            <img 
              src={avatar} 
              alt={username}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User size={12} className="text-purple-primary" />
          )}
        </div>
      )}
      <span>
        {showAt && '@'}{username}
      </span>
    </Link>
  )
}