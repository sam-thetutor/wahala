import { createPublicClient, http, parseEventLogs } from 'viem'
import { celo } from 'viem/chains'
import { PREDICTION_MARKET_CORE_ABI } from '@/contracts/contracts'
import { getCoreContractAddress } from '@/lib/contract-addresses'

const publicClient = createPublicClient({
  chain: celo,
  transport: http()
})

export async function extractMarketIdFromTransaction(txHash: string): Promise<number | null> {
  try {
    console.log(`🔍 Extracting market ID from transaction: ${txHash}`)
    
    // Get transaction receipt
    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash as `0x${string}`
    })

    if (!receipt) {
      console.error('❌ Transaction receipt not found')
      return null
    }

    // Parse MarketCreated events from the transaction
    const logs = parseEventLogs({
      abi: PREDICTION_MARKET_CORE_ABI,
      logs: receipt.logs,
      eventName: 'MarketCreated'
    })

    if (logs.length === 0) {
      console.error('❌ No MarketCreated event found in transaction')
      return null
    }

    const marketCreatedLog = logs[0]
    const marketId = Number((marketCreatedLog as any).args.marketId)
    
    console.log(`✅ Extracted market ID: ${marketId}`)
    return marketId

  } catch (error) {
    console.error('❌ Error extracting market ID from transaction:', error)
    return null
  }
}

export async function getMarketCount(): Promise<number> {
  try {
    const count = await publicClient.readContract({
      address: getCoreContractAddress(),
      abi: PREDICTION_MARKET_CORE_ABI,
      functionName: 'getMarketCount'
    })

    return Number(count)
  } catch (error) {
    console.error('❌ Error getting market count:', error)
    return 0
  }
}
