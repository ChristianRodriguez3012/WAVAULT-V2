#!/bin/bash

# ================================================================
# 🎵 WAVAULT V2 - SERVIDOR CON INTEGRACIÓN IA
# ================================================================

clear

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║        🎵  WAVAULT V2 - E-COMMERCE DE BEATS CON IA  🎵       ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# ================================================================
# VARIABLES DE ENTORNO
# ================================================================

export GEMINI_API_KEY='AIzaSyBqreeolm2eh4e0SIoELyDGRT4EaT81aI4'
export NODE_ENV='development'
export PORT=3000

# ================================================================
# VERIFICAR DEPENDENCIAS
# ================================================================

echo "📦 Verificando dependencias..."

# Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 no está instalado"
    exit 1
fi

# Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    exit 1
fi

# Verificar paquetes Python
python3 << 'PYTHON' 2>/dev/null
import sys
required = ['librosa', 'numpy', 'scipy', 'google.generativeai', 'selenium', 'bs4']
missing = []
for pkg in required:
    try:
        __import__(pkg)
    except ImportError:
        missing.append(pkg)

if missing:
    print(f"⚠️  Faltan paquetes Python: {', '.join(missing)}")
    print("   Instala con: pip install -r WAVAULT/backend/requirements.txt")
    sys.exit(1)
else:
    print("✅ Dependencias Python OK")
PYTHON

if [ $? -ne 0 ]; then
    echo "⚠️  Instalando dependencias Python..."
    cd /workspaces/WAVAULT-V2/WAVAULT/backend
    pip install -q -r requirements.txt
fi

echo "✅ Dependencias verificadas"
echo ""

# ================================================================
# DETENER SERVIDOR ANTERIOR
# ================================================================

echo "🔄 Deteniendo servidor anterior (si existe)..."
pkill -9 -f "node server.js" 2>/dev/null || true
sleep 2
echo "✅ Limpieza completada"
echo ""

# ================================================================
# INICIAR SERVIDOR
# ================================================================

cd /workspaces/WAVAULT-V2/WAVAULT/backend

echo "🚀 Iniciando servidor WAVAULT V2..."
echo "   Puerto: $PORT"
echo "   API Key: ${GEMINI_API_KEY:0:20}..."
echo "   Logs: /tmp/wavault_server.log"
echo ""

nohup node server.js > /tmp/wavault_server.log 2>&1 &
SERVER_PID=$!

# Esperar a que el servidor inicie
sleep 3

# Verificar que el servidor está corriendo
if ps -p $SERVER_PID > /dev/null 2>&1; then
    echo "✅ Servidor iniciado correctamente"
    echo "   PID: $SERVER_PID"
    echo ""
else
    echo "❌ Error al iniciar el servidor"
    echo "   Ver logs: tail -f /tmp/wavault_server.log"
    exit 1
fi

# ================================================================
# PRUEBA RÁPIDA
# ================================================================

echo "🧪 Realizando prueba rápida..."
sleep 2

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Servidor respondiendo correctamente (HTTP $HTTP_CODE)"
else
    echo "⚠️  Servidor responde con código: $HTTP_CODE"
fi

echo ""

# ================================================================
# INFORMACIÓN DE USO
# ================================================================

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                   🎉  SERVIDOR ACTIVO  🎉                     ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "📍 URLS:"
echo "   🌐 Aplicación Web:  http://localhost:$PORT"
echo "   📊 API Análisis:    http://localhost:$PORT/api/analyze-beat"
echo "   🏷️  API Metadata:   http://localhost:$PORT/api/enrich-beats-simple"
echo ""
echo "📝 ENDPOINTS DISPONIBLES:"
echo "   POST /api/analyze-beat              - Análisis completo (técnico + IA)"
echo "   POST /api/analyze-beat/inference-only - Solo inferencia IA"
echo "   POST /api/enrich-metadata           - Enriquecimiento con Tunebat"
echo "   POST /api/enrich-beats-simple       - Enriquecimiento simple (Gemini)"
echo ""
echo "🔧 COMANDOS ÚTILES:"
echo "   Ver logs:     tail -f /tmp/wavault_server.log"
echo "   Detener:      pkill -f 'node server.js'"
echo "   Estado:       ps aux | grep 'node server.js'"
echo ""
echo "🧪 PRUEBA RÁPIDA:"
echo "   curl -F \"audio=@ruta/beat.mp3\" http://localhost:$PORT/api/analyze-beat"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅ Sistema listo para usar"
echo "════════════════════════════════════════════════════════════════"
