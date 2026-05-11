#!/bin/bash
# HR Automation Dashboard - Startup Script

echo "🚀 Starting HR Automation Dashboard..."
echo ""

# Kill any existing processes on the ports
echo "🔄 Clearing ports 3001 and 5173..."
pkill -f "node server.js" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 1

# Start backend
echo "📡 Starting Backend API on port 3001..."
cd "$(dirname "$0")/backend"
node server.js &
BACKEND_PID=$!
sleep 2

# Verify backend
if curl -s http://localhost:3001/api/dashboard > /dev/null; then
  echo "✅ Backend running at http://localhost:3001"
else
  echo "❌ Backend failed to start!"
  exit 1
fi

# Start frontend
echo "🎨 Starting Frontend on port 5173..."
cd "$(dirname "$0")/frontend"
npm run dev &
FRONTEND_PID=$!
sleep 3

echo ""
echo "═══════════════════════════════════════════════"
echo "  ✅ HR Dashboard is running!"
echo "  🌐 Open: http://localhost:5173"
echo "  📊 API:  http://localhost:3001/api/dashboard"
echo "═══════════════════════════════════════════════"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait and cleanup on exit
trap "echo '⏹ Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
