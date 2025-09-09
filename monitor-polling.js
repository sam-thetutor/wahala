// Monitor polling-based event detection
const monitorPolling = () => {
  console.log('👀 Monitoring polling-based event detection...');
  console.log('📡 Polling server is running and checking for events every 10 seconds');
  console.log('🔄 Waiting for new market creation or share purchase events...');
  console.log('💡 Go to http://localhost:3000/create-market and create a new market');
  console.log('📊 This script will show when events are detected\n');

  let lastMarketCount = 0;
  let lastMarketId = 0;

  // Check for new events every 5 seconds
  const checkForEvents = async () => {
    try {
      // Check server status
      const statusResponse = await fetch('http://localhost:3000/api/ws');
      const statusData = await statusResponse.json();
      
      const timestamp = new Date().toLocaleTimeString();
      console.log(`[${timestamp}] Status: Listening=${statusData.isListening}, Clients=${statusData.connectedClients}`);

      // Check for new markets
      const marketsResponse = await fetch('http://localhost:3000/api/markets');
      const marketsData = await marketsResponse.json();
      
      const currentMarketCount = marketsData.markets.length;
      const latestMarket = marketsData.markets[0];
      
      if (currentMarketCount > lastMarketCount) {
        console.log(`🎉 NEW MARKET DETECTED! Total markets: ${currentMarketCount}`);
        console.log(`📈 Latest market: ID ${latestMarket.id} - "${latestMarket.question}"`);
        lastMarketCount = currentMarketCount;
      }
      
      if (latestMarket && parseInt(latestMarket.id) > lastMarketId) {
        console.log(`🆕 New market detected: ID ${latestMarket.id}`);
        lastMarketId = parseInt(latestMarket.id);
      }

      // Check if polling is working by looking at server logs
      if (statusData.isListening) {
        console.log('✅ Polling is active and monitoring blockchain events');
      } else {
        console.log('⚠️ Polling is not active');
      }
      
    } catch (error) {
      console.error('❌ Error checking events:', error.message);
    }
  };

  // Initial check
  checkForEvents();
  
  // Check every 5 seconds
  setInterval(checkForEvents, 5000);
};

// Start monitoring
monitorPolling();
