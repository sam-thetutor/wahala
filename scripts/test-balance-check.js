const { createPublicClient, http, formatEther } = require('viem');
const { celo } = require('@reown/appkit/networks');

// Test balance checking on Celo
async function testBalanceCheck() {
  console.log('🔍 Testing balance check on Celo...');
  
  // Create a public client for Celo
  const client = createPublicClient({
    chain: celo,
    transport: http()
  });

  // Test with a known Celo address (you can replace this with your address)
  const testAddress = '0x21d654daab0fe1be0e584980ca7c1a382850939f';
  
  try {
    // Get balance
    const balance = await client.getBalance({
      address: testAddress
    });
    
    console.log('✅ Balance check successful!');
    console.log(`Address: ${testAddress}`);
    console.log(`Balance: ${formatEther(balance)} CELO`);
    console.log(`Chain ID: ${celo.id}`);
    console.log(`Chain Name: ${celo.name}`);
    
  } catch (error) {
    console.error('❌ Balance check failed:', error.message);
  }
}

testBalanceCheck();
