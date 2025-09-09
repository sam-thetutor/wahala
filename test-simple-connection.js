// Simple test to check if the API is working
const fetch = require('node-fetch');

async function testSimpleConnection() {
  console.log('🧪 Testing simple connection...');

  try {
    // Test the API endpoint directly
    const response = await fetch('http://localhost:3000/api/ws');
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    const data = await response.json();
    console.log('Response data:', data);
    
    if (response.ok) {
      console.log('✅ API is working correctly');
    } else {
      console.log('❌ API returned error status');
    }
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testSimpleConnection();
