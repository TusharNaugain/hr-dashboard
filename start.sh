#!/bin/bash
# HR Automation Dashboard - Startup Script

echo "🚀 Starting HR Automation Dashboard..."
echo ""

# Kill any existing processes on the ports
echo "🔄 Clearing previous instances..."
pkill -f "node server.js" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 1

# Start both via npm run dev
echo "📡 Starting Backend API and Frontend..."
cd "$(dirname "$0")"
npm run dev &
DEV_PID=$!
sleep 4

echo ""
echo "═══════════════════════════════════════════════"
echo "  ✅ HR Dashboard is running!"
echo "  🌐 Open: http://localhost:5173"
echo "  📊 API:  http://localhost:3001/api/dashboard"
echo "═══════════════════════════════════════════════"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait and cleanup on exit
trap "echo '⏹ Stopping servers...'; kill $DEV_PID 2>/dev/null; pkill -f 'node server.js' 2>/dev/null; pkill -f 'vite' 2>/dev/null; exit 0" INT TERM
wait
