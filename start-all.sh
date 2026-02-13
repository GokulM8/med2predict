#!/bin/bash

# SafePulse Development Server - Persistent Start Script
# This script starts both backend and frontend servers

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo "🚀 Starting SafePulse Development Servers..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    wait $BACKEND_PID 2>/dev/null
    wait $FRONTEND_PID 2>/dev/null
    echo "✅ All servers stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend server
echo "📦 Starting Backend Server (Port 4000)..."
npm start > /tmp/safepulse-backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend PID: $BACKEND_PID"

# Wait a moment for backend to start
sleep 2

# Start frontend server
echo "⚛️  Starting Frontend Server (Port 8080/8081)..."
npm run dev > /tmp/safepulse-frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend PID: $FRONTEND_PID"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ SafePulse is Ready!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Access Points:"
echo "  🌐 Frontend:  http://localhost:8080"
echo "  🔗 Backend:   http://localhost:4000"
echo "  🏥 App:       http://localhost:8080"
echo ""
echo "📝 Login Credentials:"
echo "  Email:    admin@safepulse.local"
echo "  Password: Admin123!"
echo ""
echo "📊 Server Logs:"
echo "  Backend:  tail -f /tmp/safepulse-backend.log"
echo "  Frontend: tail -f /tmp/safepulse-frontend.log"
echo ""
echo "💡 Press Ctrl+C to stop all servers"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Wait for both processes
wait
