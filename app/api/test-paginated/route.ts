import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    console.log('Test Paginated API: Starting...');
    
    // Test getMarketsPaginated
    console.log('Test Paginated API: Testing getMarketsPaginated...');
    const result = await DatabaseService.getMarketsPaginated(1, 5);
    console.log('Test Paginated API: Result:', result);
    
    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Test Paginated API Error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { error: 'Test Paginated API failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
