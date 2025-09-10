import React, { useCallback } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { useNotificationHelpers } from './useNotificationHelpers'
import { parseEther } from 'viem'

const PREDICTION_MARKET_CORE_ABI = [
  {
    "inputs": [
      {"name": "marketId", "type": "uint256"},
      {"name": "outcome", "type": "bool"}
    ],
    "name": "buyShares",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"name": "marketId", "type": "uint256"}],
    "name": "getMarket",
    "outputs": [
      {
        "components": [
          {"name": "id", "type": "uint256"},
          {"name": "question", "type": "string"},
          {"name": "endTime", "type": "uint256"},
          {"name": "totalPool", "type": "uint256"},
          {"name": "totalYes", "type": "uint256"},
          {"name": "totalNo", "type": "uint256"},
          {"name": "status", "type": "uint8"},
          {"name": "outcome", "type": "bool"},
          {"name": "createdAt", "type": "uint256"},
          {"name": "creator", "type": "address"}
        ],
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const

import { getCoreContractAddress } from '@/lib/contract-addresses'
// OLD ADDRESS (commented out): 0x2D6614fe45da6Aa7e60077434129a51631AC702A

export const useOptimisticSharePurchase = (marketId: string) => {
  const { writeContract, isPending: isTransactionPending, error: writeError, data: hash } = useWriteContract()
  const { data: receipt, isError: isReceiptError, error: receiptError } = useWaitForTransactionReceipt({
    hash,
  })
  const { notifyTransactionSuccess, notifyTransactionFailed } = useNotificationHelpers()
  
  // State for triggering data refresh
  const [refreshTrigger, setRefreshTrigger] = React.useState(0)

  // Check market status
  const { data: marketData, error: marketError } = useReadContract({
    address: getCoreContractAddress(),
    abi: PREDICTION_MARKET_CORE_ABI,
    functionName: 'getMarket',
    args: [BigInt(marketId)],
  })

  const buyShares = useCallback(async (amount: string, side: 'yes' | 'no') => {
    console.log('🛒 buyShares called:', { marketId, amount, side })
    
    try {
      // Check market status first
      if (marketData) {
        const currentTime = Math.floor(Date.now() / 1000)
        const isActive = marketData.status === 0 // MarketStatus.ACTIVE = 0
        const isNotEnded = currentTime < Number(marketData.endTime)
        
        console.log('📊 Market status check:', {
          status: marketData.status,
          endTime: Number(marketData.endTime),
          currentTime,
          isActive,
          isNotEnded,
          canBuy: isActive && isNotEnded
        })
        
        if (!isActive) {
          throw new Error('Market is not active')
        }
        if (!isNotEnded) {
          throw new Error('Market has ended')
        }
      }
      
      // Convert amount to wei
      const amountWei = parseEther(amount)
      console.log('💰 Amount in wei:', amountWei.toString())
      
      // Execute transaction
      console.log('📝 Writing contract...')
      writeContract({
        address: getCoreContractAddress(),
        abi: PREDICTION_MARKET_CORE_ABI,
        functionName: 'buyShares',
        args: [BigInt(marketId), side === 'yes'],
        value: amountWei
      })

      console.log('⏳ Transaction submitted, waiting for confirmation...')
    } catch (error) {
      console.error('❌ Error in buyShares:', error)
      notifyTransactionFailed(`Failed to buy shares: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [marketId, marketData, writeContract, notifyTransactionFailed])

  // Handle transaction receipt
  React.useEffect(() => {
    if (receipt) {
      console.log('✅ Transaction confirmed:', receipt)
      notifyTransactionSuccess('Shares purchased successfully!')
      
      // Trigger data refresh after 6 seconds
      setTimeout(() => {
        console.log('🔄 Refreshing data from subgraph...')
        setRefreshTrigger(prev => prev + 1)
      }, 6000)
    }
  }, [receipt, notifyTransactionSuccess])

  // Handle transaction errors
  React.useEffect(() => {
    if (isReceiptError && receiptError) {
      console.error('❌ Transaction failed:', receiptError)
      notifyTransactionFailed(`Transaction failed: ${receiptError.message}`)
    }
  }, [isReceiptError, receiptError, notifyTransactionFailed])

  // Determine if market is available for buying
  const isMarketAvailable = React.useMemo(() => {
    if (!marketData) return true // Allow if we can't check status
    const currentTime = Math.floor(Date.now() / 1000)
    const isActive = marketData.status === 0 // MarketStatus.ACTIVE = 0
    const isNotEnded = currentTime < Number(marketData.endTime)
    return isActive && isNotEnded
  }, [marketData])

  return {
    buyShares,
    isPending: isTransactionPending,
    error: writeError,
    isMarketAvailable,
    marketData,
    refreshTrigger // Expose refresh trigger for components to use
  }
}
