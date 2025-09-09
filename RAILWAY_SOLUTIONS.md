# Railway Deployment Solutions

## Issue: Limited Plan

Your Railway account is on a limited plan that doesn't allow new deployments. Here are your options:

## Option 1: Upgrade Railway Plan (Recommended)

1. **Visit Railway Plans**: https://railway.com/account/plans
2. **Choose a plan**:
   - **Hobby Plan**: $5/month - Perfect for small projects
   - **Pro Plan**: $20/month - For production apps
3. **Upgrade your account**
4. **Run deployment**: `pnpm run deploy:polling`

## Option 2: Use Railway Free Credits

1. **Check your credits**: https://railway.app/account/usage
2. **Add payment method** to get free credits
3. **Try deployment again**: `pnpm run deploy:polling`

## Option 3: Alternative Deployment Platforms

### A. Render.com (Free Tier Available)

```bash
# Create render.yaml
cat > render.yaml << EOF
services:
  - type: worker
    name: snarkels-polling
    env: node
    buildCommand: npm install
    startCommand: node scripts/start-polling-service.js
    envVars:
      - key: ENABLE_POLLING
        value: true
      - key: NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS_CELO
        value: 0x7176D16D61A122231a78749c61740ad8F86BB13a
      - key: NEXT_PUBLIC_PREDICTION_MARKET_CLAIMS_ADDRESS_CELO
        value: 0x1e1ac759e75dA03a39f16ae72B73279A1edf63d6
EOF

# Deploy to Render
# 1. Go to https://render.com
# 2. Connect your GitHub repo
# 3. Select "Web Service"
# 4. Use the render.yaml configuration
```

### B. Heroku (Free Tier Available)

```bash
# Create Procfile
echo "worker: node scripts/start-polling-service.js" > Procfile

# Create app.json
cat > app.json << EOF
{
  "name": "Snarkels Polling Service",
  "description": "Background service for syncing markets",
  "scripts": {
    "worker": "node scripts/start-polling-service.js"
  },
  "formation": {
    "worker": {
      "quantity": 1,
      "size": "free"
    }
  },
  "env": {
    "ENABLE_POLLING": {
      "description": "Enable polling service",
      "value": "true"
    },
    "NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS_CELO": {
      "description": "Core contract address",
      "value": "0x7176D16D61A122231a78749c61740ad8F86BB13a"
    },
    "NEXT_PUBLIC_PREDICTION_MARKET_CLAIMS_ADDRESS_CELO": {
      "description": "Claims contract address", 
      "value": "0x1e1ac759e75dA03a39f16ae72B73279A1edf63d6"
    }
  }
}
EOF

# Deploy to Heroku
# 1. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
# 2. Login: heroku login
# 3. Create app: heroku create snarkels-polling
# 4. Set environment variables
# 5. Deploy: git push heroku main
```

### C. DigitalOcean App Platform

```bash
# Create .do/app.yaml
mkdir -p .do
cat > .do/app.yaml << EOF
name: snarkels-polling
services:
- name: polling-service
  source_dir: /
  github:
    repo: your-username/snarkels
    branch: main
  run_command: node scripts/start-polling-service.js
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: ENABLE_POLLING
    value: "true"
  - key: NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS_CELO
    value: "0x7176D16D61A122231a78749c61740ad8F86BB13a"
  - key: NEXT_PUBLIC_PREDICTION_MARKET_CLAIMS_ADDRESS_CELO
    value: "0x1e1ac759e75dA03a39f16ae72B73279A1edf63d6"
EOF
```

## Option 4: Keep Local Polling Service

If you prefer to keep it simple, you can run the polling service locally:

```bash
# Start the polling service locally
node scripts/start-polling-service.js

# Or use PM2 for process management
npm install -g pm2
pm2 start scripts/start-polling-service.js --name "snarkels-polling"
pm2 save
pm2 startup
```

## Recommendation

**For production**: Upgrade to Railway Hobby plan ($5/month)
**For development**: Run locally with PM2
**For free hosting**: Use Render.com or Heroku

## Next Steps

1. **Choose your preferred option**
2. **Set up the environment variables** (Supabase credentials)
3. **Deploy the polling service**
4. **Test by creating a new market** on your frontend

The polling service will automatically sync new markets to your database! 🎉
