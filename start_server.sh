#!/bin/bash
# start_server.sh
# Script para iniciar el servidor con variables de entorno

# Set working directory to the script's location
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/WAVAULT/backend"

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    echo "✅ Loading environment variables from .env file"
    # Use dotenv to safely load environment variables
    set -a
    source .env
    set +a
else
    echo "❌ No .env file found. Please create one with your GEMINI_API_KEY"
    echo "See GOOGLE_API_SETUP.md for instructions"
    exit 1
fi

echo "🚀 Starting WAVAULT server..."
node server.js
