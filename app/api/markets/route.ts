import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

interface MarketData {
  id: string;
  question: string;
  endtime: string;
  totalpool: string;
  totalyes: string;
  totalno: string;
  status: number;
  outcome: boolean;
  createdat: string;
  creator: string;
  description: string;
  category: string;
  image: string;
  source: string;
}

export async function GET(request: NextRequest) {
  try {
    console.log('API: Starting markets fetch...');
    console.log('API: Environment variables check:');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const sortBy = searchParams.get('sortBy') || 'newest';
    const status = searchParams.get('status') || '';

    console.log('API: Fetching markets with params:', { page, limit, search, category, sortBy, status });

    // Test database connection first
    console.log('API: Testing database connection...');
    const testMarkets = await DatabaseService.getAllMarkets();
    console.log('API: Test markets count:', testMarkets.length);

    // Get paginated markets from database
    const { markets, pagination } = await DatabaseService.getMarketsPaginated(
      page,
      limit,
      search,
      category,
      sortBy,
      status
    );

    console.log('API: Markets fetched:', markets?.length || 0);

    // Get categories and stats
    const [categories, stats] = await Promise.all([
      DatabaseService.getCategories(),
      DatabaseService.getMarketStats()
    ]);

    console.log('API: Categories and stats fetched');

    return NextResponse.json({
      markets,
      pagination,
      categories,
      stats
    });

  } catch (error) {
    console.error('API Error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: 'Failed to fetch markets data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

