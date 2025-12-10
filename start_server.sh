#!/bin/bash
# start_server.sh
# Script para iniciar el servidor WAVAULT

# Set working directory to the script's location
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/WAVAULT/backend"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ No .env file found. Please create one with your GEMINI_API_KEY"
    echo "See ../../GOOGLE_API_SETUP.md for instructions"
    exit 1
fi

echo "✅ .env file found"
echo "🚀 Starting WAVAULT server..."
# Node.js dotenv package will load environment variables automatically
node server.js
