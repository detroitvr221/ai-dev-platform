#!/bin/bash

echo "🚀 Deploying AI Development Platform to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Check if user is logged in
if ! railway whoami &> /dev/null; then
    echo "🔐 Please login to Railway first:"
    echo "railway login"
    exit 1
fi

# Build the project
echo "🔨 Building project..."
cd frontend && npm run build && cd ..

# Deploy to Railway
echo "🚂 Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo "🌐 Your app should be available at the URL shown above"
echo ""
echo "📝 Next steps:"
echo "1. Set your OPENAI_API_KEY in Railway dashboard"
echo "2. Configure your custom domain if needed"
echo "3. Test the deployment"
