import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, parseAbi, decodeEventLog } from 'viem'
import { celo } from 'viem/chains'
import { DatabaseService } from '@/lib/database'
import { PREDICTION_MARKET_CORE_ABI } from '@/contracts/contracts'
import { getCoreContractAddress } from '@/lib/contract-addresses'

const PREDICTION_MARKET_ABI = parseAbi([
  'event SharesBought(uint256 indexed marketId, address indexed buyer, bool side, uint256 amount, uint256 totalYes, uint256 totalNo)',
  'event MarketCreated(uint256 indexed marketId, address indexed creator, string question, uint256 endTime, uint256 totalPool)'
])

const client = createPublicClient({
  chain: celo,
  transport: http('https://forno.celo.org')
})

export async function POST(request: NextRequest) {
  console.log('🚀 API route called - POST /api/markets/process-transaction')
  
  try {
    const body = await request.json()
    console.log('📥 Request body:', body)
    
    const { transactionHash, marketId } = body

    if (!transactionHash || !marketId) {
      console.log('❌ Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields: transactionHash, marketId' },
        { status: 400 }
      )
    }

    console.log(`🔄 Processing transaction ${transactionHash} for market ${marketId}`)

    // Fetch transaction receipt from blockchain
    const receipt = await client.getTransactionReceipt({
      hash: transactionHash as `0x${string}`
    })

    if (!receipt) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    console.log('📊 Transaction receipt fetched:', {
      status: receipt.status,
      blockNumber: receipt.blockNumber.toString(),
      logsCount: receipt.logs.length
    })

    // Parse the SharesBought event
    const sharesBoughtEvent = parseSharesBoughtEvent(receipt, marketId)
    
    if (!sharesBoughtEvent) {
      return NextResponse.json(
        { error: 'SharesBought event not found in transaction' },
        { status: 400 }
      )
    }

    console.log('📈 Parsed SharesBought event:', {
      marketId: sharesBoughtEvent.marketId.toString(),
      buyer: sharesBoughtEvent.buyer,
      side: sharesBoughtEvent.side,
      amount: sharesBoughtEvent.amount.toString(),
      totalYes: sharesBoughtEvent.totalYes.toString(),
      totalNo: sharesBoughtEvent.totalNo.toString()
    })

    // Update market totals
    let totalYes = sharesBoughtEvent.totalYes
    let totalNo = sharesBoughtEvent.totalNo
    
    // If we don't have totals from the event (manual decoding), fetch from contract
    if (totalYes === 0n && totalNo === 0n) {
      console.log('🔄 Fetching current market totals from contract...')
      try {
        const marketData = await client.readContract({
          address: getCoreContractAddress(),
          abi: PREDICTION_MARKET_CORE_ABI,
          functionName: 'getMarket',
          args: [BigInt(marketId)]
        }) as any
        
        totalYes = BigInt(marketData.totalYes.toString())
        totalNo = BigInt(marketData.totalNo.toString())
        
        console.log('✅ Fetched totals from contract:', {
          totalYes: totalYes.toString(),
          totalNo: totalNo.toString()
        })
      } catch (contractError) {
        console.error('❌ Error fetching market data from contract:', contractError)
        // Continue with 0 values - the database update will handle this
      }
    }
    
    await DatabaseService.updateMarketTotals(
      marketId.toString(),
      totalYes.toString(),
      totalNo.toString(),
      (totalYes + totalNo).toString()
    )

    console.log('✅ Market totals updated')

    // Update participant data
    const participant = await DatabaseService.updateParticipantShares(
      marketId.toString(),
      sharesBoughtEvent.buyer.toLowerCase(),
      sharesBoughtEvent.side ? sharesBoughtEvent.amount.toString() : '0',
      sharesBoughtEvent.side ? '0' : sharesBoughtEvent.amount.toString(),
      sharesBoughtEvent.amount.toString(),
      transactionHash
    )

    console.log('✅ Participant data updated:', {
      address: participant.address,
      totalInvestment: participant.totalinvestment,
      transactionCount: participant.transactionhashes?.length || 0
    })

    return NextResponse.json({
      success: true,
      message: 'Transaction processed successfully',
      data: {
        marketId: sharesBoughtEvent.marketId.toString(),
        buyer: sharesBoughtEvent.buyer,
        amount: sharesBoughtEvent.amount.toString(),
        side: sharesBoughtEvent.side ? 'YES' : 'NO',
        totalYes: sharesBoughtEvent.totalYes.toString(),
        totalNo: sharesBoughtEvent.totalNo.toString()
      }
    })

  } catch (error) {
    console.error('❌ Error processing transaction:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process transaction',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function parseSharesBoughtEvent(receipt: any, expectedMarketId: string) {
  console.log('🔍 parseSharesBoughtEvent called with:')
  console.log('- Expected market ID:', expectedMarketId)
  console.log('- Receipt logs count:', receipt.logs.length)
  
  // Find the SharesBought event in the transaction logs
  const sharesBoughtLog = receipt.logs.find((log: any) => {
    console.log('Checking log:', {
      address: log.address,
      topic0: log.topics[0],
      isOurContract: log.address.toLowerCase() === getCoreContractAddress().toLowerCase(),
      isStandardSharesBought: log.topics[0] === '0xdfc3df575591df09b1f214131575349702f567430580df7944e88be601f25db2',
      isAlternativeSharesBought: log.topics[0] === '0x3b8280c0b373e7d170b71b3cf420502d1edb6340a000ece87a2594c3db2ace80'
    })
    
    // Check if this log is from our contract and has a SharesBought-like event signature
    return log.address.toLowerCase() === getCoreContractAddress().toLowerCase() &&
           (log.topics[0] === '0xdfc3df575591df09b1f214131575349702f567430580df7944e88be601f25db2' || // Standard SharesBought
            log.topics[0] === '0x3b8280c0b373e7d170b71b3cf420502d1edb6340a000ece87a2594c3db2ace80') // Alternative SharesBought signature
  })

  if (!sharesBoughtLog) {
    console.log('❌ SharesBought event not found in transaction logs')
    return null
  }

  try {
    // Try to parse with standard ABI first
    const decoded = decodeEventLog({
      abi: PREDICTION_MARKET_ABI,
      data: sharesBoughtLog.data,
      topics: sharesBoughtLog.topics
    })

    const eventData = decoded as any

    // Verify this is for the correct market
    if (eventData.args.marketId.toString() !== expectedMarketId) {
      console.log(`❌ Event marketId (${eventData.args.marketId}) doesn't match expected (${expectedMarketId})`)
      return null
    }

    return {
      marketId: eventData.args.marketId,
      buyer: eventData.args.buyer,
      side: eventData.args.side,
      amount: eventData.args.amount,
      totalYes: eventData.args.totalYes,
      totalNo: eventData.args.totalNo
    }

  } catch (error) {
    console.log('⚠️ Standard ABI parsing failed, trying manual decoding...')
    
    // Manual decoding for alternative event signature
    try {
      // Extract data from topics and data
      const marketId = parseInt(sharesBoughtLog.topics[1], 16)
      const buyer = '0x' + sharesBoughtLog.topics[2].slice(-40)
      
      // Verify this is for the correct market
      if (marketId.toString() !== expectedMarketId) {
        console.log(`❌ Event marketId (${marketId}) doesn't match expected (${expectedMarketId})`)
        return null
      }
      
      // Parse data: side (bool) + amount (uint256)
      const side = sharesBoughtLog.data.slice(0, 66) === '0x0000000000000000000000000000000000000000000000000000000000000001'
      const amount = BigInt('0x' + sharesBoughtLog.data.slice(66))
      
      console.log('✅ Manually decoded event:', {
        marketId,
        buyer,
        side,
        amount: amount.toString()
      })
      
      // For manual decoding, we don't have totalYes/totalNo from the event
      // We'll need to fetch these from the contract or calculate them
      return {
        marketId: BigInt(marketId),
        buyer,
        side,
        amount,
        totalYes: 0n, // Will be updated by fetching from contract
        totalNo: 0n   // Will be updated by fetching from contract
      }
      
    } catch (manualError) {
      console.error('❌ Error in manual decoding:', manualError)
      return null
    }
  }
}
