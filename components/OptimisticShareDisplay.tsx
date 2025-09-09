'use client'

import React from 'react'
import { useOptimisticShares } from '@/hooks/useOptimisticShares'
import { formatEther } from 'viem'

interface OptimisticShareDisplayProps {
  marketId: string
  className?: string
}

export const OptimisticShareDisplay: React.FC<OptimisticShareDisplayProps> = ({ 
  marketId, 
  className = '' 
}) => {
  const { userShares, isPending } = useOptimisticShares(marketId)

  if (!userShares) {
    return (
      <div className={`shares-display ${className}`}>
        <div className="text-gray-500">No shares yet</div>
      </div>
    )
  }

  // Safety check for proper data structure
  if (typeof userShares !== 'object' || !userShares.totalInvestment || !userShares.yesShares || !userShares.noShares) {
    return (
      <div className={`shares-display ${className}`}>
        <div className="text-gray-500">Loading shares...</div>
      </div>
    )
  }

  const totalInvestment = formatEther(BigInt(userShares.totalInvestment))
  const yesShares = formatEther(BigInt(userShares.yesShares))
  const noShares = formatEther(BigInt(userShares.noShares))

  return (
    <div className={`shares-display ${className} ${isPending ? 'syncing' : ''}`}>
      <div className="shares-summary">
        <div className="total-investment">
          <span className="label">Total Investment:</span>
          <span className="value">{totalInvestment} ETH</span>
          {isPending && <span className="syncing-indicator">Syncing...</span>}
        </div>
        
        <div className="shares-breakdown">
          <div className="yes-shares">
            <span className="label">YES:</span>
            <span className="value">{yesShares} ETH</span>
          </div>
          <div className="no-shares">
            <span className="label">NO:</span>
            <span className="value">{noShares} ETH</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OptimisticShareDisplay
