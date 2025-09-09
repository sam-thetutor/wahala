import { useCallback, useEffect, useState } from 'react';
import { useWatchContractEvent } from 'wagmi';
import { PREDICTION_MARKET_CORE_ABI, PREDICTION_MARKET_CLAIMS_ABI } from '@/contracts/contracts';
import { MarketCreatedEvent, SharesBoughtEvent, MarketResolvedEvent, WinningsClaimedEvent } from '@/contracts/contracts';

// Contract addresses for Celo mainnet
import { getCoreContractAddress, getClaimsContractAddress } from '@/lib/contract-addresses';
// OLD ADDRESSES (commented out):
// PREDICTION_MARKET_ADDRESS: 0x2D6614fe45da6Aa7e60077434129a51631AC702A
// PREDICTION_MARKET_CLAIMS_ADDRESS: 0xA8479E513D8643001285D9AF6277602B20676B95

interface MarketEventHandlers {
  onMarketCreated?: (event: MarketCreatedEvent) => void;
  onSharesBought?: (event: SharesBoughtEvent) => void;
  onMarketResolved?: (event: MarketResolvedEvent) => void;
  onWinningsClaimed?: (event: WinningsClaimedEvent) => void;
}

interface MarketEventState {
  isListening: boolean;
  error: string | null;
  lastEvent: any | null;
  eventCount: number;
}

export function useMarketEvents(handlers: MarketEventHandlers = {}) {
  const [eventState, setEventState] = useState<MarketEventState>({
    isListening: false,
    error: null,
    lastEvent: null,
    eventCount: 0
  });

  // Update event state
  const updateEventState = useCallback((updates: Partial<MarketEventState>) => {
    setEventState(prev => ({ ...prev, ...updates }));
  }, []);

  // Handle market created events
  useWatchContractEvent({
    address: getCoreContractAddress(),
    abi: PREDICTION_MARKET_CORE_ABI,
    eventName: 'MarketCreated',
    chainId: 42220,
    onLogs: (logs) => {
      updateEventState({ 
        isListening: true, 
        lastEvent: logs[0], 
        eventCount: eventState.eventCount + 1 
      });
      
      logs.forEach(log => {
        const event: MarketCreatedEvent = {
          marketId: (log as any).args.marketId,
          creator: (log as any).args.creator,
          question: (log as any).args.question,
          category: '', // Not available in this event
          endTime: (log as any).args.endTime
        };
        handlers.onMarketCreated?.(event);
      });
    },
    onError: (error) => {
      updateEventState({ error: error.message });
    }
  });

  // Handle shares bought events
  useWatchContractEvent({
    address: getCoreContractAddress(),
    abi: PREDICTION_MARKET_CORE_ABI,
    eventName: 'SharesBought',
    chainId: 42220,
    onLogs: (logs) => {
      updateEventState({ 
        isListening: true, 
        lastEvent: logs[0], 
        eventCount: eventState.eventCount + 1 
      });
      
      logs.forEach(log => {
        const event: SharesBoughtEvent = {
          marketId: (log as any).args.marketId,
          buyer: (log as any).args.buyer,
          isYesShares: (log as any).args.isYesShares,
          amount: (log as any).args.amount
        };
        handlers.onSharesBought?.(event);
      });
    },
    onError: (error) => {
      updateEventState({ error: error.message });
    }
  });

  // Handle market resolved events
  useWatchContractEvent({
    address: getCoreContractAddress(),
    abi: PREDICTION_MARKET_CORE_ABI,
    eventName: 'MarketResolved',
    chainId: 42220,
    onLogs: (logs) => {
      updateEventState({ 
        isListening: true, 
        lastEvent: logs[0], 
        eventCount: eventState.eventCount + 1 
      });
      
      logs.forEach(log => {
        const event: MarketResolvedEvent = {
          marketId: (log as any).args.marketId,
          resolver: (log as any).args.resolver,
          outcome: (log as any).args.outcome
        };
        handlers.onMarketResolved?.(event);
      });
    },
    onError: (error) => {
      updateEventState({ error: error.message });
    }
  });

  // Handle winnings claimed events
  useWatchContractEvent({
    address: getClaimsContractAddress(),
    abi: PREDICTION_MARKET_CLAIMS_ABI,
    eventName: 'WinningsClaimed',
    chainId: 42220,
    onLogs: (logs) => {
      updateEventState({ 
        isListening: true, 
        lastEvent: logs[0], 
        eventCount: eventState.eventCount + 1 
      });
      
      logs.forEach(log => {
        const event: WinningsClaimedEvent = {
          marketId: (log as any).args.marketId,
          user: (log as any).args.user,
          amount: (log as any).args.amount
        };
        handlers.onWinningsClaimed?.(event);
      });
    },
    onError: (error) => {
      updateEventState({ error: error.message });
    }
  });

  // Clear error
  const clearError = useCallback(() => {
    updateEventState({ error: null });
  }, [updateEventState]);

  // Reset state
  const resetState = useCallback(() => {
    updateEventState({
      isListening: false,
      error: null,
      lastEvent: null,
      eventCount: 0
    });
  }, [updateEventState]);

  return {
    ...eventState,
    clearError,
    resetState
  };
}

// Hook for listening to specific market events
export function useMarketEventsForMarket(marketId: number, handlers: MarketEventHandlers = {}) {
  const [eventState, setEventState] = useState<MarketEventState>({
    isListening: false,
    error: null,
    lastEvent: null,
    eventCount: 0
  });

  const updateEventState = useCallback((updates: Partial<MarketEventState>) => {
    setEventState(prev => ({ ...prev, ...updates }));
  }, []);

  // Handle shares bought events for specific market
  useWatchContractEvent({
    address: getCoreContractAddress(),
    abi: PREDICTION_MARKET_CORE_ABI,
    eventName: 'SharesBought',
    args: {
      marketId: BigInt(marketId)
    },
    chainId: 42220,
    onLogs: (logs) => {
      updateEventState({ 
        isListening: true, 
        lastEvent: logs[0], 
        eventCount: eventState.eventCount + 1 
      });
      
      logs.forEach(log => {
        const event: SharesBoughtEvent = {
          marketId: (log as any).args.marketId,
          buyer: (log as any).args.buyer,
          isYesShares: (log as any).args.isYesShares,
          amount: (log as any).args.amount
        };
        handlers.onSharesBought?.(event);
      });
    },
    onError: (error) => {
      updateEventState({ error: error.message });
    }
  });

  // Handle market resolved events for specific market
  useWatchContractEvent({
    address: getCoreContractAddress(),
    abi: PREDICTION_MARKET_CORE_ABI,
    eventName: 'MarketResolved',
    args: {
      marketId: BigInt(marketId)
    },
    chainId: 42220,
    onLogs: (logs) => {
      updateEventState({ 
        isListening: true, 
        lastEvent: logs[0], 
        eventCount: eventState.eventCount + 1 
      });
      
      logs.forEach(log => {
        const event: MarketResolvedEvent = {
          marketId: (log as any).args.marketId,
          resolver: (log as any).args.resolver,
          outcome: (log as any).args.outcome
        };
        handlers.onMarketResolved?.(event);
      });
    },
    onError: (error) => {
      updateEventState({ error: error.message });
    }
  });

  const clearError = useCallback(() => {
    updateEventState({ error: null });
  }, [updateEventState]);

  const resetState = useCallback(() => {
    updateEventState({
      isListening: false,
      error: null,
      lastEvent: null,
      eventCount: 0
    });
  }, [updateEventState]);

  return {
    ...eventState,
    clearError,
    resetState
  };
}
