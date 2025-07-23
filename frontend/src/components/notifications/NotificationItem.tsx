'use client'

import { useState } from 'react'
import { 
  Heart, 
  MessageCircle, 
  ShoppingBag, 
  Gavel, 
  UserPlus, 
  Award,
  TrendingUp,
  Eye,
  X,
  ExternalLink
} from 'lucide-react'

export interface NotificationData {
  id: string
  type: 'like' | 'comment' | 'sale' | 'bid' | 'follow' | 'achievement' | 'price_change' | 'view'
  title: string
  message: string
  timestamp: string
  read: boolean
  avatar?: string
  nftImage?: string
  amount?: string
  link?: string
}

interface NotificationItemProps {
  notification: NotificationData
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
}

export default function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDelete 
}: NotificationItemProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getNotificationIcon = (type: string) => {
    const iconProps = { size: 16, className: "text-white" }
    
    switch (type) {
      case 'like':
        return <Heart {...iconProps} />
      case 'comment':
        return <MessageCircle {...iconProps} />
      case 'sale':
        return <ShoppingBag {...iconProps} />
      case 'bid':
        return <Gavel {...iconProps} />
      case 'follow':
        return <UserPlus {...iconProps} />
      case 'achievement':
        return <Award {...iconProps} />
      case 'price_change':
        return <TrendingUp {...iconProps} />
      case 'view':
        return <Eye {...iconProps} />
      default:
        return <MessageCircle {...iconProps} />
    }
  }

  const getIconBackgroundColor = (type: string) => {
    switch (type) {
      case 'like':
        return 'bg-red-500'
      case 'comment':
        return 'bg-blue-500'
      case 'sale':
        return 'bg-green-500'
      case 'bid':
        return 'bg-orange-500'
      case 'follow':
        return 'bg-purple-500'
      case 'achievement':
        return 'bg-yellow-500'
      case 'price_change':
        return 'bg-indigo-500'
      case 'view':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id)
    }
    
    if (notification.link) {
      window.location.href = notification.link
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diff = now.getTime() - time.getTime()
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return time.toLocaleDateString()
  }

  const timeAgo = formatTimeAgo(notification.timestamp)

  return (
    <div
      className={`relative group p-4 border border-border rounded-lg transition-all duration-200 cursor-pointer ${
        !notification.read 
          ? 'bg-background-secondary border-purple-primary/20' 
          : 'bg-background-secondary hover:bg-background-tertiary'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Unread indicator */}
      {!notification.read && (
        <div className="absolute top-4 right-4 w-2 h-2 bg-purple-primary rounded-full"></div>
      )}

      {/* Delete button */}
      {isHovered && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(notification.id)
          }}
          className="absolute top-2 right-2 p-1 rounded-full bg-background-tertiary hover:bg-red-500 text-text-secondary hover:text-white transition-colors"
          title="Delete notification"
        >
          <X size={12} />
        </button>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${getIconBackgroundColor(notification.type)} flex items-center justify-center`}>
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className={`font-medium text-sm ${!notification.read ? 'text-text-primary' : 'text-text-primary'}`}>
                {notification.title}
              </h3>
              <p className="text-text-secondary text-sm mt-1 line-clamp-2">
                {notification.message}
              </p>
              
              <div className="flex items-center gap-2 mt-2">
                <span className="text-text-secondary text-xs">
                  {timeAgo}
                </span>
                
                {notification.amount && (
                  <>
                    <span className="text-text-secondary text-xs">"</span>
                    <span className="text-green-500 font-medium text-xs">
                      {notification.amount}
                    </span>
                  </>
                )}
                
                {notification.link && (
                  <>
                    <span className="text-text-secondary text-xs">"</span>
                    <ExternalLink size={12} className="text-text-secondary" />
                  </>
                )}
              </div>
            </div>

            {/* NFT Image or Avatar */}
            {(notification.nftImage || notification.avatar) && (
              <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-background-tertiary">
                <img
                  src={notification.nftImage || notification.avatar}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}