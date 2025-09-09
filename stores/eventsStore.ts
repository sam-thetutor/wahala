'use client';

import { create } from 'zustand';
import { useMarketEvents } from '@/hooks/useMarketEvents';
import { eventFetcher, type ContractEvent } from '@/lib/eventFetcher';

export interface EventLog {
  id: string;
  eventName: string;
  args: any;
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
}

interface EventsStore {
  logs: EventLog[];
  isLoading: boolean;
  error: string | null;
  lastFetchedBlock: bigint;
  addLog: (log: EventLog) => void;
  fetchAllLogs: () => Promise<void>;
  fetchRecentLogs: () => Promise<void>;
  clearLogs: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getMarketEvents: (marketId: bigint) => Promise<EventLog[]>;
}

// Convert ContractEvent to EventLog
const convertContractEventToLog = (event: ContractEvent): EventLog => ({
  id: event.id,
  eventName: event.eventName,
  args: event.args,
  blockNumber: Number(event.blockNumber),
  transactionHash: event.transactionHash,
  timestamp: Number(event.blockTimestamp),
});

export const useEventsStore = create<EventsStore>((set, get) => ({
  logs: [],
  isLoading: false,
  error: null,
  lastFetchedBlock: 0n,

  addLog: (log: EventLog) => {
    set((state) => ({
      logs: [log, ...state.logs].slice(0, 1000) // Keep last 1000 events
    }));
  },

  fetchAllLogs: async () => {
    set({ isLoading: true, error: null });
    
    try {
      console.log('🔍 Fetching all events from smart contract deployment...');
      
      // Fetch all events from the smart contract deployment
      const contractEvents = await eventFetcher.getAllEventsFromDeployment();
      
      // Enrich with timestamps
      const enrichedEvents = await eventFetcher.enrichEventsWithTimestamps(contractEvents);
      
      // Convert to EventLog format
      const eventLogs = enrichedEvents.map(convertContractEventToLog);
      
      console.log(`✅ Fetched ${eventLogs.length} events from smart contract`);
      
      set({ 
        logs: eventLogs,
        isLoading: false,
        lastFetchedBlock: enrichedEvents.length > 0 ? enrichedEvents[enrichedEvents.length - 1].blockNumber : 0n
      });
    } catch (error) {
      console.error('❌ Error fetching events:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch events' 
      });
    }
  },

  fetchRecentLogs: async () => {
    set({ isLoading: true, error: null });
    
    try {
      console.log('🔍 Fetching recent events from smart contract...');
      
      // Fetch recent events (last 1000 blocks)
      const contractEvents = await eventFetcher.getRecentEvents();
      
      // Enrich with timestamps
      const enrichedEvents = await eventFetcher.enrichEventsWithTimestamps(contractEvents);
      
      // Convert to EventLog format
      const eventLogs = enrichedEvents.map(convertContractEventToLog);
      
      console.log(`✅ Fetched ${eventLogs.length} recent events from smart contract`);
      
      set((state) => ({
        logs: [...eventLogs, ...state.logs].slice(0, 1000), // Merge with existing and keep last 1000
        isLoading: false,
        lastFetchedBlock: enrichedEvents.length > 0 ? enrichedEvents[enrichedEvents.length - 1].blockNumber : state.lastFetchedBlock
      }));
    } catch (error) {
      console.error('❌ Error fetching recent events:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch recent events' 
      });
    }
  },

  getMarketEvents: async (marketId: bigint) => {
    try {
      console.log(`🔍 Fetching events for market ${marketId}...`);
      
      // Fetch events for specific market
      const contractEvents = await eventFetcher.getMarketEvents(marketId);
      
      // Enrich with timestamps
      const enrichedEvents = await eventFetcher.enrichEventsWithTimestamps(contractEvents);
      
      // Convert to EventLog format
      const eventLogs = enrichedEvents.map(convertContractEventToLog);
      
      console.log(`✅ Fetched ${eventLogs.length} events for market ${marketId}`);
      
      return eventLogs;
    } catch (error) {
      console.error(`❌ Error fetching events for market ${marketId}:`, error);
      return [];
    }
  },

  clearLogs: () => {
    set({ logs: [] });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  }
}));

// Hook to connect market events to the store
export const useMarketEventsWithStore = () => {
  const { addLog } = useEventsStore();
  
  useMarketEvents({
    onMarketCreated: (event) => {
      addLog({
        id: `market-created-${Date.now()}`,
        eventName: 'MarketCreated',
        args: event,
        blockNumber: 0, // Would be filled from actual event
        transactionHash: '', // Would be filled from actual event
        timestamp: Math.floor(Date.now() / 1000)
      });
    },
    onSharesBought: (event) => {
      addLog({
        id: `shares-bought-${Date.now()}`,
        eventName: 'SharesBought',
        args: event,
        blockNumber: 0,
        transactionHash: '',
        timestamp: Math.floor(Date.now() / 1000)
      });
    },
    onMarketResolved: (event) => {
      addLog({
        id: `market-resolved-${Date.now()}`,
        eventName: 'MarketResolved',
        args: event,
        blockNumber: 0,
        transactionHash: '',
        timestamp: Math.floor(Date.now() / 1000)
      });
    },
    onWinningsClaimed: (event) => {
      addLog({
        id: `winnings-claimed-${Date.now()}`,
        eventName: 'WinningsClaimed',
        args: event,
        blockNumber: 0,
        transactionHash: '',
        timestamp: Math.floor(Date.now() / 1000)
      });
    }
  });
};
