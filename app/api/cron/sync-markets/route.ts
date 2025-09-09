import { NextResponse } from 'next/server';
import { EventListener } from '@/lib/eventListener';

// This API route is designed to be called by Vercel Cron Jobs
// It will check for new markets and sync them to the database
export async function GET() {
  console.log('🕐 Cron job: Checking for new markets...');
  
  try {
    const eventListener = new EventListener();
    
    // Check for new events (this will sync any new markets)
    await eventListener.checkForNewEvents();
    
    console.log('✅ Cron job: Market sync completed');
    
    return NextResponse.json({
      success: true,
      message: 'Market sync completed',
      timestamp: new Date().toISOString(),
    });
    
  } catch (error: any) {
    console.error('❌ Cron job error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync markets',
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
