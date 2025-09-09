// Test script to verify polling-based event detection
const testPollingEvents = async () => {
  console.log('🧪 Testing polling-based event detection...');

  try {
    // Test 1: Check if the polling server is running
    console.log('\n1️⃣ Checking polling server status...');
    const statusResponse = await fetch('http://localhost:3000/api/ws');
    const statusData = await statusResponse.json();
    console.log('📊 Polling server status:', statusData);

    // Test 2: Trigger a manual poll to see if it detects recent events
    console.log('\n2️⃣ Testing manual event polling...');
    
    // Create a simple test to check recent blocks
    const testResponse = await fetch('http://localhost:3000/api/ws', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'testPoll',
        data: {
          message: 'Testing polling functionality',
          timestamp: new Date().toISOString()
        }
      }),
    });

    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log('✅ Polling test successful:', testData);
    } else {
      console.error('❌ Polling test failed:', testResponse.status);
    }

    // Test 3: Check if we can see any recent market activity
    console.log('\n3️⃣ Checking recent market activity...');
    const marketsResponse = await fetch('http://localhost:3000/api/markets');
    const marketsData = await marketsResponse.json();
    
    console.log(`📈 Found ${marketsData.markets.length} markets`);
    
    // Show the most recent market
    if (marketsData.markets.length > 0) {
      const latestMarket = marketsData.markets[0];
      console.log('🆕 Latest market:', {
        id: latestMarket.id,
        question: latestMarket.question,
        created: new Date(parseInt(latestMarket.createdat) * 1000).toLocaleString()
      });
    }

    console.log('\n🎉 Polling test completed!');
    console.log('💡 The polling approach should detect new events within 10 seconds of them occurring on the blockchain.');

  } catch (error) {
    console.error('❌ Error testing polling events:', error);
  }
};

// Run the test
testPollingEvents();
