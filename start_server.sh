#!/bin/bash
# start_server.sh
# Script para iniciar el servidor con variables de entorno

# Set working directory to the script's location
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/WAVAULT/backend"

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    echo "✅ Loading environment variables from .env file"
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "⚠️  No .env file found, using default configuration"
    export GEMINI_API_KEY="AIzaSyBqreeolm2eh4e0SIoELyDGRT4EaT81aI4"
fi

echo "🚀 Starting WAVAULT server..."
node server.js
