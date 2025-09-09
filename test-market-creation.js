// Test script to simulate market creation and see if WebSocket picks it up
const testMarketCreation = async () => {
  console.log('🧪 Testing market creation with WebSocket...');

  try {
    // First, let's check the current status
    console.log('\n1️⃣ Checking WebSocket server status...');
    const statusResponse = await fetch('http://localhost:3000/api/ws');
    const statusData = await statusResponse.json();
    console.log('📊 WebSocket server status:', statusData);

    // Simulate a MarketCreated event
    console.log('\n2️⃣ Simulating MarketCreated event...');
    const mockMarketCreated = {
      type: 'marketCreated',
      data: {
        marketId: 37, // Next market ID
        creator: '0x21D654daaB0fe1be0e584980ca7C1a382850939f',
        question: 'Test WebSocket Market Creation',
        description: 'This is a test market to verify WebSocket event processing',
        category: 'Technology',
        imageUrl: 'https://picsum.photos/400/300?random=37',
        sourceLinks: ['https://example.com'],
        endTime: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
        status: 0, // Active
        transactionHash: '0xtestwebsocket123456789'
      }
    };

    const response = await fetch('http://localhost:3000/api/ws', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockMarketCreated),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ MarketCreated event broadcast successful:', result);
    } else {
      console.error('❌ MarketCreated event broadcast failed:', response.status);
    }

    // Wait a moment and check if the market was added to the database
    console.log('\n3️⃣ Checking if market was added to database...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    
    const marketsResponse = await fetch('http://localhost:3000/api/markets');
    const marketsData = await marketsResponse.json();
    
    const testMarket = marketsData.markets.find(m => m.id === '37');
    if (testMarket) {
      console.log('✅ Test market found in database:', testMarket.question);
    } else {
      console.log('ℹ️ Test market not found in database (this is expected for mock events)');
    }

    console.log('\n🎉 Market creation test completed!');

  } catch (error) {
    console.error('❌ Error testing market creation:', error);
  }
};

// Run the test
testMarketCreation();
