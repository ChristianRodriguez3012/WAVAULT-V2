#!/bin/bash
# Script para iniciar el servidor WAVAULT y probar el flujo

echo "🚀 ===== INICIAR SERVIDOR WAVAULT ====="
echo ""

# 1. Verificar variables de entorno
echo "🔐 Verificando configuración..."
if [ -z "$GEMINI_API_KEY" ]; then
    echo "⚠️  ADVERTENCIA: GEMINI_API_KEY no está configurada"
    echo "   Para tags con IA, configure: export GEMINI_API_KEY=tu_clave"
else
    echo "✅ GEMINI_API_KEY configurada"
fi
echo ""

# 2. Verificar Node.js y dependencias
echo "📦 Verificando dependencias..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    exit 1
fi
echo "✅ Node.js: $(node --version)"

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 no está instalado"
    exit 1
fi
echo "✅ Python 3: $(python3 --version)"
echo ""

# 3. Iniciar servidor
echo "🎵 Iniciando servidor WAVAULT..."
cd /workspaces/WAVAULT-V2/WAVAULT/backend

# Limpiar BD si es necesario (descomentar si quieres fresh start)
# rm -f wavault.db
# echo "🗑️  BD reiniciada"

# Iniciar Node.js
node server.js &
SERVER_PID=$!
echo "✅ Servidor iniciado (PID: $SERVER_PID)"
echo ""

# 4. Mostrar instrucciones
echo "═════════════════════════════════════════════════════════════"
echo "🌐 ACCESO A LA APLICACIÓN:"
echo "═════════════════════════════════════════════════════════════"
echo ""
echo "🔗 URL Principal:      http://localhost:3000"
echo "🔗 Login:              http://localhost:3000/login.html"
echo "🔗 Registro:           http://localhost:3000/register.html"
echo "🔗 Subir Beat:         http://localhost:3000/upload-beat"
echo ""
echo "═════════════════════════════════════════════════════════════"
echo "📝 PRUEBAS DE ENDPOINT:"
echo "═════════════════════════════════════════════════════════════"
echo ""
echo "1️⃣  Probar parse de nombre (parse_filename_ai.py):"
echo "   curl -X POST http://localhost:3000/api/parse-filename \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"filename\": \"Sicko Mode - Travis Scott Type Beat - Travis Scott - Gm - 140.mp3\"}'"
echo ""
echo "2️⃣  Subir y analizar beat (requiere archivo MP3):"
echo "   curl -X POST http://localhost:3000/api/analyze-beat \\"
echo "     -F \"audio=@/ruta/a/beat.mp3\""
echo ""
echo "═════════════════════════════════════════════════════════════"
echo "⌨️  COMANDOS ÚTILES:"
echo "═════════════════════════════════════════════════════════════"
echo ""
echo "Ver logs:            tail -f /dev/stderr"
echo "Ver PID del servidor: echo $SERVER_PID"
echo "Detener servidor:    kill $SERVER_PID"
echo ""
echo "═════════════════════════════════════════════════════════════"
echo "📋 FLUJO DE PRUEBA MANUAL:"
echo "═════════════════════════════════════════════════════════════"
echo ""
echo "1. Abre: http://localhost:3000/login.html"
echo "2. O registrate en: http://localhost:3000/register.html"
echo "3. Accede a: http://localhost:3000/upload-beat"
echo "4. Selecciona un archivo MP3 con nombre tipo:"
echo "   'Sicko Mode - Travis Scott Type Beat - Travis Scott - Gm - 140.mp3'"
echo "5. Sistema analizará automáticamente"
echo "6. Modal mostrará confianza por fuente"
echo "7. Acepta y el beat se guardará en la BD"
echo ""
echo "═════════════════════════════════════════════════════════════"
echo "✅ SERVIDOR LISTO"
echo "═════════════════════════════════════════════════════════════"
echo ""
echo "Presiona Ctrl+C para detener el servidor"
echo ""

# Mantener el script corriendo
wait $SERVER_PID
