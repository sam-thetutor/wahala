import { useCallback, useRef } from 'react'
import { useAccount } from 'wagmi'
import { useParticipantStore, UserShares } from '@/lib/stores/participant-store'
import { parseEther, formatEther } from 'viem'

export const useOptimisticShares = (marketId: string) => {
  const { address } = useAccount()
  const { 
    updateUserShares, 
    revertUserShares, 
    setPendingUpdate, 
    clearPendingUpdate,
    getUserShares,
    pendingUpdates
  } = useParticipantStore()

  const originalSharesRef = useRef<UserShares | null>(null)

  const updateSharesOptimistically = useCallback((
    amount: string, 
    side: 'yes' | 'no'
  ) => {
    if (!address) return

    // Store original shares for potential revert
    const currentShares = getUserShares(marketId)
    originalSharesRef.current = currentShares || {
      yesShares: '0',
      noShares: '0',
      totalInvestment: '0',
      lastUpdated: Date.now()
    }

    // Calculate new shares
    const amountWei = parseEther(amount)
    const currentYesShares = BigInt(currentShares?.yesShares || '0')
    const currentNoShares = BigInt(currentShares?.noShares || '0')
    const currentTotalInvestment = BigInt(currentShares?.totalInvestment || '0')

    let newYesShares = currentYesShares
    let newNoShares = currentNoShares

    if (side === 'yes') {
      newYesShares = currentYesShares + amountWei
    } else {
      newNoShares = currentNoShares + amountWei
    }

    const newTotalInvestment = currentTotalInvestment + amountWei

    // Update UI instantly
    updateUserShares(marketId, {
      yesShares: newYesShares.toString(),
      noShares: newNoShares.toString(),
      totalInvestment: newTotalInvestment.toString(),
      isOptimistic: true
    })

    // Mark as pending
    setPendingUpdate(marketId, true)

    console.log(`🚀 Optimistic update: ${side} ${amount} ETH for market ${marketId}`)
  }, [address, marketId, updateUserShares, setPendingUpdate, getUserShares])

  const confirmUpdate = useCallback(() => {
    // Remove optimistic flag and pending status
    const currentShares = getUserShares(marketId)
    if (currentShares) {
      updateUserShares(marketId, {
        ...currentShares,
        isOptimistic: false
      })
    }
    clearPendingUpdate(marketId)
    originalSharesRef.current = null

    console.log(`✅ Confirmed update for market ${marketId}`)
  }, [marketId, updateUserShares, clearPendingUpdate, getUserShares])

  const revertUpdate = useCallback(() => {
    // Revert to original shares
    if (originalSharesRef.current) {
      revertUserShares(marketId, originalSharesRef.current)
    }
    clearPendingUpdate(marketId)
    originalSharesRef.current = null

    console.log(`🔄 Reverted update for market ${marketId}`)
  }, [marketId, revertUserShares, clearPendingUpdate])

  const isPending = pendingUpdates.has(marketId)
  const userShares = getUserShares(marketId)

  return {
    userShares,
    isPending,
    updateSharesOptimistically,
    confirmUpdate,
    revertUpdate
  }
}
