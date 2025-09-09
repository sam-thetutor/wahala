import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    // Get raw data from Supabase
    const { data: rawData, error } = await supabase
      .from('markets')
      .select('*')
      .limit(1);

    if (error) {
      throw error;
    }

    // Manual transformation
    const transformedData = rawData?.map(market => ({
      id: market.id,
      question: market.question,
      endTime: market.endtime, // Transform from lowercase to camelCase
      totalPool: market.totalpool,
      totalYes: market.totalyes,
      totalNo: market.totalno,
      status: market.status,
      outcome: market.outcome,
      createdAt: market.createdat,
      creator: market.creator,
      description: market.description,
      category: market.category,
      image: market.image,
      source: market.source,
      updatedAt: market.updatedat
    })) || [];

    return NextResponse.json({
      success: true,
      rawData: rawData?.[0],
      transformedData: transformedData[0],
      rawKeys: rawData?.[0] ? Object.keys(rawData[0]) : [],
      transformedKeys: transformedData[0] ? Object.keys(transformedData[0]) : [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Debug DB API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to debug database', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
