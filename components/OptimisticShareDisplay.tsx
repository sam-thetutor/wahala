'use client'

import React from 'react'
import { useSubgraphMarketDetails } from '@/hooks/useSubgraphMarketDetails'
import { useAccount } from 'wagmi'

interface OptimisticShareDisplayProps {
  marketId: string
  className?: string
}

export const OptimisticShareDisplay: React.FC<OptimisticShareDisplayProps> = ({ 
  marketId, 
  className = '' 
}) => {
  const { address } = useAccount()
  const { participants, participantsLoading } = useSubgraphMarketDetails({
    marketId: marketId || '',
    enabled: true
  })

  // Find current user's participation
  const userParticipation = participants.find(p => p.user.toLowerCase() === address?.toLowerCase())

  if (participantsLoading) {
    return (
      <div className={`shares-display ${className}`}>
        <div className="text-gray-500">Loading shares...</div>
      </div>
    )
  }

  if (!userParticipation) {
    return (
      <div className={`shares-display ${className}`}>
        <div className="text-gray-500">No shares yet</div>
      </div>
    )
  }

  const totalInvestment = parseFloat(userParticipation.totalInvestment || '0')
  const yesShares = parseFloat(userParticipation.totalYesShares || '0')
  const noShares = parseFloat(userParticipation.totalNoShares || '0')

  return (
    <div className={`shares-display ${className}`}>
      <div className="shares-summary">
        <div className="total-investment">
          <span className="label">Total Investment:</span>
          <span className="value">{totalInvestment.toFixed(4)} CELO</span>
        </div>
        
        <div className="shares-breakdown">
          <div className="yes-shares">
            <span className="label">YES:</span>
            <span className="value">{yesShares.toFixed(4)} CELO</span>
          </div>
          <div className="no-shares">
            <span className="label">NO:</span>
            <span className="value">{noShares.toFixed(4)} CELO</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OptimisticShareDisplay
