-- Create markets table
CREATE TABLE IF NOT EXISTS markets (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  endTime TEXT NOT NULL,
  totalPool TEXT NOT NULL,
  totalYes TEXT NOT NULL,
  totalNo TEXT NOT NULL,
  status INTEGER NOT NULL,
  outcome BOOLEAN NOT NULL,
  createdAt TEXT NOT NULL,
  creator TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  image TEXT NOT NULL,
  source TEXT NOT NULL,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create market_events table
CREATE TABLE IF NOT EXISTS market_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  marketId TEXT NOT NULL,
  eventType TEXT NOT NULL,
  blockNumber TEXT NOT NULL,
  transactionHash TEXT NOT NULL,
  args TEXT NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sync_status table
CREATE TABLE IF NOT EXISTS sync_status (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  lastSyncBlock TEXT NOT NULL,
  lastSyncTime TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  isActive BOOLEAN DEFAULT true
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_markets_status ON markets(status);
CREATE INDEX IF NOT EXISTS idx_markets_category ON markets(category);
CREATE INDEX IF NOT EXISTS idx_markets_created_at ON markets(createdAt);
CREATE INDEX IF NOT EXISTS idx_market_events_market_id ON market_events(marketId);
CREATE INDEX IF NOT EXISTS idx_market_events_event_type ON market_events(eventType);

-- Enable Row Level Security (optional)
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_status ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY IF NOT EXISTS "Allow public read access to markets" ON markets
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Allow public read access to market_events" ON market_events
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Allow public read access to sync_status" ON sync_status
  FOR SELECT USING (true);







