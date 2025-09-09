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
    console.log('Fetching stats for address:', address);
    
    // Fetch user's market participations
    console.log('Fetching participations...');
    const { data: participations, error: participationsError } = await supabase
      .from('market_participants')
      .select('*')
      .eq('address', address.toLowerCase());
    
    if (participationsError) {
      console.error('Error fetching participations:', participationsError);
      throw participationsError;
    }
    
    console.log('Found participations:', participations?.length || 0);
    
    // Fetch market details separately
    const marketIds = participations?.map(p => p.marketid) || [];
    console.log('Fetching markets for IDs:', marketIds);
    
    let markets: any[] = [];
    if (marketIds.length > 0) {
      const { data: marketsData, error: marketsError } = await supabase
        .from('markets')
        .select('id, question, status, outcome, totalpool, totalyes, totalno, endtime, creator')
        .in('id', marketIds);
      
      if (marketsError) {
        console.error('Error fetching markets:', marketsError);
        throw marketsError;
      }
      
      markets = marketsData || [];
    }
    
    console.log('Found markets:', markets.length);
    
    // Create a map for quick market lookup
    const marketMap = new Map(markets.map(m => [m.id, m]));
    
    // Fetch user's created markets
    console.log('Fetching created markets...');
    const { data: createdMarkets, error: createdMarketsError } = await supabase
      .from('markets')
      .select('*')
      .or(`creator.eq.${address.toLowerCase()},creator.eq.${address},source.eq.${address.toLowerCase()},source.eq.${address}`);
    
    if (createdMarketsError) {
      console.error('Error fetching created markets:', createdMarketsError);
      throw createdMarketsError;
    }
    
    console.log('Found created markets:', createdMarkets?.length || 0);
    
    // Calculate basic statistics
    console.log('Calculating basic statistics...');
    const totalMarketsCreated = createdMarkets?.length || 0;
    const totalTrades = participations?.length || 0;
    const totalVolume = (participations || []).reduce((sum, p) => {
      try {
        return sum + parseFloat(p.totalinvestment || '0');
      } catch (e) {
        console.error('Error parsing totalinvestment:', p.totalinvestment, e);
        return sum;
      }
    }, 0);
    
    // Calculate shares statistics
    const totalYesShares = (participations || []).reduce((sum, p) => {
      try {
        return sum + parseFloat(p.totalyesshares || '0');
      } catch (e) {
        console.error('Error parsing totalyesshares:', p.totalyesshares, e);
        return sum;
      }
    }, 0);
    const totalNoShares = (participations || []).reduce((sum, p) => {
      try {
        return sum + parseFloat(p.totalnoshares || '0');
      } catch (e) {
        console.error('Error parsing totalnoshares:', p.totalnoshares, e);
        return sum;
      }
    }, 0);
    
    // Calculate market performance
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
    
    // Calculate winnings (simplified - based on winning shares)
    const totalWinnings = wonTrades.reduce((sum, p) => {
      const market = marketMap.get(p.marketid);
      if (!market) return sum;
      
      const yesShares = parseFloat(p.totalyesshares || '0');
      const noShares = parseFloat(p.totalnoshares || '0');
      
      if (market.outcome === true && yesShares > 0) {
        // Won with yes shares - calculate potential winnings
        return sum + (yesShares * 0.1); // Simplified calculation
      }
      if (market.outcome === false && noShares > 0) {
        // Won with no shares - calculate potential winnings
        return sum + (noShares * 0.1); // Simplified calculation
      }
      return sum;
    }, 0);
    
    // Calculate average trade size
    const averageTradeSize = totalTrades > 0 ? totalVolume / totalTrades : 0;
    
    // Calculate market creation success rate
    const resolvedCreatedMarkets = (createdMarkets || []).filter(m => m.status === 1);
    const marketCreationSuccessRate = totalMarketsCreated > 0 ? 
      (resolvedCreatedMarkets.length / totalMarketsCreated) * 100 : 0;
    
    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentTrades = (participations || []).filter(p => 
      new Date(p.lastpurchaseat) >= thirtyDaysAgo
    ).length;
    
    const recentMarketsCreated = (createdMarkets || []).filter(m => 
      new Date(parseInt(m.createdat) * 1000) >= thirtyDaysAgo
    ).length;
    
    // Calculate trading frequency
    const tradingDays = new Set(
      (participations || []).map(p => 
        new Date(p.lastpurchaseat).toDateString()
      )
    ).size;
    
    const tradingFrequency = tradingDays > 0 ? totalTrades / tradingDays : 0;
    
    const stats = {
      // Basic stats
      totalMarketsCreated,
      totalTrades,
      totalVolume: totalVolume.toString(),
      totalWinnings: totalWinnings.toString(),
      
      // Trading stats
      totalYesShares: totalYesShares.toString(),
      totalNoShares: totalNoShares.toString(),
      winRate: Math.round(winRate * 100) / 100,
      averageTradeSize: averageTradeSize.toString(),
      
      // Market creation stats
      marketCreationSuccessRate: Math.round(marketCreationSuccessRate * 100) / 100,
      resolvedCreatedMarkets: resolvedCreatedMarkets.length,
      
      // Activity stats
      recentTrades,
      recentMarketsCreated,
      tradingDays,
      tradingFrequency: Math.round(tradingFrequency * 100) / 100,
      
      // Performance metrics
      totalParticipationValue: (totalYesShares + totalNoShares).toString(),
      averageMarketParticipation: totalMarketsCreated > 0 ? 
        (totalTrades / totalMarketsCreated).toString() : '0',
      
      // Risk metrics
      riskTolerance: totalNoShares > totalYesShares ? 'Conservative' : 
                    totalYesShares > totalNoShares ? 'Aggressive' : 'Balanced',
      
      // Timestamps
      lastTradeAt: (participations || []).length > 0 ? 
        Math.max(...(participations || []).map(p => {
          try {
            return new Date(p.lastpurchaseat).getTime();
          } catch (e) {
            console.error('Error parsing lastpurchaseat:', p.lastpurchaseat, e);
            return 0;
          }
        })) : null,
      firstTradeAt: (participations || []).length > 0 ? 
        Math.min(...(participations || []).map(p => {
          try {
            return new Date(p.firstpurchaseat).getTime();
          } catch (e) {
            console.error('Error parsing firstpurchaseat:', p.firstpurchaseat, e);
            return Date.now();
          }
        })) : null,
      lastMarketCreatedAt: (createdMarkets || []).length > 0 ? 
        Math.max(...(createdMarkets || []).map(m => {
          try {
            return parseInt(m.createdat) * 1000;
          } catch (e) {
            console.error('Error parsing createdat:', m.createdat, e);
            return 0;
          }
        })) : null
    };
    
    console.log('Stats calculated successfully:', stats);
    return NextResponse.json({ stats });
    
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  } finally {
    // No need to disconnect Supabase client
  }
}
