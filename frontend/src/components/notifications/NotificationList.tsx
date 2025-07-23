'use client'

import { useState, useEffect } from 'react'
import { Check, Filter, Trash2 } from 'lucide-react'
import NotificationItem, { NotificationData } from './NotificationItem'
import Button from '@/components/common/Button'

const mockNotifications: NotificationData[] = [
  {
    id: '1',
    type: 'sale',
    title: 'NFT Sold!',
    message: 'Your "Cosmic Cat #1234" has been sold to @cryptobuyer for 2.5 ETH',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    read: false,
    nftImage: '/api/placeholder/400/400',
    amount: '2.5 ETH',
    link: '/nft/1234'
  },
  {
    id: '2',
    type: 'bid',
    title: 'New Bid Received',
    message: '@artlover placed a bid of 1.8 ETH on your "Digital Dreams #567"',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    read: false,
    nftImage: '/api/placeholder/400/400',
    amount: '1.8 ETH',
    link: '/nft/567'
  },
  {
    id: '3',
    type: 'like',
    title: 'Your NFT was liked',
    message: '@nftfan and 12 others liked your "Abstract Art #890"',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    read: true,
    nftImage: '/api/placeholder/400/400',
    link: '/nft/890'
  },
  {
    id: '4',
    type: 'follow',
    title: 'New Follower',
    message: '@creativemind started following you',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
    read: false,
    avatar: '/api/placeholder/400/400',
    link: '/profile/creativemind'
  },
  {
    id: '5',
    type: 'comment',
    title: 'New Comment',
    message: '@collector commented: "Amazing artwork! Love the colors and composition."',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
    read: true,
    nftImage: '/api/placeholder/400/400',
    link: '/nft/456'
  },
  {
    id: '6',
    type: 'price_change',
    title: 'Price Alert',
    message: 'Floor price of "Cool Collection" increased by 15% to 0.8 ETH',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
    read: true,
    nftImage: '/api/placeholder/400/400',
    link: '/collections/cool-collection'
  },
  {
    id: '7',
    type: 'achievement',
    title: 'Achievement Unlocked!',
    message: 'You\'ve earned the "First Sale" badge for completing your first NFT sale!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    read: true,
    link: '/profile/achievements'
  },
  {
    id: '8',
    type: 'view',
    title: 'NFT Views Milestone',
    message: 'Your "Pixel Paradise #123" has reached 1,000 views!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    read: true,
    nftImage: '/api/placeholder/400/400',
    link: '/nft/123'
  }
]

interface NotificationListProps {
  className?: string
}

export default function NotificationList({ className = '' }: NotificationListProps) {
  const [notifications, setNotifications] = useState<NotificationData[]>(mockNotifications)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const unreadCount = notifications.filter(n => !n.read).length
  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    )
  }

  const handleDelete = (id: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== id)
    )
  }

  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
  }

  const handleClearAll = () => {
    setNotifications([])
  }

  if (notifications.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="w-16 h-16 bg-background-secondary rounded-full flex items-center justify-center mx-auto mb-4">
          <Check size={24} className="text-text-secondary" />
        </div>
        <h3 className="text-text-primary font-medium mb-2">All caught up!</h3>
        <p className="text-text-secondary">No notifications to show</p>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-text-primary font-semibold">
            Notifications {unreadCount > 0 && (
              <span className="ml-2 bg-purple-primary text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </h2>
          
          {/* Filter Toggle */}
          <div className="flex bg-background-secondary rounded-lg p-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                filter === 'all' 
                  ? 'bg-purple-primary text-white' 
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                filter === 'unread' 
                  ? 'bg-purple-primary text-white' 
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Unread
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              onClick={handleMarkAllAsRead}
              variant="secondary"
              size="sm"
              className="flex items-center gap-2"
            >
              <Check size={16} />
              Mark all read
            </Button>
          )}
          
          <Button
            onClick={handleClearAll}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 text-red-500 hover:text-red-400"
          >
            <Trash2 size={16} />
            Clear all
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-8">
          <Filter size={24} className="text-text-secondary mx-auto mb-2" />
          <p className="text-text-secondary">No {filter} notifications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}