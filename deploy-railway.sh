#!/bin/bash

# MARQUE Frontend - Railway Deployment Script
echo "🚀 Deploying MARQUE Frontend to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "🔐 Logging into Railway..."
railway login

# Initialize Railway project (if not already initialized)
if [ ! -f "railway.toml" ]; then
    echo "📝 Initializing Railway project..."
    railway init
fi

# Set environment variables
echo "🔧 Setting environment variables..."
railway variables set NODE_ENV=production
railway variables set NEXT_PUBLIC_API_URL=https://marquebackend-production.up.railway.app/api/v1
railway variables set NEXT_PUBLIC_APP_URL=https://marque.website

# Build and deploy
echo "🏗️  Building and deploying..."
railway up

echo "✅ Deployment complete!"
echo "📱 Your app will be available at: https://marque.website"
echo "🔗 Railway dashboard: https://railway.app/dashboard"
