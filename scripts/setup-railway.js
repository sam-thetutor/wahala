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

function runCommand(command) {
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    return false;
  }
}

async function setupRailway() {
  log('🚀 Setting up Railway for Polling Service Deployment', 'cyan');
  log('====================================================', 'cyan');
  
  // Step 1: Check if Railway CLI is installed
  log('\n📋 Step 1: Checking Railway CLI...', 'blue');
  
  try {
    execSync('railway --version', { stdio: 'pipe' });
    log('✅ Railway CLI is already installed', 'green');
  } catch {
    log('❌ Railway CLI not found. Installing...', 'yellow');
    log('Installing Railway CLI...', 'yellow');
    
    if (!runCommand('npm install -g @railway/cli')) {
      log('❌ Failed to install Railway CLI. Please install manually:', 'red');
      log('npm install -g @railway/cli', 'cyan');
      process.exit(1);
    }
    
    log('✅ Railway CLI installed successfully', 'green');
  }
  
  // Step 2: Check if user is logged in
  log('\n📋 Step 2: Checking Railway login status...', 'blue');
  
  try {
    execSync('railway whoami', { stdio: 'pipe' });
    log('✅ Already logged in to Railway', 'green');
  } catch {
    log('❌ Not logged in to Railway', 'yellow');
    log('\n🔐 Please login to Railway:', 'cyan');
    log('This will open your browser for authentication...', 'yellow');
    
    if (!runCommand('railway login')) {
      log('❌ Login failed. Please try again:', 'red');
      log('railway login', 'cyan');
      process.exit(1);
    }
    
    log('✅ Successfully logged in to Railway', 'green');
  }
  
  // Step 3: Check environment variables
  log('\n📋 Step 3: Checking environment variables...', 'blue');
  
  const envPath = '.env';
  if (!fs.existsSync(envPath)) {
    log('❌ No .env file found', 'red');
    log('Please create a .env file with your Supabase credentials:', 'yellow');
    log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url', 'cyan');
    log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key', 'cyan');
    process.exit(1);
  }
  
  log('✅ .env file found', 'green');
  
  // Step 4: Ready to deploy
  log('\n🎉 Setup complete! You are ready to deploy.', 'green');
  log('\n📋 Next steps:', 'blue');
  log('1. Run: node scripts/deploy-to-railway.js', 'cyan');
  log('2. Or run: ./deploy-railway.sh', 'cyan');
  log('3. Or run: pnpm run deploy:railway', 'cyan');
  
  log('\n💡 The polling service will:', 'magenta');
  log('• Poll blockchain every 10 seconds for new markets', 'green');
  log('• Automatically sync new markets to your database', 'green');
  log('• Restart automatically if it crashes', 'green');
  log('• Run continuously on Railway', 'green');
}

setupRailway().catch((error) => {
  log(`\n❌ Setup failed: ${error.message}`, 'red');
  process.exit(1);
});
