#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, options = {}) {
  try {
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function deploySimpleRailway() {
  log('🚀 Simple Railway Deployment for Polling Service', 'cyan');
  log('===============================================', 'cyan');
  
  // Step 1: Check if Railway CLI is installed and user is logged in
  log('\n📋 Checking Railway setup...', 'blue');
  
  try {
    execSync('railway whoami', { stdio: 'pipe' });
    log('✅ Railway CLI found and user is logged in', 'green');
  } catch {
    log('❌ Please setup Railway first:', 'red');
    log('1. Install Railway CLI: npm install -g @railway/cli', 'yellow');
    log('2. Login to Railway: railway login', 'yellow');
    log('3. Run this script again', 'yellow');
    process.exit(1);
  }
  
  // Step 2: Create Railway configuration
  log('\n📝 Creating Railway configuration...', 'blue');
  
  const railwayConfig = {
    "$schema": "https://railway.app/railway.schema.json",
    "build": {
      "builder": "NIXPACKS"
    },
    "deploy": {
      "startCommand": "node scripts/start-polling-service.js",
      "restartPolicyType": "ON_FAILURE",
      "restartPolicyMaxRetries": 10
    }
  };
  
  fs.writeFileSync('railway.json', JSON.stringify(railwayConfig, null, 2));
  log('✅ Railway configuration created', 'green');
  
  // Step 3: Deploy
  log('\n🚀 Deploying to Railway...', 'blue');
  log('This may take a few minutes...', 'yellow');
  
  const deployResult = runCommand('railway up');
  if (deployResult.success) {
    log('\n✅ Deployment successful!', 'green');
    log('\n🎉 Your polling service is now running on Railway!', 'cyan');
    
    log('\n📊 Next steps:', 'blue');
    log('1. Go to Railway dashboard: https://railway.app/dashboard', 'yellow');
    log('2. Set environment variables in your service settings:', 'yellow');
    log('   - ENABLE_POLLING=true', 'cyan');
    log('   - NEXT_PUBLIC_SUPABASE_URL=your_supabase_url', 'cyan');
    log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key', 'cyan');
    log('   - NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS_CELO=0x7176D16D61A122231a78749c61740ad8F86BB13a', 'cyan');
    log('   - NEXT_PUBLIC_PREDICTION_MARKET_CLAIMS_ADDRESS_CELO=0x1e1ac759e75dA03a39f16ae72B73279A1edf63d6', 'cyan');
    log('3. Restart your service after setting variables', 'yellow');
    
    log('\n💡 The polling service will:', 'magenta');
    log('• Poll blockchain every 10 seconds for new markets', 'green');
    log('• Automatically sync new markets to your database', 'green');
    log('• Restart automatically if it crashes', 'green');
    log('• Log all activity for monitoring', 'green');
    
  } else {
    log('\n❌ Deployment failed!', 'red');
    log('Error:', deployResult.error, 'red');
    
    log('\n🔧 Troubleshooting:', 'yellow');
    log('• Check your Railway plan: https://railway.com/account/plans', 'yellow');
    log('• Try upgrading to a paid plan if on free tier', 'yellow');
    log('• Check the Railway dashboard for more details', 'yellow');
    log('• Make sure you have sufficient credits', 'yellow');
  }
}

// Handle errors gracefully
process.on('uncaughtException', (error) => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log(`\n❌ Unhandled rejection: ${reason}`, 'red');
  process.exit(1);
});

// Run the deployment
deploySimpleRailway().catch((error) => {
  log(`\n❌ Deployment failed: ${error.message}`, 'red');
  process.exit(1);
});
