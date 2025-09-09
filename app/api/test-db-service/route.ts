import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    console.log('Test DB Service API: Starting...');
    
    // Test getAllMarkets
    console.log('Test DB Service API: Testing getAllMarkets...');
    const markets = await DatabaseService.getAllMarkets();
    console.log('Test DB Service API: Found', markets.length, 'markets');
    
    if (markets.length > 0) {
      console.log('Test DB Service API: First market:', markets[0]);
    }
    
    return NextResponse.json({
      success: true,
      marketsCount: markets.length,
      firstMarket: markets[0] || null,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Test DB Service API Error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { error: 'Test DB Service API failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
