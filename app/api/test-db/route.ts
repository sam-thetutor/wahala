import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    console.log('Test DB API: Starting...');
    
    // Create Supabase client directly
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('Test DB API: Testing direct Supabase connection...');
    
    // Test direct query
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('Test DB API: Supabase error:', error);
      return NextResponse.json(
        { error: 'Database error', details: error },
        { status: 500 }
      );
    }
    
    console.log('Test DB API: Success! Found', data?.length || 0, 'markets');
    
    return NextResponse.json({
      success: true,
      marketsCount: data?.length || 0,
      firstMarket: data?.[0] || null,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Test DB API Error:', error);
    return NextResponse.json(
      { error: 'Test DB API failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}