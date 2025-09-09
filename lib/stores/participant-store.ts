import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface UserShares {
  yesShares: string
  noShares: string
  totalInvestment: string
  lastUpdated: number
  isOptimistic?: boolean
}

export interface Participant {
  address: string
  yesShares: string
  noShares: string
  totalInvestment: string
  lastUpdated: number
  isOptimistic?: boolean
}

interface ParticipantState {
  // Map<marketId, Participant[]>
  participants: Map<string, Participant[]>
  // Map<marketId, UserShares> - for current user's shares
  userShares: Map<string, UserShares>
  // Set of marketIds with pending updates
  pendingUpdates: Set<string>
  
  // Actions
  updateUserShares: (marketId: string, shares: Partial<UserShares>) => void
  revertUserShares: (marketId: string, originalShares: UserShares) => void
  updateParticipant: (marketId: string, participant: Participant) => void
  setPendingUpdate: (marketId: string, isPending: boolean) => void
  clearPendingUpdate: (marketId: string) => void
  getUserShares: (marketId: string) => UserShares | null
  getMarketParticipants: (marketId: string) => Participant[]
}

export const useParticipantStore = create<ParticipantState>()(
  persist(
    (set, get) => ({
      participants: new Map(),
      userShares: new Map(),
      pendingUpdates: new Set(),

      updateUserShares: (marketId: string, shares: Partial<UserShares>) => {
        const currentShares = get().userShares.get(marketId) || {
          yesShares: '0',
          noShares: '0',
          totalInvestment: '0',
          lastUpdated: Date.now()
        }

        const updatedShares: UserShares = {
          ...currentShares,
          ...shares,
          lastUpdated: Date.now(),
          isOptimistic: true
        }

        set((state) => {
          const newUserShares = new Map(state.userShares)
          newUserShares.set(marketId, updatedShares)
          return { userShares: newUserShares }
        })
      },

      revertUserShares: (marketId: string, originalShares: UserShares) => {
        set((state) => {
          const newUserShares = new Map(state.userShares)
          newUserShares.set(marketId, {
            ...originalShares,
            isOptimistic: false
          })
          return { userShares: newUserShares }
        })
      },

      updateParticipant: (marketId: string, participant: Participant) => {
        set((state) => {
          const newParticipants = new Map(state.participants)
          const marketParticipants = newParticipants.get(marketId) || []
          
          const existingIndex = marketParticipants.findIndex(p => p.address === participant.address)
          
          if (existingIndex >= 0) {
            marketParticipants[existingIndex] = participant
          } else {
            marketParticipants.push(participant)
          }
          
          newParticipants.set(marketId, marketParticipants)
          return { participants: newParticipants }
        })
      },

      setPendingUpdate: (marketId: string, isPending: boolean) => {
        set((state) => {
          const newPendingUpdates = new Set(state.pendingUpdates)
          if (isPending) {
            newPendingUpdates.add(marketId)
          } else {
            newPendingUpdates.delete(marketId)
          }
          return { pendingUpdates: newPendingUpdates }
        })
      },

      clearPendingUpdate: (marketId: string) => {
        set((state) => {
          const newPendingUpdates = new Set(state.pendingUpdates)
          newPendingUpdates.delete(marketId)
          return { pendingUpdates: newPendingUpdates }
        })
      },

      getUserShares: (marketId: string) => {
        return get().userShares.get(marketId) || null
      },

      getMarketParticipants: (marketId: string) => {
        return get().participants.get(marketId) || []
      }
    }),
    {
      name: 'participant-store',
      partialize: (state) => ({
        userShares: Object.fromEntries(state.userShares),
        participants: Object.fromEntries(state.participants)
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert plain objects back to Maps after rehydration
          state.userShares = new Map(Object.entries(state.userShares as any))
          state.participants = new Map(Object.entries(state.participants as any))
          state.pendingUpdates = new Set()
        }
      }
    }
  )
)
