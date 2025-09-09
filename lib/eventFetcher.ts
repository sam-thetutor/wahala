'use client';

import { createPublicClient, http, parseAbiItem, type Log } from 'viem';
import { celo } from 'viem/chains';
import { PREDICTION_MARKET_CORE_ABI, PREDICTION_MARKET_CLAIMS_ABI } from '@/contracts/contracts';

// Contract addresses
import { getCoreContractAddress, getClaimsContractAddress } from '@/lib/contract-addresses';
// OLD ADDRESSES (commented out):
// PREDICTION_MARKET_ADDRESS: 0x2D6614fe45da6Aa7e60077434129a51631AC702A
// PREDICTION_MARKET_CLAIMS_ADDRESS: 0xA8479E513D8643001285D9AF6277602B20676B95

// Create public client for Celo mainnet
const publicClient = createPublicClient({
  chain: celo,
  transport: http('https://forno.celo.org')
});

export interface ContractEvent {
  id: string;
  eventName: string;
  args: any;
  blockNumber: bigint;
  transactionHash: string;
  blockTimestamp: bigint;
  address: string;
}

export class EventFetcher {
  private static instance: EventFetcher;
  private cache: Map<string, ContractEvent[]> = new Map();
  private lastFetchedBlock: bigint = 0n;
  private deploymentBlock: bigint | null = null;

  static getInstance(): EventFetcher {
    if (!EventFetcher.instance) {
      EventFetcher.instance = new EventFetcher();
    }
    return EventFetcher.instance;
  }

  // Find the contract deployment block
  private async findDeploymentBlock(): Promise<bigint> {
    if (this.deploymentBlock) {
      return this.deploymentBlock;
    }

    try {
      const currentBlock = await publicClient.getBlockNumber();
      let deploymentBlock = null;
      
      // Binary search to find the deployment block
      let low = 0n;
      let high = currentBlock;
      
      while (low <= high) {
        const mid = (low + high) / 2n;
        
        try {
          const code = await publicClient.getCode({
            address: getCoreContractAddress(),
            blockNumber: mid
          });
          
          if (code && code !== '0x') {
            deploymentBlock = mid;
            high = mid - 1n;
          } else {
            low = mid + 1n;
          }
        } catch (error) {
          break;
        }
      }
      
      this.deploymentBlock = deploymentBlock || 0n;
      return this.deploymentBlock;
    } catch (error) {
      console.error('Error finding deployment block:', error);
      return 0n;
    }
  }

  // Fetch all market-related events
  async fetchAllEvents(fromBlock?: bigint, toBlock?: bigint): Promise<ContractEvent[]> {
    console.log('🔍 Fetching events from smart contract...');
    
    try {
      const events: ContractEvent[] = [];
      
      // Get current block number if not specified
      if (!toBlock) {
        toBlock = await publicClient.getBlockNumber();
      }
      
      if (!fromBlock) {
        // Use deployment block or last fetched block
        fromBlock = this.lastFetchedBlock || await this.findDeploymentBlock();
      }

      console.log(`📊 Fetching events from block ${fromBlock} to ${toBlock}`);

      // Fetch MarketCreated events
      const marketCreatedEvents = await this.fetchMarketCreatedEvents(fromBlock, toBlock);
      events.push(...marketCreatedEvents);

      // Fetch SharesBought events
      const sharesBoughtEvents = await this.fetchSharesBoughtEvents(fromBlock, toBlock);
      events.push(...sharesBoughtEvents);

      // Fetch SharesSold events
      const sharesSoldEvents = await this.fetchSharesSoldEvents(fromBlock, toBlock);
      events.push(...sharesSoldEvents);

      // Fetch MarketResolved events
      const marketResolvedEvents = await this.fetchMarketResolvedEvents(fromBlock, toBlock);
      events.push(...marketResolvedEvents);

      // Fetch WinningsClaimed events
      const winningsClaimedEvents = await this.fetchWinningsClaimedEvents(fromBlock, toBlock);
      events.push(...winningsClaimedEvents);

      // Fetch CreatorFeeClaimed events
      const creatorFeeClaimedEvents = await this.fetchCreatorFeeClaimedEvents(fromBlock, toBlock);
      events.push(...creatorFeeClaimedEvents);

      // Sort events by block number and timestamp
      events.sort((a, b) => {
        if (a.blockNumber !== b.blockNumber) {
          return Number(a.blockNumber - b.blockNumber);
        }
        return Number(a.blockTimestamp - b.blockTimestamp);
      });

      // Update last fetched block
      this.lastFetchedBlock = toBlock;

      console.log(`✅ Fetched ${events.length} events`);
      return events;

    } catch (error) {
      console.error('❌ Error fetching events:', error);
      throw error;
    }
  }

  // Fetch MarketCreated events
  private async fetchMarketCreatedEvents(fromBlock: bigint, toBlock: bigint): Promise<ContractEvent[]> {
    try {
      const logs = await publicClient.getLogs({
        address: getCoreContractAddress(),
        event: parseAbiItem('event MarketCreated(uint256 indexed marketId, address indexed creator, string question, string description, string source, uint256 endTime, uint256 creationFee)'),
        fromBlock,
        toBlock,
      });

      return logs.map((log, index) => ({
        id: `market-created-${log.blockNumber}-${index}`,
        eventName: 'MarketCreated',
        args: {
          marketId: (log.args as any).marketId,
          creator: (log.args as any).creator,
          question: (log.args as any).question,
          description: (log.args as any).description,
          source: (log.args as any).source,
          endTime: (log.args as any).endTime,
          creationFee: (log.args as any).creationFee,
        },
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        blockTimestamp: 0n, // Will be filled by getBlock
        address: log.address,
      }));
    } catch (error) {
      console.error('Error fetching MarketCreated events:', error);
      return [];
    }
  }

  // Fetch SharesBought events
  private async fetchSharesBoughtEvents(fromBlock: bigint, toBlock: bigint): Promise<ContractEvent[]> {
    try {
      const logs = await publicClient.getLogs({
        address: getCoreContractAddress(),
        event: parseAbiItem('event SharesBought(uint256 indexed marketId, address indexed buyer, uint256 shares, uint256 amount, bool isYes)'),
        fromBlock,
        toBlock,
      });

      return logs.map((log, index) => ({
        id: `shares-bought-${log.blockNumber}-${index}`,
        eventName: 'SharesBought',
        args: {
          marketId: (log.args as any).marketId,
          buyer: (log.args as any).buyer,
          shares: (log.args as any).shares,
          amount: (log.args as any).amount,
          isYes: (log.args as any).isYes,
        },
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        blockTimestamp: 0n,
        address: log.address,
      }));
    } catch (error) {
      console.error('Error fetching SharesBought events:', error);
      return [];
    }
  }

  // Fetch SharesSold events
  private async fetchSharesSoldEvents(fromBlock: bigint, toBlock: bigint): Promise<ContractEvent[]> {
    try {
      const logs = await publicClient.getLogs({
        address: getCoreContractAddress(),
        event: parseAbiItem('event SharesSold(uint256 indexed marketId, address indexed seller, uint256 shares, uint256 amount, bool isYes)'),
        fromBlock,
        toBlock,
      });

      return logs.map((log, index) => ({
        id: `shares-sold-${log.blockNumber}-${index}`,
        eventName: 'SharesSold',
        args: {
          marketId: (log.args as any).marketId,
          seller: (log.args as any).seller,
          shares: (log.args as any).shares,
          amount: (log.args as any).amount,
          isYes: (log.args as any).isYes,
        },
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        blockTimestamp: 0n,
        address: log.address,
      }));
    } catch (error) {
      console.error('Error fetching SharesSold events:', error);
      return [];
    }
  }

  // Fetch MarketResolved events
  private async fetchMarketResolvedEvents(fromBlock: bigint, toBlock: bigint): Promise<ContractEvent[]> {
    try {
      const logs = await publicClient.getLogs({
        address: getCoreContractAddress(),
        event: parseAbiItem('event MarketResolved(uint256 indexed marketId, address indexed resolver, bool outcome)'),
        fromBlock,
        toBlock,
      });

      return logs.map((log, index) => ({
        id: `market-resolved-${log.blockNumber}-${index}`,
        eventName: 'MarketResolved',
        args: {
          marketId: (log.args as any).marketId,
          resolver: (log.args as any).resolver,
          outcome: (log.args as any).outcome,
        },
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        blockTimestamp: 0n,
        address: log.address,
      }));
    } catch (error) {
      console.error('Error fetching MarketResolved events:', error);
      return [];
    }
  }

  // Fetch WinningsClaimed events
  private async fetchWinningsClaimedEvents(fromBlock: bigint, toBlock: bigint): Promise<ContractEvent[]> {
    try {
      const logs = await publicClient.getLogs({
        address: getClaimsContractAddress(),
        event: parseAbiItem('event WinningsClaimed(uint256 indexed marketId, address indexed claimant, uint256 amount)'),
        fromBlock,
        toBlock,
      });

      return logs.map((log, index) => ({
        id: `winnings-claimed-${log.blockNumber}-${index}`,
        eventName: 'WinningsClaimed',
        args: {
          marketId: (log.args as any).marketId,
          claimant: (log.args as any).claimant,
          amount: (log.args as any).amount,
        },
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        blockTimestamp: 0n,
        address: log.address,
      }));
    } catch (error) {
      console.error('Error fetching WinningsClaimed events:', error);
      return [];
    }
  }

  // Fetch CreatorFeeClaimed events
  private async fetchCreatorFeeClaimedEvents(fromBlock: bigint, toBlock: bigint): Promise<ContractEvent[]> {
    try {
      const logs = await publicClient.getLogs({
        address: getClaimsContractAddress(),
        event: parseAbiItem('event CreatorFeeClaimed(uint256 indexed marketId, address indexed creator, uint256 amount)'),
        fromBlock,
        toBlock,
      });

      return logs.map((log, index) => ({
        id: `creator-fee-claimed-${log.blockNumber}-${index}`,
        eventName: 'CreatorFeeClaimed',
        args: {
          marketId: (log.args as any).marketId,
          creator: (log.args as any).creator,
          amount: (log.args as any).amount,
        },
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        blockTimestamp: 0n,
        address: log.address,
      }));
    } catch (error) {
      console.error('Error fetching CreatorFeeClaimed events:', error);
      return [];
    }
  }

  // Get block timestamps for events
  async enrichEventsWithTimestamps(events: ContractEvent[]): Promise<ContractEvent[]> {
    const enrichedEvents = await Promise.all(
      events.map(async (event) => {
        try {
          const block = await publicClient.getBlock({
            blockNumber: event.blockNumber,
          });
          return {
            ...event,
            blockTimestamp: block.timestamp,
          };
        } catch (error) {
          console.error(`Error getting block ${event.blockNumber}:`, error);
          return event;
        }
      })
    );

    return enrichedEvents;
  }

  // Get recent events (last 1000 blocks)
  async getRecentEvents(): Promise<ContractEvent[]> {
    const currentBlock = await publicClient.getBlockNumber();
    const fromBlock = currentBlock - 1000n;
    return this.fetchAllEvents(fromBlock, currentBlock);
  }

  // Get all events from deployment
  async getAllEventsFromDeployment(): Promise<ContractEvent[]> {
    const deploymentBlock = await this.findDeploymentBlock();
    const currentBlock = await publicClient.getBlockNumber();
    return this.fetchAllEvents(deploymentBlock, currentBlock);
  }

  // Get events for a specific market
  async getMarketEvents(marketId: bigint): Promise<ContractEvent[]> {
    const allEvents = await this.fetchAllEvents();
    return allEvents.filter(event => 
      event.args.marketId === marketId || 
      event.args.marketId?.toString() === marketId.toString()
    );
  }
}

// Export singleton instance
export const eventFetcher = EventFetcher.getInstance();
