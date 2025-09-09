import { supabase, Market, MarketEvent, MarketParticipant, SyncStatus } from './supabase'

export class DatabaseService {
  // Market operations
  static async getAllMarkets(): Promise<Market[]> {
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .order('createdat', { ascending: false })

    if (error) {
      console.error('Error fetching markets:', error)
      throw error
    }

    return data || []
  }

  static async getMarketsPaginated(
    page: number = 1,
    limit: number = 12,
    search?: string,
    category?: string,
    sortBy: string = 'newest',
    status?: string
  ) {
    let query = supabase.from('markets').select('*')

    // Apply filters
    if (search) {
      query = query.or(`question.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`)
    }

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    if (status) {
      query = query.eq('status', parseInt(status))
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        query = query.order('createdat', { ascending: false })
        break
      case 'oldest':
        query = query.order('createdat', { ascending: true })
        break
      case 'volume':
        query = query.order('totalpool', { ascending: false })
        break
      case 'ending':
        query = query.order('endtime', { ascending: true })
        break
      default:
        query = query.order('createdat', { ascending: false })
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('markets')
      .select('*', { count: 'exact', head: true })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error } = await query

    if (error) {
      console.error('Error fetching paginated markets:', error)
      throw error
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return {
      markets: data || [],
      pagination: {
        currentPage: page,
        totalPages,
        totalMarkets: count || 0,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      }
    }
  }

  static async getMarketById(id: string): Promise<Market | null> {
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching market:', error)
      return null
    }

    if (!data) return null

    return data
  }

  static async upsertMarket(market: Omit<Market, 'updatedat'>): Promise<Market> {
    const { data, error } = await supabase
      .from('markets')
      .upsert(market)
      .select()
      .single()

    if (error) {
      console.error('Error upserting market:', error)
      throw error
    }

    return data
  }

  static async upsertMarkets(markets: Omit<Market, 'updatedat'>[]): Promise<Market[]> {
    const marketsWithTimestamp = markets.map(market => ({
      ...market,
      updatedat: new Date().toISOString()
    }))

    const { data, error } = await supabase
      .from('markets')
      .upsert(marketsWithTimestamp)
      .select()

    if (error) {
      console.error('Error upserting markets:', error)
      throw error
    }

    return data || []
  }

  // Update market totals after share purchase
  static async updateMarketTotals(
    marketId: string | number,
    totalPool: string,
    totalYes: string,
    totalNo: string
  ) {
    const { data, error } = await supabase
      .from('markets')
      .update({
        totalpool: totalPool,
        totalyes: totalYes,
        totalno: totalNo,
        updatedat: new Date().toISOString()
      })
      .eq('id', marketId.toString())
      .select()

    if (error) {
      console.error('Error updating market totals:', error)
      throw error
    }

    return data?.[0]
  }

  // Resolve market
  static async resolveMarket(marketId: string | number, outcome: boolean) {
    const { data, error } = await supabase
      .from('markets')
      .update({
        status: 1, // Resolved
        outcome: outcome,
        updatedat: new Date().toISOString()
      })
      .eq('id', marketId.toString())
      .select()

    if (error) {
      console.error('Error resolving market:', error)
      throw error
    }

    return data?.[0]
  }

  // Participant operations
  static async upsertParticipant(participant: Omit<MarketParticipant, 'id'>): Promise<MarketParticipant> {
    const { data, error } = await supabase
      .from('market_participants')
      .upsert({
        ...participant,
        lastPurchaseAt: new Date().toISOString()
      }, {
        onConflict: 'marketId,address'
      })
      .select()
      .single()

    if (error) {
      console.error('Error upserting participant:', error)
      throw error
    }

    return data
  }

  static async getMarketParticipants(marketId: string): Promise<MarketParticipant[]> {
    const { data, error } = await supabase
      .from('market_participants')
      .select('*')
      .eq('marketid', marketId)
      .order('totalinvestment', { ascending: false })

    if (error) {
      console.error('Error fetching market participants:', error)
      throw error
    }

    return data || []
  }

  static async updateParticipantShares(
    marketId: string,
    address: string,
    yesShares: string,
    noShares: string,
    totalInvestment: string,
    transactionHash: string
  ): Promise<MarketParticipant> {
    // First, try to get existing participant
    const { data: existing, error: fetchError } = await supabase
      .from('market_participants')
      .select('*')
      .eq('marketid', marketId)
      .eq('address', address)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError
    }

    if (existing) {
      // Update existing participant - use provided totals (already calculated by API)
      const existingHashes = existing.transactionhashes || []
      const newTransactionHashes = [...existingHashes, transactionHash]
      
      // Use the provided values directly (they're already calculated correctly by the API)
      const newYesShares = BigInt(yesShares)
      const newNoShares = BigInt(noShares)
      const newTotalInvestment = BigInt(totalInvestment)
      
      const { data, error } = await supabase
        .from('market_participants')
        .update({
          totalyesshares: newYesShares.toString(),
          totalnoshares: newNoShares.toString(),
          totalinvestment: newTotalInvestment.toString(),
          lastpurchaseat: new Date().toISOString(),
          transactionhashes: newTransactionHashes
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating participant:', error)
        throw error
      }

      return data
    } else {
      // Create new participant
      const { data, error } = await supabase
        .from('market_participants')
        .insert({
          marketid: marketId,
          address,
          totalyesshares: yesShares,
          totalnoshares: noShares,
          totalinvestment: totalInvestment,
          firstpurchaseat: new Date().toISOString(),
          lastpurchaseat: new Date().toISOString(),
          transactionhashes: [transactionHash]
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating participant:', error)
        throw error
      }

      return data
    }
  }

  // Event operations
  static async addMarketEvent(event: Omit<MarketEvent, 'id' | 'createdAt'>): Promise<MarketEvent> {
    const { data, error } = await supabase
      .from('market_events')
      .insert({
        ...event,
        createdAt: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding market event:', error)
      throw error
    }

    return data
  }

  static async getMarketEvents(marketId: string): Promise<MarketEvent[]> {
    const { data, error } = await supabase
      .from('market_events')
      .select('*')
      .eq('marketId', marketId)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching market events:', error)
      throw error
    }

    return data || []
  }

  // Sync operations
  static async getSyncStatus(): Promise<SyncStatus | null> {
    const { data, error } = await supabase
      .from('sync_status')
      .select('*')
      .eq('isActive', true)
      .single()

    if (error) {
      console.error('Error fetching sync status:', error)
      return null
    }

    return data
  }

  static async updateSyncStatus(lastSyncBlock: string): Promise<SyncStatus> {
    const { data, error } = await supabase
      .from('sync_status')
      .upsert({
        lastSyncBlock,
        lastSyncTime: new Date().toISOString(),
        isActive: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating sync status:', error)
      throw error
    }

    return data
  }

  // Stats operations
  static async getMarketStats() {
    const { data: markets, error } = await supabase
      .from('markets')
      .select('status, totalpool')

    if (error) {
      console.error('Error fetching market stats:', error)
      throw error
    }

    const totalMarkets = markets?.length || 0
    const activeMarkets = markets?.filter(m => m.status === 0).length || 0
    const resolvedMarkets = markets?.filter(m => m.status === 1).length || 0
    
    // Calculate total volume from actual trading events, not current pool size
    let totalVolume = 0n
    
    try {
      // Get all SharesBought events to calculate actual trading volume
      const { data: tradingEvents, error: eventsError } = await supabase
        .from('market_events')
        .select('args')
        .eq('eventType', 'SharesBought')

      if (!eventsError && tradingEvents) {
        totalVolume = tradingEvents.reduce((sum, event) => {
          try {
            const args = typeof event.args === 'string' ? JSON.parse(event.args) : event.args
            const amount = BigInt(args.amount || '0')
            
            // Debug logging for first few events
            if (tradingEvents.indexOf(event) < 3) {
              console.log('🔍 Trading event debug:', {
                eventIndex: tradingEvents.indexOf(event),
                rawArgs: args,
                amount: amount.toString(),
                amountInCelo: (Number(amount) / 1e18).toFixed(6)
              });
            }
            
            return sum + amount
          } catch (parseError) {
            console.warn('Error parsing trading event args:', parseError)
            return sum
          }
        }, 0n)
      }
      
      // If no trading events found, fall back to calculating from market participants
      if (totalVolume === 0n) {
        const { data: participants, error: participantsError } = await supabase
          .from('market_participants')
          .select('totalinvestment')

        if (!participantsError && participants) {
          totalVolume = participants.reduce((sum, participant) => {
            const investment = BigInt(participant.totalinvestment || '0')
            
            // Debug first few participants
            if (participants.indexOf(participant) < 3) {
              console.log('🔍 Participant debug:', {
                participantIndex: participants.indexOf(participant),
                totalinvestment: participant.totalinvestment,
                investment: investment.toString(),
                investmentInCelo: (Number(investment) / 1e18).toFixed(6)
              });
            }
            
            return sum + investment
          }, 0n)
        }
      }
      
      // Check if the volume seems too large (likely already in CELO, not wei)
      const volumeInCelo = Number(totalVolume) / 1e18;
      const isLikelyAlreadyInCelo = volumeInCelo > 1000000; // If > 1M CELO, probably wrong
      
      if (isLikelyAlreadyInCelo) {
        console.warn('⚠️ Volume seems too large, might already be in CELO format');
        // Try treating the raw value as CELO instead of wei
        totalVolume = BigInt(Math.floor(Number(totalVolume) / 1e18));
      }
      
      console.log('📊 Volume calculation:', {
        fromEvents: (tradingEvents?.length || 0) > 0,
        fromParticipants: (tradingEvents?.length || 0) === 0 && totalVolume > 0n,
        totalVolume: totalVolume.toString(),
        totalVolumeInCelo: (Number(totalVolume) / 1e18).toFixed(6),
        tradingEventsCount: tradingEvents?.length || 0,
        isLikelyAlreadyInCelo: isLikelyAlreadyInCelo,
        sampleMarketPools: markets?.slice(0, 3).map((m, index) => ({
          index: index,
          totalpool: m.totalpool,
          poolInCelo: (Number(m.totalpool) / 1e18).toFixed(6)
        })) || []
      })
      
    } catch (volumeError) {
      console.error('Error calculating total volume:', volumeError)
      // Fallback to pool-based calculation if event calculation fails
      totalVolume = markets?.reduce((sum, m) => sum + BigInt(m.totalpool), 0n) || 0n
    }

    return {
      totalMarkets,
      activeMarkets,
      resolvedMarkets,
      totalVolume: totalVolume.toString()
    }
  }

  // Categories operations
  static async getCategories() {
    const { data, error } = await supabase
      .from('markets')
      .select('category')
      .not('category', 'is', null)

    if (error) {
      console.error('Error fetching categories:', error)
      throw error
    }

    const uniqueCategories = [...new Set(data?.map(m => m.category).filter(Boolean))]
    
    const categoryColors: { [key: string]: string } = {
      'Politics': '#EF4444',
      'Sports': '#10B981',
      'Technology': '#3B82F6',
      'Entertainment': '#8B5CF6',
      'Finance': '#F59E0B',
      'Science': '#6366F1',
      'Weather': '#06B6D4',
      'Other': '#6B7280'
    }

    const categories = uniqueCategories.map(category => ({
      id: category.toLowerCase(),
      name: category,
      color: categoryColors[category] || categoryColors['Other']
    }))

    return [
      { id: 'all', name: 'All Markets', color: '#6B7280' },
      ...categories
    ]
  }
}
