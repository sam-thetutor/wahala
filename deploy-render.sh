#!/bin/bash

echo "🚀 Deploying Polling Service to Render.com"
echo "=========================================="

# Check if git is available
if ! command -v git &> /dev/null; then
    echo "❌ Git not found. Please install Git first."
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a Git repository. Please initialize Git first:"
    echo "git init"
    echo "git remote add origin your-repo-url"
    exit 1
fi

# Run the Render setup
echo "🔧 Setting up Render configuration..."
node scripts/deploy-to-render.js

if [ $? -ne 0 ]; then
    echo "❌ Render setup failed. Please fix the issues above and try again."
    exit 1
fi

# Commit changes
echo "📝 Committing changes..."
git add .
git commit -m "Add Render deployment configuration for polling service"

if [ $? -ne 0 ]; then
    echo "❌ Git commit failed. Please check your Git status."
    exit 1
fi

# Push to remote
echo "🚀 Pushing to remote repository..."
git push origin main

if [ $? -ne 0 ]; then
    echo "❌ Git push failed. Please check your remote repository."
    echo "Make sure you have a remote repository set up:"
    echo "git remote add origin your-repo-url"
    exit 1
fi

echo ""
echo "✅ Code pushed to repository!"
echo ""
echo "🎉 Next steps:"
echo "1. Go to: https://dashboard.render.com"
echo "2. Click 'New +' → 'Background Worker'"
echo "3. Connect your repository"
echo "4. Follow the guide in: RENDER_DEPLOYMENT_GUIDE.md"
echo ""
echo "💡 Your polling service will run continuously on Render (free tier)!"
