import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { marketId, type, data } = body

    if (!marketId || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: marketId, type' },
        { status: 400 }
      )
    }

    let result

    switch (type) {
      case 'create':
        // Create new market in database
        result = await DatabaseService.upsertMarket(data)
        break

      case 'update_totals':
        // Update market totals after share purchase
        const { totalPool, totalYes, totalNo } = data
        result = await DatabaseService.updateMarketTotals(
          marketId,
          totalPool,
          totalYes,
          totalNo
        )
        break

      case 'resolve':
        // Mark market as resolved
        const { outcome } = data
        result = await DatabaseService.resolveMarket(marketId, outcome)
        break

      default:
        return NextResponse.json(
          { error: 'Invalid update type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      result,
      message: `Market ${type} completed successfully`
    })

  } catch (error) {
    console.error('Error updating market:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update market',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
