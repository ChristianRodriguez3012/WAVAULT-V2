#!/usr/bin/env bash
# test-analyze-beat-ai.sh
# Script para testear analyze_beat_ai.py

echo "🧪 Test de analyze_beat_ai.py"
echo "================================"

# Verificar que GEMINI_API_KEY está configurada
if [ -z "$GEMINI_API_KEY" ]; then
    echo "⚠️  GEMINI_API_KEY no está configurada"
    echo "   Configúrala con: export GEMINI_API_KEY='tu_api_key'"
    echo ""
    read -p "¿Deseas continuar sin API Key (solo análisis técnico)? (s/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

# Crear un archivo de audio de prueba con ffmpeg
echo "📝 Generando audio de prueba..."
AUDIO_FILE="/tmp/test_beat.wav"

# Generar un tono de 100 BPM (1.67 Hz = 100 BPM)
ffmpeg -f lavfi -i "sine=f=440:d=10" "$AUDIO_FILE" -y -q:a 9 -acodec libmp3lame 2>/dev/null

if [ ! -f "$AUDIO_FILE" ]; then
    echo "❌ No se pudo crear audio de prueba"
    exit 1
fi

echo "✅ Audio de prueba creado: $AUDIO_FILE"
echo ""

# Ejecutar script de análisis
echo "🔍 Ejecutando analyze_beat_ai.py..."
echo ""

python3 "$(dirname "$0")/analyze_beat_ai.py" "$AUDIO_FILE"

RESULT=$?

# Limpiar
rm -f "$AUDIO_FILE"

if [ $RESULT -eq 0 ]; then
    echo ""
    echo "✅ Test exitoso"
    exit 0
else
    echo ""
    echo "❌ Test falló con código: $RESULT"
    exit 1
fi
