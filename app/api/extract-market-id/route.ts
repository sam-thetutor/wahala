import { NextRequest, NextResponse } from 'next/server'
import { extractMarketIdFromTransaction } from '@/lib/transaction-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transactionHash } = body

    if (!transactionHash) {
      return NextResponse.json(
        { error: 'Transaction hash is required' },
        { status: 400 }
      )
    }

    console.log(`🔍 Extracting market ID from transaction: ${transactionHash}`)

    const marketId = await extractMarketIdFromTransaction(transactionHash)

    if (marketId === null) {
      return NextResponse.json(
        { error: 'Failed to extract market ID from transaction' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      marketId: marketId.toString()
    })

  } catch (error) {
    console.error('Error extracting market ID:', error)
    return NextResponse.json(
      { 
        error: 'Failed to extract market ID',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

