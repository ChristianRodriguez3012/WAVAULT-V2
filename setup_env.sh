#!/bin/bash
# setup_env.sh
# Script para configurar variables de entorno de WAVAULT-V2

echo "🔧 Configurando variables de entorno..."

# Tu API Key de Google Gemini
export GEMINI_API_KEY="AIzaSyBqreeolm2eh4e0SIoELyDGRT4EaT81aI4"

# Directorio del proyecto
export WAVAULT_DIR="/workspaces/WAVAULT-V2/WAVAULT"
export WAVAULT_BACKEND="$WAVAULT_DIR/backend"
export WAVAULT_PUBLIC="$WAVAULT_DIR/public"

# Variables de servidor
export SERVER_PORT=3000
export SERVER_HOST="localhost"

echo "✅ Variables configuradas:"
echo "  GEMINI_API_KEY: Configurada"
echo "  WAVAULT_DIR: $WAVAULT_DIR"
echo "  SERVER_PORT: $SERVER_PORT"
echo ""
echo "💡 Para usar estas variables en todas las sesiones:"
echo "   Agregar esta línea a tu ~/.bashrc o ~/.zshrc:"
echo "   source /workspaces/WAVAULT-V2/setup_env.sh"
