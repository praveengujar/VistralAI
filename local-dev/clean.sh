#!/bin/bash

# VistralAI Local Development Clean Script
# This script stops containers and removes all volumes and data

set -e

echo "🧹 VistralAI - Clean Development Environment"
echo "============================================="
echo ""
echo "⚠️  WARNING: This will remove all containers, volumes, and cached data!"
echo ""
read -p "Are you sure you want to continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

echo ""
echo "Stopping and removing containers..."
docker-compose down -v

echo ""
echo "Removing Docker images..."
docker rmi vistralai-dev 2>/dev/null || echo "No image to remove"

echo ""
echo "✅ Environment cleaned!"
echo ""
echo "Next run will rebuild everything from scratch."
echo ""
echo "To start fresh, run:"
echo "   ./start.sh"
echo ""
