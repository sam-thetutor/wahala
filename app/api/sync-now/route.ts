import { NextResponse } from 'next/server';
import { EventListener } from '@/lib/eventListener';

// Manual sync endpoint for immediate testing
export async function GET() {
  console.log('🔄 Manual sync: Starting market sync...');
  
  try {
    const eventListener = new EventListener();
    
    // Start listening and check for new events
    if (!eventListener.isListening) {
      await eventListener.startListening();
    }
    
    // Check for new events
    await eventListener.checkForNewEvents();
    
    console.log('✅ Manual sync: Market sync completed');
    
    return NextResponse.json({
      success: true,
      message: 'Market sync completed successfully',
      isListening: eventListener.isListening,
      lastProcessedBlock: eventListener.lastProcessedBlock,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error: any) {
    console.error('❌ Manual sync error:', error);
    
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
