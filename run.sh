#!/bin/bash

# Run script for lobby-demo project
# Starts both the Go server and the Vite dev server

set -e

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "Shutting down..."
    kill $SERVER_PID 2>/dev/null || true
    kill $CLIENT_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Kill any existing processes on our ports
echo "Cleaning up existing processes..."
lsof -ti:8080 | xargs -r kill -9 2>/dev/null || true
lsof -ti:5173 | xargs -r kill -9 2>/dev/null || true
sleep 1

echo "Starting lobby-demo..."

# Start the Go server
echo "Starting Go server..."
cd server
go run . &
SERVER_PID=$!
cd ..

# Give the server a moment to start
sleep 1

# Start the Vite dev server
echo "Starting Vite dev server..."
cd client
npm run dev &
CLIENT_PID=$!
cd ..

echo ""
echo "Both servers are running!"
echo "  Go server: http://localhost:8080"
echo "  Client:    http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers."

# Wait for both processes
wait
