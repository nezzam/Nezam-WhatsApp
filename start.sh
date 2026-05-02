#!/bin/bash

# Navigate to the script's directory
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

echo "========================================="
echo "  Nezam WhatsApp - Dev Launcher"
echo "========================================="

# ── Kill any leftover processes ──────────────
echo "[1/4] Cleaning up old processes..."
pkill -f "node server.js" 2>/dev/null
pkill -f "vite"           2>/dev/null
sleep 1

# ── MongoDB ──────────────────────────────────
echo "[2/4] Starting MongoDB..."
mkdir -p "$ROOT_DIR/data/db"
if pgrep -x "mongod" > /dev/null; then
    echo "       MongoDB already running."
else
    mongod --dbpath "$ROOT_DIR/data/db" \
           --logpath "$ROOT_DIR/data/mongod.log" \
           --fork
    echo "       MongoDB started."
fi

# ── Backend ──────────────────────────────────
echo "[3/4] Starting Backend (port 5000)..."
cd "$ROOT_DIR/backend"
npm install --silent
nohup node server.js > /tmp/whatsapp_backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to be ready
for i in $(seq 1 15); do
    sleep 1
    curl -sf http://127.0.0.1:5000/health > /dev/null 2>&1 && break
done

# ── Frontend ─────────────────────────────────
echo "[4/4] Starting Frontend (port 3000)..."
cd "$ROOT_DIR/app"
npm install --silent
nohup npx vite --host 127.0.0.1 --port 3000 > /tmp/whatsapp_frontend.log 2>&1 &
FRONTEND_PID=$!

sleep 3

echo ""
echo "========================================="
echo "  ✓ Backend  → http://localhost:5000 (API only)"
echo "  ✓ Frontend → http://localhost:3000  ← افتح هذا"
echo "========================================="
echo ""
echo "  Logs: tail -f /tmp/whatsapp_backend.log"
echo "        tail -f /tmp/whatsapp_frontend.log"
echo ""
echo "  Press Ctrl+C to stop all servers."
echo "========================================="

# Graceful shutdown on Ctrl+C
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    pkill -f "node server.js" 2>/dev/null
    pkill -f "vite"           2>/dev/null
    pkill -x "mongod"         2>/dev/null
    echo "Done."
    exit 0
}
trap cleanup SIGINT SIGTERM

# Keep script alive
while true; do sleep 5; done

