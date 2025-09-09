#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

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

function checkCommand(command) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
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

async function deployToRailway() {
  log('🚀 Starting Railway deployment for Polling Service...', 'cyan');
  
  // Step 1: Check prerequisites
  log('\n📋 Checking prerequisites...', 'blue');
  
  if (!checkCommand('railway')) {
    log('❌ Railway CLI not found. Please install it first:', 'red');
    log('npm install -g @railway/cli', 'yellow');
    process.exit(1);
  }
  log('✅ Railway CLI found', 'green');
  
  // Check if user is logged in
  const loginCheck = runCommand('railway whoami', { silent: true });
  if (!loginCheck.success) {
    log('❌ Not logged in to Railway.', 'red');
    log('\n🔐 Please login to Railway first:', 'yellow');
    log('railway login', 'cyan');
    log('\nThen run this script again:', 'yellow');
    log('node scripts/deploy-to-railway.js', 'cyan');
    process.exit(1);
  }
  log('✅ Logged in to Railway', 'green');
  
  // Step 2: Load environment variables
  log('\n🔧 Loading environment variables...', 'blue');
  
  const envPath = path.join(process.cwd(), '.env');
  let envVars = {};
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    });
    log('✅ Environment variables loaded from .env', 'green');
  } else {
    log('⚠️  No .env file found. You may need to set environment variables manually.', 'yellow');
  }
  
  // Step 3: Initialize Railway project
  log('\n📁 Setting up Railway project...', 'blue');
  
  const initResult = runCommand('railway init --name snarkels-polling-service', { silent: true });
  if (initResult.success) {
    log('✅ Railway project initialized', 'green');
  } else {
    log('ℹ️  Using existing Railway project', 'yellow');
  }
  
  // Step 4: Set environment variables
  log('\n🔧 Setting environment variables...', 'blue');
  
  const requiredEnvVars = {
    'ENABLE_POLLING': 'true',
    'NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS_CELO': '0x7176D16D61A122231a78749c61740ad8F86BB13a',
    'NEXT_PUBLIC_PREDICTION_MARKET_CLAIMS_ADDRESS_CELO': '0x1e1ac759e75dA03a39f16ae72B73279A1edf63d6'
  };
  
  // Add Supabase variables if they exist
  if (envVars.NEXT_PUBLIC_SUPABASE_URL) {
    requiredEnvVars.NEXT_PUBLIC_SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
  }
  if (envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    requiredEnvVars.NEXT_PUBLIC_SUPABASE_ANON_KEY = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }
  
  // Set all environment variables at once
  const envVarsString = Object.entries(requiredEnvVars)
    .map(([key, value]) => `--set "${key}=${value}"`)
    .join(' ');
  
  const setResult = runCommand(`railway variables ${envVarsString}`, { silent: true });
  if (setResult.success) {
    log('✅ Environment variables set successfully', 'green');
  } else {
    log('⚠️  Failed to set some environment variables:', 'yellow');
    log('You may need to set them manually in the Railway dashboard', 'yellow');
    log(`Error: ${setResult.error}`, 'yellow');
  }
  
  // Step 5: Create Railway configuration
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
  
  // Step 6: Deploy to Railway
  log('\n🚀 Deploying to Railway...', 'blue');
  log('This may take a few minutes...', 'yellow');
  
  const deployResult = runCommand('railway up');
  if (deployResult.success) {
    log('\n✅ Deployment successful!', 'green');
    log('\n🎉 Your polling service is now running on Railway!', 'cyan');
    log('\n📊 Next steps:', 'blue');
    log('• Monitor your service: https://railway.app/dashboard', 'yellow');
    log('• View logs: railway logs', 'yellow');
    log('• Restart service: railway restart', 'yellow');
    log('• Check status: railway status', 'yellow');
    
    log('\n💡 The polling service will:', 'magenta');
    log('• Poll blockchain every 10 seconds for new markets', 'green');
    log('• Automatically sync new markets to your database', 'green');
    log('• Restart automatically if it crashes', 'green');
    log('• Log all activity for monitoring', 'green');
    
  } else {
    log('\n❌ Deployment failed!', 'red');
    log('Error:', deployResult.error, 'red');
    log('\n🔧 Troubleshooting:', 'yellow');
    log('• Check your Railway CLI is up to date: npm update -g @railway/cli', 'yellow');
    log('• Verify you have the correct permissions', 'yellow');
    log('• Check the Railway dashboard for more details', 'yellow');
    process.exit(1);
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
deployToRailway().catch((error) => {
  log(`\n❌ Deployment failed: ${error.message}`, 'red');
  process.exit(1);
});
