import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Market ID is required' },
        { status: 400 }
      )
    }

    console.log(`🔍 Fetching participants for market ${id}`)

    // Direct database query instead of using DatabaseService
    const { data: participants, error } = await supabase
      .from('market_participants')
      .select('*')
      .eq('marketid', id)
      .order('totalinvestment', { ascending: false })

    if (error) {
      console.error('Error fetching market participants:', error)
      throw error
    }

    console.log(`✅ Found ${participants?.length || 0} participants for market ${id}`)

    return NextResponse.json({
      success: true,
      participants: participants || [],
      count: participants?.length || 0
    })

  } catch (error) {
    console.error('Error fetching market participants:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch market participants',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
