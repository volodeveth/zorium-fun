'use client'

import { useState, useEffect } from 'react'
import { Clock, Zap, AlertTriangle } from 'lucide-react'

interface MintTimerProps {
  // For default price NFTs
  isDefaultPrice?: boolean
  mintedSupply?: number
  triggerSupply?: number // At what supply count the 48h timer starts (default 1000)
  
  // For custom price NFTs
  mintEndTime?: string // ISO string
  
  // General props
  className?: string
}

export default function MintTimer({ 
  isDefaultPrice = true, 
  mintedSupply = 0, 
  triggerSupply = 1000,
  mintEndTime,
  className = '' 
}: MintTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  } | null>(null)
  const [isFinalized, setIsFinalized] = useState(false)

  useEffect(() => {
    if (isDefaultPrice) {
      // Default price logic: no timer until triggerSupply mints, then 48h countdown
      if (mintedSupply >= triggerSupply) {
        // 48h timer is active - unlimited minting during this period
        // Simulate 48h timer from when triggerSupply-th NFT was minted
        const now = new Date()
        const finalizeTime = new Date(now.getTime() + 48 * 60 * 60 * 1000) // 48 hours from now
        
        const updateTimer = () => {
          const now = new Date()
          const difference = finalizeTime.getTime() - now.getTime()
          
          if (difference <= 0) {
            setIsFinalized(true)
            setTimeLeft(null)
            return
          }
          
          const days = Math.floor(difference / (1000 * 60 * 60 * 24))
          const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((difference % (1000 * 60)) / 1000)
          
          setTimeLeft({ days, hours, minutes, seconds })
        }
        
        updateTimer()
        const interval = setInterval(updateTimer, 1000)
        return () => clearInterval(interval)
      }
    } else {
      // Custom price logic: timer based on mintEndTime
      if (!mintEndTime) return
      
      const updateTimer = () => {
        const now = new Date()
        const endTime = new Date(mintEndTime)
        const difference = endTime.getTime() - now.getTime()
        
        if (difference <= 0) {
          setIsFinalized(true)
          setTimeLeft(null)
          return
        }
        
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)
        
        setTimeLeft({ days, hours, minutes, seconds })
      }
      
      updateTimer()
      const interval = setInterval(updateTimer, 1000)
      return () => clearInterval(interval)
    }
  }, [isDefaultPrice, mintedSupply, triggerSupply, mintEndTime])

  if (isFinalized) {
    return (
      <div className={`bg-red-500/10 border border-red-500/20 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <AlertTriangle size={20} className="text-red-400 flex-shrink-0" />
          <div>
            <div className="text-red-400 font-medium">Minting Ended</div>
            <div className="text-text-secondary text-sm">This NFT is no longer available for minting</div>
          </div>
        </div>
      </div>
    )
  }

  if (isDefaultPrice && mintedSupply < triggerSupply) {
    return (
      <div className={`bg-green-500/10 border border-green-500/20 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <Zap size={20} className="text-green-400 flex-shrink-0" />
          <div>
            <div className="text-green-400 font-medium">Unlimited Time</div>
            <div className="text-text-secondary text-sm">
              No time limit until {triggerSupply.toLocaleString()} NFTs are minted
            </div>
            <div className="text-text-secondary text-xs mt-1">
              {mintedSupply.toLocaleString()} / {triggerSupply.toLocaleString()} minted
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!timeLeft) {
    return null
  }

  const isUrgent = timeLeft.days === 0 && timeLeft.hours < 24
  const totalHours = timeLeft.days * 24 + timeLeft.hours

  return (
    <div className={`${
      isUrgent 
        ? 'bg-red-500/10 border border-red-500/20' 
        : 'bg-blue-500/10 border border-blue-500/20'
    } rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <Clock size={20} className={`${isUrgent ? 'text-red-400' : 'text-blue-400'} flex-shrink-0`} />
        <div className="flex-1">
          <div className={`${isUrgent ? 'text-red-400' : 'text-blue-400'} font-medium`}>
            {isDefaultPrice ? 'Final 48 Hours' : 'Mint Ends In'}
          </div>
          <div className="flex items-center gap-4 mt-1">
            {timeLeft.days > 0 && (
              <div className="text-center">
                <div className="text-text-primary font-bold text-lg">{timeLeft.days}</div>
                <div className="text-text-secondary text-xs">Days</div>
              </div>
            )}
            <div className="text-center">
              <div className="text-text-primary font-bold text-lg">{timeLeft.hours}</div>
              <div className="text-text-secondary text-xs">Hours</div>
            </div>
            <div className="text-center">
              <div className="text-text-primary font-bold text-lg">{timeLeft.minutes}</div>
              <div className="text-text-secondary text-xs">Min</div>
            </div>
            <div className="text-center">
              <div className="text-text-primary font-bold text-lg">{timeLeft.seconds}</div>
              <div className="text-text-secondary text-xs">Sec</div>
            </div>
          </div>
          {isDefaultPrice && (
            <div className="text-text-secondary text-xs mt-2">
              {mintedSupply.toLocaleString()} minted • Final countdown active • No supply limit during final 48h
            </div>
          )}
        </div>
      </div>
    </div>
  )
}