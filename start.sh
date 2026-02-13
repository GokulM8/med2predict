#!/bin/bash

# SafePulse Quick Start - Auto-start both servers
cd "$(dirname "$0")"

echo "🚀 Starting SafePulse..."

# Kill any existing servers
pkill -f "node.*server/index.js" 2>/dev/null
pkill -f "vite" 2>/dev/null

# Start both servers
npm run dev:all

echo ""
echo "✅ SafePulse is running!"
echo "   Frontend: http://localhost:8080"
echo "   Backend:  http://localhost:4000"
echo "   Login:    admin@safepulse.local / Admin123!"
