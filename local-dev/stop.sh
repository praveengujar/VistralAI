#!/bin/bash

# VistralAI Local Development Stop Script
# This script stops and removes Docker containers

set -e

echo "🛑 VistralAI - Stopping Local Development"
echo "=========================================="
echo ""

# Stop containers
echo "Stopping containers..."
docker-compose down

echo ""
echo "✅ All containers stopped and removed"
echo ""
echo "To start again, run:"
echo "   ./start.sh"
echo ""
