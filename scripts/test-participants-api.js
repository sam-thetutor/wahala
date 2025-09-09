require('dotenv').config();
const { DatabaseService } = require('./lib/database');

async function testParticipantsAPI() {
  console.log('🧪 Testing participants API locally...');

  try {
    // Test the function directly
    const participants = await DatabaseService.getMarketParticipants('26');
    console.log('✅ getMarketParticipants function works locally');
    console.log(`📊 Found ${participants.length} participants for market 26`);
    
    if (participants.length > 0) {
      console.log('📋 Sample participant:', {
        id: participants[0].id,
        marketid: participants[0].marketid,
        address: participants[0].address,
        totalyesshares: participants[0].totalyesshares,
        totalnoshares: participants[0].totalnoshares,
        totalinvestment: participants[0].totalinvestment
      });
    }

  } catch (error) {
    console.error('❌ Error testing participants API locally:', error);
  }
}

testParticipantsAPI();

