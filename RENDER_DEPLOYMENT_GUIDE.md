# Render.com Deployment Guide

## Step 1: Prepare Your Repository

1. **Commit all changes to Git:**
   ```bash
   git add .
   git commit -m "Add Render deployment configuration"
   git push origin main
   ```

2. **Make sure your repository is on GitHub/GitLab/Bitbucket**

## Step 2: Deploy to Render

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click "New +"** → **"Web Service"**
3. **Connect your repository** (GitHub/GitLab/Bitbucket)
4. **Select your repository** and branch (usually `main`)

## Step 3: Configure the Service

1. **Service Type**: Select "Background Worker" (not Web Service)
2. **Name**: `snarkels-polling-service`
3. **Environment**: `Node`
4. **Build Command**: `npm install`
5. **Start Command**: `node scripts/start-polling-service.js`

## Step 4: Set Environment Variables

In the Render dashboard, go to "Environment" tab and add:

```
ENABLE_POLLING=true
NODE_ENV=production
NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS_CELO=0x7176D16D61A122231a78749c61740ad8F86BB13a
NEXT_PUBLIC_PREDICTION_MARKET_CLAIMS_ADDRESS_CELO=0x1e1ac759e75dA03a39f16ae72B73279A1edf63d6
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

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

Your polling service will now run continuously on Render! 🎉