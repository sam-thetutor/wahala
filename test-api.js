const { DatabaseService } = require('./lib/database.ts');

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test getAllMarkets
    console.log('Testing getAllMarkets...');
    const markets = await DatabaseService.getAllMarkets();
    console.log('Markets found:', markets.length);
    console.log('First market:', markets[0]);
    
    // Test getMarketsPaginated
    console.log('Testing getMarketsPaginated...');
    const result = await DatabaseService.getMarketsPaginated(1, 12);
    console.log('Paginated result:', result);
    
    // Test getCategories
    console.log('Testing getCategories...');
    const categories = await DatabaseService.getCategories();
    console.log('Categories:', categories);
    
    // Test getMarketStats
    console.log('Testing getMarketStats...');
    const stats = await DatabaseService.getMarketStats();
    console.log('Stats:', stats);
    
  } catch (error) {
    console.error('Database test error:', error);
    console.error('Error stack:', error.stack);
  }
}

testDatabase();
