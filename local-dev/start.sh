#!/bin/bash

# VistralAI Local Development Quick Start Script
# This script starts the Docker containers for local development

set -e

echo "🚀 VistralAI - Local Development"
echo "================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running!"
    echo ""
    echo "Please start Docker Desktop and try again."
    echo "   → Open Docker Desktop from Applications"
    echo "   → Wait for Docker to start (whale icon in menu bar)"
    echo ""
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local not found, creating from example..."
    cp .env.local.example .env.local
    echo "✅ Created .env.local"
    echo ""
fi

# Start docker-compose
echo "📦 Starting VistralAI containers..."
echo "   This may take a few minutes on first run (downloading images)"
echo ""

docker-compose up

# This will run when user stops the containers (Ctrl+C)
echo ""
echo "🛑 Stopping containers..."
docker-compose down

echo ""
echo "✅ All containers stopped"
echo ""
echo "To start again, run:"
echo "   ./start.sh"
echo ""
