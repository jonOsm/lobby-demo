#!/bin/bash

# Setup script for lobby-demo project
# Prerequisites: Go 1.24+, Node.js 18+, npm

set -e

echo "Setting up lobby-demo project..."

# Install server dependencies
echo "Installing Go dependencies..."
cd server
go mod download
cd ..

# Install client dependencies
echo "Installing client dependencies..."
cd client
npm install
cd ..

# Install root dependencies (for tests)
echo "Installing test dependencies..."
npm install

echo "Setup complete!"
echo ""
echo "To run the project, execute: ./run.sh"
