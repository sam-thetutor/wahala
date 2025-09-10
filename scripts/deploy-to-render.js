#!/usr/bin/env node

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

function loadEnvVars() {
  const envPath = path.join(process.cwd(), '.env');
  const envVars = {};
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    });
  }
  
  return envVars;
}

async function deployToRender() {
  log('🚀 Render.com Deployment Setup for Polling Service', 'cyan');
  log('================================================', 'cyan');
  
  // Load environment variables
  log('\n📋 Loading environment variables...', 'blue');
  const envVars = loadEnvVars();
  
  if (envVars.NEXT_PUBLIC_SUPABASE_URL && envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    log('✅ Supabase credentials found in .env', 'green');
  } else {
    log('⚠️  Supabase credentials not found in .env', 'yellow');
    log('You will need to set these in the Render dashboard:', 'yellow');
    log('• NEXT_PUBLIC_SUPABASE_URL', 'cyan');
    log('• NEXT_PUBLIC_SUPABASE_ANON_KEY', 'cyan');
  }
  
  // Create render.yaml
  log('\n📝 Creating render.yaml configuration...', 'blue');
  
  const renderConfig = `services:
  - type: worker
    name: snarkels-polling-service
    env: node
    buildCommand: npm install
    startCommand: node scripts/start-polling-service.js
    envVars:
      - key: ENABLE_POLLING
        value: true
      - key: NODE_ENV
        value: production
      - key: NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS_CELO
        value: 0x35f61008878b85B4239C1EF714989B236757a283
      - key: NEXT_PUBLIC_PREDICTION_MARKET_CLAIMS_ADDRESS_CELO
        value: 0x2FDd27190d3A7EB376f06D391d7e0F4fF7811350
      # Note: You'll need to set these in Render dashboard:
      # - NEXT_PUBLIC_SUPABASE_URL
      # - NEXT_PUBLIC_SUPABASE_ANON_KEY`;

  fs.writeFileSync('render.yaml', renderConfig);
  log('✅ render.yaml created', 'green');
  
  // Create deployment guide
  log('\n📋 Creating deployment guide...', 'blue');
  
  const deploymentGuide = `# Render.com Deployment Guide

## Step 1: Prepare Your Repository

1. **Commit all changes to Git:**
   \`\`\`bash
   git add .
   git commit -m "Add Render deployment configuration"
   git push origin main
   \`\`\`

2. **Make sure your repository is on GitHub/GitLab/Bitbucket**

## Step 2: Deploy to Render

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click "New +"** → **"Web Service"**
3. **Connect your repository** (GitHub/GitLab/Bitbucket)
4. **Select your repository** and branch (usually \`main\`)

## Step 3: Configure the Service

1. **Service Type**: Select "Background Worker" (not Web Service)
2. **Name**: \`snarkels-polling-service\`
3. **Environment**: \`Node\`
4. **Build Command**: \`npm install\`
5. **Start Command**: \`node scripts/start-polling-service.js\`

## Step 4: Set Environment Variables

In the Render dashboard, go to "Environment" tab and add:

\`\`\`
ENABLE_POLLING=true
NODE_ENV=production
NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS_CELO=0x7176D16D61A122231a78749c61740ad8F86BB13a
NEXT_PUBLIC_PREDICTION_MARKET_CLAIMS_ADDRESS_CELO=0x1e1ac759e75dA03a39f16ae72B73279A1edf63d6
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
\`\`\`

## Step 5: Deploy

1. **Click "Create Web Service"**
2. **Wait for deployment** (usually 2-5 minutes)
3. **Check logs** to ensure it's working

## Step 6: Monitor

- **View logs**: Click on your service → "Logs" tab
- **Check status**: Service should show "Live" status
- **Test**: Create a new market on your frontend to test sync

## Troubleshooting

- **Build fails**: Check that all dependencies are in package.json
- **Service crashes**: Check logs for error messages
- **No sync**: Verify environment variables are set correctly

## Benefits of Render

✅ **Free tier available** (750 hours/month)
✅ **Automatic deployments** from Git
✅ **Easy environment variable management**
✅ **Built-in logging and monitoring**
✅ **Automatic restarts** on crashes
✅ **No credit card required** for free tier

Your polling service will now run continuously on Render! 🎉`;

  fs.writeFileSync('RENDER_DEPLOYMENT_GUIDE.md', deploymentGuide);
  log('✅ Deployment guide created', 'green');
  
  // Show next steps
  log('\n🎉 Render deployment setup complete!', 'green');
  log('\n📋 Next steps:', 'blue');
  log('1. Commit your changes: git add . && git commit -m "Add Render config"', 'cyan');
  log('2. Push to GitHub: git push origin main', 'cyan');
  log('3. Go to: https://dashboard.render.com', 'cyan');
  log('4. Follow the guide in: RENDER_DEPLOYMENT_GUIDE.md', 'cyan');
  
  log('\n💡 The polling service will:', 'magenta');
  log('• Run continuously on Render (free tier)', 'green');
  log('• Poll blockchain every 10 seconds for new markets', 'green');
  log('• Automatically sync new markets to your database', 'green');
  log('• Restart automatically if it crashes', 'green');
  log('• Deploy automatically when you push to Git', 'green');
  
  log('\n🔧 Don\'t forget to set your Supabase environment variables in Render!', 'yellow');
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

// Run the deployment setup
deployToRender().catch((error) => {
  log(`\n❌ Setup failed: ${error.message}`, 'red');
  process.exit(1);
});
