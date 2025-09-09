import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Test getAllMarkets (should have transformation)
    const allMarkets = await DatabaseService.getAllMarkets();
    
    // Test getMarketsPaginated (should have transformation)
    const { markets } = await DatabaseService.getMarketsPaginated(1, 2);
    
    return NextResponse.json({
      success: true,
      allMarketsSample: allMarkets.slice(0, 1),
      paginatedMarketsSample: markets.slice(0, 1),
      allMarketsKeys: allMarkets.length > 0 ? Object.keys(allMarkets[0]) : [],
      paginatedMarketsKeys: markets.length > 0 ? Object.keys(markets[0]) : [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Test Transformation API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to test transformation', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
