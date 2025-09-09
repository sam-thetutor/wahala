import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { celo } from 'viem/chains'
import { PREDICTION_MARKET_CORE_ABI } from '@/contracts/contracts'
import { getCoreContractAddress } from '@/lib/contract-addresses'

const publicClient = createPublicClient({
  chain: celo,
  transport: http()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { marketId } = body

    if (!marketId) {
      return NextResponse.json(
        { error: 'Market ID is required' },
        { status: 400 }
      )
    }

    console.log(`🔍 Fetching market ${marketId} data from contract...`)

    // Fetch market data from the smart contract
    const marketData = await publicClient.readContract({
      address: getCoreContractAddress(),
      abi: PREDICTION_MARKET_CORE_ABI,
      functionName: 'getMarketData',
      args: [BigInt(marketId)]
    }) as any

    if (!marketData) {
      return NextResponse.json(
        { error: 'Market not found in contract' },
        { status: 404 }
      )
    }

    // Transform the contract data to our database format
    const transformedData = {
      id: marketId,
      question: marketData.question,
      description: marketData.description,
      category: marketData.category,
      image: marketData.image,
      source: marketData.source,
      endtime: marketData.endTime.toString(),
      totalpool: marketData.totalPool.toString(),
      totalyes: marketData.totalYes.toString(),
      totalno: marketData.totalNo.toString(),
      status: Number(marketData.status),
      outcome: marketData.outcome,
      createdat: marketData.createdAt.toString(),
      creator: marketData.creator
    }

    console.log(`✅ Fetched market data from contract:`, {
      id: transformedData.id,
      totalpool: transformedData.totalpool,
      totalyes: transformedData.totalyes,
      totalno: transformedData.totalno
    })

    return NextResponse.json({
      success: true,
      marketData: transformedData
    })

  } catch (error) {
    console.error('❌ Error fetching market from contract:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch market from contract',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
