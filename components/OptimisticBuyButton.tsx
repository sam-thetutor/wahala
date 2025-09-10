'use client'

import React, { useState } from 'react'
import { useOptimisticSharePurchase } from '@/hooks/useOptimisticSharePurchase'

interface OptimisticBuyButtonProps {
  marketId: string
  amount: string
  side: 'yes' | 'no'
  className?: string
  disabled?: boolean
  onRefreshTrigger?: (trigger: number) => void
}

export const OptimisticBuyButton: React.FC<OptimisticBuyButtonProps> = ({ 
  marketId, 
  amount, 
  side, 
  className = '',
  disabled = false,
  onRefreshTrigger
}) => {
  const { buyShares, isPending, error, isMarketAvailable, refreshTrigger } = useOptimisticSharePurchase(marketId)
  const [isClicked, setIsClicked] = useState(false)

  // Notify parent when refresh trigger changes
  React.useEffect(() => {
    if (refreshTrigger > 0 && onRefreshTrigger) {
      onRefreshTrigger(refreshTrigger)
    }
  }, [refreshTrigger, onRefreshTrigger])

  const handleClick = async () => {
    console.log('🔘 Buy button clicked:', { marketId, amount, side, isPending, disabled, isMarketAvailable })
    
    if (isPending || disabled || !isMarketAvailable) {
      console.log('❌ Button click ignored - pending, disabled, or market unavailable')
      return
    }

    setIsClicked(true)
    try {
      console.log('🚀 Calling buyShares...')
      await buyShares(amount, side)
      console.log('✅ buyShares completed')
    } catch (error) {
      console.error('❌ Error in buyShares:', error)
    } finally {
      // Reset click state after a short delay
      setTimeout(() => setIsClicked(false), 1000)
    }
  }

  const getButtonText = () => {
    if (!isMarketAvailable) return 'Market Ended'
    if (isPending) return isClicked ? 'Processing...' : 'Syncing...'
    return `Buy ${side.toUpperCase()}`
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending || disabled || !isMarketAvailable}
      className={`
        buy-button 
        ${side === 'yes' ? 'buy-yes' : 'buy-no'} 
        ${isPending ? 'syncing' : ''} 
        ${isClicked ? 'clicked' : ''}
        ${disabled ? 'disabled' : ''}
        ${!isMarketAvailable ? 'market-ended' : ''}
        ${className}
      `}
    >
      <span className="button-text">{getButtonText()}</span>
      {isPending && <div className="loading-spinner" />}
      {error && <div className="error-indicator">!</div>}
    </button>
  )
}

export default OptimisticBuyButton
