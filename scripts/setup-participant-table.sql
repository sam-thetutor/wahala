-- Create the market_participants table
CREATE TABLE IF NOT EXISTS market_participants (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  marketId TEXT NOT NULL,
  address TEXT NOT NULL,
  totalYesShares TEXT NOT NULL DEFAULT '0',
  totalNoShares TEXT NOT NULL DEFAULT '0',
  totalInvestment TEXT NOT NULL DEFAULT '0',
  firstPurchaseAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  lastPurchaseAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  transactionHashes TEXT[] NOT NULL DEFAULT '{}',
  UNIQUE(marketId, address)
);

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_market_participants_market_id ON market_participants(marketId);
CREATE INDEX IF NOT EXISTS idx_market_participants_address ON market_participants(address);

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT ALL ON market_participants TO authenticated;
-- GRANT ALL ON market_participants TO anon;

