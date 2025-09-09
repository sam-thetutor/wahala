import { NextRequest, NextResponse } from 'next/server'
import { marketCreationService, CreateMarketParams } from '@/lib/marketCreation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { question, endTime, description, category, image, source } = body

    // Validate required fields
    if (!question || !endTime || !description || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: question, endTime, description, category' },
        { status: 400 }
      )
    }

    const params: CreateMarketParams = {
      question: question.trim(),
      endTime: parseInt(endTime),
      description: description.trim(),
      category: category.trim(),
      image: image?.trim() || '',
      source: source?.trim() || ''
    }

    // Validate parameters
    const validation = marketCreationService.validateMarketParams(params)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    // Create transaction data for the frontend to sign
    const transactionData = await marketCreationService.createMarketTransaction(params)

    // Estimate gas cost
    const gasEstimate = await marketCreationService.estimateGas(params, '0x0000000000000000000000000000000000000000')

    return NextResponse.json({
      success: true,
      transactionData,
      gasEstimate: gasEstimate.toString(),
      estimatedCost: await marketCreationService.getMarketCreationCost()
    })

  } catch (error) {
    console.error('Error creating market transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create market transaction' },
      { status: 500 }
    )
  }
}







