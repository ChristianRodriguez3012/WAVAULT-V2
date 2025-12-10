#!/bin/bash

# =================================================================
# DEMO: ANÁLISIS DE BEATS CON EL SERVIDOR
# =================================================================

cd /workspaces/WAVAULT-V2/WAVAULT/backend

echo "════════════════════════════════════════════════════════════"
echo "🎯 DEMO: ANÁLISIS DE BEATS EN VIVO"
echo "════════════════════════════════════════════════════════════"

# Encontrar un archivo de audio real
AUDIO_FILE=$(find /workspaces/WAVAULT-V2 -type f \( -name "*.mp3" -o -name "*.wav" \) 2>/dev/null | head -1)

if [ -z "$AUDIO_FILE" ]; then
    echo "⚠️  No se encontró archivo de audio. Usando test generado..."
    AUDIO_FILE="/tmp/test_128bpm.wav"
fi

FILENAME=$(basename "$AUDIO_FILE")
echo "📄 Analizando: $FILENAME"
echo "📍 Ruta: $AUDIO_FILE"
echo ""

# Test 1: Análisis completo
echo "🔹 TEST 1: Análisis Completo"
echo "─────────────────────────────────────────"
curl -s -F "audio=@$AUDIO_FILE" http://localhost:3000/api/analyze-beat 2>/dev/null | python3 << 'PYTHON'
import json, sys
data = json.load(sys.stdin)
if data.get('success'):
    tech = data['analysis']['technical_data']
    ai = data['analysis']['ai_inference']
    print(f"✅ Análisis exitoso\n")
    print(f"BPM:      {tech['bpm']} (confianza: {tech['bpm_confidence']}%)")
    print(f"KEY:      {tech['key']} (confianza: {tech['key_confidence']}%)")
    print(f"DURATION: {tech['duration']}s")
    print(f"LUFS:     {tech['lufs']}")
    print(f"MOOD:     {ai['mood']}")
    print(f"TAGS:     {', '.join(ai['tags'][:8])}...")
else:
    print(f"❌ {data.get('message', 'Error desconocido')}")
PYTHON

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ DEMO COMPLETADA"
echo "════════════════════════════════════════════════════════════"
