import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const activityType = searchParams.get('type');
    
    const skip = (page - 1) * limit;
    
    // Fetch user's market participations
    const { data: participations, error: participationsError } = await supabase
      .from('market_participants')
      .select('*')
      .eq('address', address.toLowerCase())
      .order('lastpurchaseat', { ascending: false })
      .range(skip, skip + limit - 1);
    
    if (participationsError) {
      console.error('Error fetching participations:', participationsError);
      throw participationsError;
    }
    
    // Fetch market details separately
    const marketIds = participations?.map(p => p.marketid) || [];
    let markets: any[] = [];
    if (marketIds.length > 0) {
      const { data: marketsData, error: marketsError } = await supabase
        .from('markets')
        .select('id, question, status, outcome, totalpool, totalyes, totalno, endtime, creator, createdat')
        .in('id', marketIds);
      
      if (marketsError) {
        console.error('Error fetching markets:', marketsError);
        throw marketsError;
      }
      
      markets = marketsData || [];
    }
    
    // Create a map for quick market lookup
    const marketMap = new Map(markets.map(m => [m.id, m]));
    
    // Fetch user's created markets
    const { data: createdMarkets, error: createdMarketsError } = await supabase
      .from('markets')
      .select('*')
      .or(`creator.eq.${address.toLowerCase()},creator.eq.${address},source.eq.${address.toLowerCase()},source.eq.${address}`)
      .order('createdat', { ascending: false })
      .limit(10);
    
    if (createdMarketsError) {
      console.error('Error fetching created markets:', createdMarketsError);
      throw createdMarketsError;
    }
    
    // Transform participations into activity items
    const tradingActivities = (participations || []).map(participation => {
      const market = marketMap.get(participation.marketid);
      if (!market) return null; // Skip if market not found
      
      const totalInvestment = parseFloat(participation.totalinvestment || '0');
      const totalYesShares = parseFloat(participation.totalyesshares || '0');
      const totalNoShares = parseFloat(participation.totalnoshares || '0');
      
      // Determine primary side based on shares
      const primarySide = totalYesShares > totalNoShares ? 'yes' : 
                         totalNoShares > totalYesShares ? 'no' : 'neutral';
      
      return {
        id: `trade-${participation.id}`,
        type: 'trading' as const,
        marketId: market.id,
        marketQuestion: market.question,
        marketStatus: market.status,
        marketOutcome: market.outcome,
        totalInvestment: totalInvestment.toString(),
        totalYesShares: totalYesShares.toString(),
        totalNoShares: totalNoShares.toString(),
        primarySide,
        firstPurchaseAt: new Date(participation.firstpurchaseat),
        lastPurchaseAt: new Date(participation.lastpurchaseat),
        transactionHashes: participation.transactionhashes,
        market: market
      };
    }).filter((activity): activity is NonNullable<typeof activity> => activity !== null); // Remove null entries
    
    // Transform created markets into activity items
    const marketCreationActivities = createdMarkets.map(market => ({
      id: `market-${market.id}`,
      type: 'market_created' as const,
      marketId: market.id,
      marketQuestion: market.question,
      marketStatus: market.status,
      marketOutcome: market.outcome,
      totalPool: market.totalpool,
      totalYes: market.totalyes,
      totalNo: market.totalno,
      createdAt: new Date(parseInt(market.createdat) * 1000),
      market: {
        id: market.id,
        question: market.question,
        status: market.status,
        outcome: market.outcome,
        totalpool: market.totalpool,
        totalyes: market.totalyes,
        totalno: market.totalno,
        endtime: market.endtime,
        creator: market.creator,
        createdat: market.createdat
      }
    }));
    
    // Combine and sort all activities
    let allActivities = [...tradingActivities, ...marketCreationActivities];
    
    // Filter by activity type if specified
    if (activityType) {
      allActivities = allActivities.filter(activity => activity && activity.type === activityType);
    }
    
    // Sort by date (most recent first)
    allActivities.sort((a, b) => {
      const dateA = 'lastPurchaseAt' in a ? a.lastPurchaseAt : a.createdAt;
      const dateB = 'lastPurchaseAt' in b ? b.lastPurchaseAt : b.createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
    
    // Apply pagination to combined results
    const paginatedActivities = allActivities.slice(skip, skip + limit);
    
    // Calculate user statistics
    const totalTrades = participations?.length || 0;
    const totalMarketsCreated = createdMarkets?.length || 0;
    const totalVolume = (participations || []).reduce((sum, p) => 
      sum + parseFloat(p.totalinvestment || '0'), 0
    );
    const totalYesShares = (participations || []).reduce((sum, p) => 
      sum + parseFloat(p.totalyesshares || '0'), 0
    );
    const totalNoShares = (participations || []).reduce((sum, p) => 
      sum + parseFloat(p.totalnoshares || '0'), 0
    );
    
    // Calculate win rate for resolved markets
    const resolvedMarkets = (participations || []).filter(p => {
      const market = marketMap.get(p.marketid);
      return market && market.status === 1;
    });
    const wonTrades = resolvedMarkets.filter(p => {
      const market = marketMap.get(p.marketid);
      if (!market) return false;
      
      const hasYesShares = parseFloat(p.totalyesshares || '0') > 0;
      const hasNoShares = parseFloat(p.totalnoshares || '0') > 0;
      
      if (market.outcome === true && hasYesShares) return true;
      if (market.outcome === false && hasNoShares) return true;
      return false;
    });
    
    const winRate = resolvedMarkets.length > 0 ? 
      (wonTrades.length / resolvedMarkets.length) * 100 : 0;
    
    const stats = {
      totalTrades,
      totalMarketsCreated,
      totalVolume: totalVolume.toString(),
      totalYesShares: totalYesShares.toString(),
      totalNoShares: totalNoShares.toString(),
      winRate: Math.round(winRate * 100) / 100,
      averageTradeSize: totalTrades > 0 ? (totalVolume / totalTrades).toString() : '0'
    };
    
    return NextResponse.json({
      activities: paginatedActivities,
      stats,
      pagination: {
        page,
        limit,
        total: allActivities.length,
        totalPages: Math.ceil(allActivities.length / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user activity' },
      { status: 500 }
    );
  } finally {
    // No need to disconnect Supabase client
  }
}
