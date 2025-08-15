'use client'

import { useState, useRef, useEffect } from 'react'
import { Gift, Coins, Star, Trophy, Zap, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Prize {
  id: number
  amount: string
  color: string
  icon: typeof Gift
}

interface WheelSpinnerProps {
  prizes: Prize[]
  onSpinComplete?: (prize: Prize) => void
  disabled?: boolean
  spinning?: boolean
  onSpin?: () => boolean | void
}

export default function WheelSpinner({ 
  prizes, 
  onSpinComplete, 
  disabled = false, 
  spinning = false,
  onSpin
}: WheelSpinnerProps) {
  const [rotation, setRotation] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const wheelRef = useRef<HTMLDivElement>(null)

  // No auto-animation - user clicks to spin

  const handleSpin = async () => {
    console.log('handleSpin called', { disabled, spinning, isAnimating })
    if (disabled || spinning || isAnimating) {
      console.log('Spin blocked by state')
      return
    }
    
    // Check if spin is allowed
    if (onSpin) {
      const canSpin = onSpin()
      console.log('onSpin result:', canSpin)
      if (canSpin === false) {
        console.log('Spin blocked by onSpin')
        return
      }
    }
    
    console.log('Starting spin animation')
    setIsAnimating(true)

    // Calculate random final position
    const segmentAngle = 360 / prizes.length
    const randomSegment = Math.floor(Math.random() * prizes.length)
    
    // Add multiple full rotations for dramatic effect
    const extraRotations = 5 + Math.random() * 3 // 5-8 full rotations
    const totalRotations = extraRotations * 360
    
    // Calculate where the pointer should stop (top center = 0 degrees)
    // We want the selected segment to be at the top when stopped
    const segmentStart = randomSegment * segmentAngle
    const segmentCenter = segmentStart + segmentAngle / 2
    const finalRotation = rotation + totalRotations + (360 - segmentCenter)
    
    console.log('Spin calculation:', {
      randomSegment,
      segmentAngle,
      segmentStart,
      segmentCenter,
      finalRotation: finalRotation % 360,
      selectedPrize: prizes[randomSegment]
    })
    
    setRotation(finalRotation)

    // Wait for animation to complete
    setTimeout(() => {
      setIsAnimating(false)
      if (onSpinComplete) {
        onSpinComplete(prizes[randomSegment])
      }
    }, 4000) // Match the CSS transition duration
  }

  return (
    <div className="relative">
      {/* Wheel Container */}
      <div className="relative w-80 h-80">
        {/* Wheel */}
        <div 
          ref={wheelRef}
          className={cn(
            "w-full h-full rounded-full border-8 border-primary/20 relative cursor-pointer",
            "transition-transform duration-[4s] ease-out",
            (spinning || isAnimating) && "opacity-75"
          )}
          style={{ transform: `rotate(${rotation}deg)` }}
          onClick={handleSpin}
        >
          {/* Wheel Segments */}
          {prizes.map((prize, index) => {
            const segmentAngle = 360 / prizes.length
            const startAngle = segmentAngle * index
            const endAngle = segmentAngle * (index + 1)
            const IconComponent = prize.icon
            
            return (
              <div
                key={prize.id}
                className="absolute inset-0"
                style={{
                  background: `conic-gradient(from ${startAngle}deg, ${prize.color} 0deg, ${prize.color} ${segmentAngle}deg, transparent ${segmentAngle}deg)`,
                  clipPath: `polygon(50% 50%, ${50 + 45 * Math.cos((startAngle - 90) * Math.PI / 180)}% ${50 + 45 * Math.sin((startAngle - 90) * Math.PI / 180)}%, ${50 + 45 * Math.cos((endAngle - 90) * Math.PI / 180)}% ${50 + 45 * Math.sin((endAngle - 90) * Math.PI / 180)}%)`
                }}
              >
                {/* Prize Label */}
                <div 
                  className="absolute inset-0 flex items-center justify-center text-white font-bold"
                  style={{
                    transform: `rotate(${startAngle + segmentAngle / 2}deg)`,
                    transformOrigin: '50% 50%'
                  }}
                >
                  <div 
                    className="flex flex-col items-center"
                    style={{
                      transform: 'translateY(-80px)'
                    }}
                  >
                    <IconComponent className="w-5 h-5 mb-1" />
                    <span className="text-sm font-bold">{prize.amount}</span>
                    <span className="text-xs">ZRM</span>
                  </div>
                </div>
              </div>
            )
          })}
          
          {/* Center Circle */}
          <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-background border-4 border-primary rounded-full transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-10">
            {spinning || isAnimating ? (
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            ) : (
              <Gift className="w-8 h-8 text-primary" />
            )}
          </div>
        </div>

        {/* Pointer removed - user will focus on modal result */}

        {/* Glow Effect */}
        {(spinning || isAnimating) && (
          <div className="absolute inset-0 rounded-full animate-pulse">
            <div className="w-full h-full rounded-full bg-primary/20 blur-xl"></div>
          </div>
        )}
      </div>

      {/* Spin Instructions */}
      {!disabled && !spinning && !isAnimating && (
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center">
          <p className="text-sm text-muted-foreground">
            Click the wheel to spin!
          </p>
        </div>
      )}
    </div>
  )
}