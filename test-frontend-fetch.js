// Test frontend fetch behavior
const fetch = require('node-fetch');

async function testFrontendFetch() {
  console.log('🧪 Testing frontend fetch behavior...');

  try {
    // Test the exact same fetch that the frontend would make
    console.log('1. Testing fetch to /api/ws...');
    const response = await fetch('http://localhost:3000/api/ws', { 
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', data);
      console.log('✅ Fetch successful');
    } else {
      console.log('❌ Fetch failed');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFrontendFetch();
