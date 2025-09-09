import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database'
import { parseEther } from 'viem'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { marketId, address, outcome, amount, transactionHash } = body

    if (!marketId || !address || outcome === undefined || !amount || !transactionHash) {
      return NextResponse.json(
        { error: 'Missing required fields: marketId, address, outcome, amount, transactionHash' },
        { status: 400 }
      )
    }

    console.log(`🔄 Updating participant data for market ${marketId}, address ${address}`)

    // Get current participant data
    const participants = await DatabaseService.getMarketParticipants(marketId.toString())
    const existingParticipant = participants.find(p => p.address === address)

    // Calculate new totals
    const amountWei = parseEther(amount)
    let newYesShares = '0'
    let newNoShares = '0'
    let newTotalInvestment = '0'

    if (existingParticipant) {
      const currentYesShares = BigInt(existingParticipant.totalyesshares)
      const currentNoShares = BigInt(existingParticipant.totalnoshares)
      const currentInvestment = BigInt(existingParticipant.totalinvestment)

      if (outcome) {
        // Bought YES shares
        newYesShares = (currentYesShares + amountWei).toString()
        newNoShares = existingParticipant.totalnoshares
      } else {
        // Bought NO shares
        newYesShares = existingParticipant.totalyesshares
        newNoShares = (currentNoShares + amountWei).toString()
      }

      newTotalInvestment = (currentInvestment + amountWei).toString()
    } else {
      // New participant
      if (outcome) {
        newYesShares = amountWei.toString()
        newNoShares = '0'
      } else {
        newYesShares = '0'
        newNoShares = amountWei.toString()
      }
      newTotalInvestment = amountWei.toString()
    }

    // Update participant data
    const participant = await DatabaseService.updateParticipantShares(
      marketId.toString(),
      address,
      newYesShares,
      newNoShares,
      newTotalInvestment,
      transactionHash
    )

    console.log(`✅ Participant data updated:`, {
      marketId,
      address,
      totalYesShares: newYesShares,
      totalNoShares: newNoShares,
      totalInvestment: newTotalInvestment
    })

    return NextResponse.json({
      success: true,
      participant,
      message: 'Participant data updated successfully'
    })

  } catch (error) {
    console.error('Error updating participant:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update participant data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
