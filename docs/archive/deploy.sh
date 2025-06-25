#!/bin/bash

# SWARM Local Deployment Script
echo "🚀 Deploying SWARM locally..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build production bundle
echo "🔨 Building production bundle..."
npm run build:prod

# Start production server
echo "🌐 Starting SWARM server..."
export NODE_ENV=production
export PORT=${PORT:-5000}

echo "✅ SWARM deployed successfully!"
echo "🌍 Access your application at: http://localhost:${PORT}"
echo "🔗 With custom domain: Configure DNS to point to your public IP"

npm start