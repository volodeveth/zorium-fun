'use client'

import { useEarlyBirdNotification } from '@/hooks/useEarlyBirdNotification'
import EarlyBirdNotification from './EarlyBirdNotification'

export default function EarlyBirdWrapper() {
  const { 
    showNotification, 
    hideNotification, 
    earlyBirdStatus 
  } = useEarlyBirdNotification()

  return (
    <EarlyBirdNotification
      isVisible={showNotification}
      amount={earlyBirdStatus.amount}
      onClose={hideNotification}
    />
  )
}