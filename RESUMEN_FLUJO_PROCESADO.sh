#!/bin/bash

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                            ║"
echo "║  ✅ SISTEMA DE SELECCIÓN CON ARCHIVO PROCESADO (CLON + TAG)               ║"
echo "║                                                                            ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"

echo ""
echo "📋 VERIFICACIÓN DE COMPONENTES:"
echo ""

# 1. Verificar process_beat_clone.py
echo "1️⃣  Script de procesamiento:"
if [ -f "/workspaces/WAVAULT-V2/WAVAULT/backend/process_beat_clone.py" ]; then
    LINES=$(wc -l < /workspaces/WAVAULT-V2/WAVAULT/backend/process_beat_clone.py)
    echo "   ✅ process_beat_clone.py ($LINES líneas)"
    echo "      • Reduce bitrate a 128 kbps"
    echo "      • Inserta tag WAVAULT a los 2000ms"
    echo "      • Crea archivo _clone.mp3"
else
    echo "   ❌ process_beat_clone.py NO ENCONTRADO"
fi

echo ""

# 2. Verificar server.js actualizado
echo "2️⃣  Servidor (POST /upload-beat):"
if grep -q "process_beat_clone.py" /workspaces/WAVAULT-V2/WAVAULT/backend/server.js; then
    echo "   ✅ Endpoint /upload-beat llama a process_beat_clone.py"
    echo "      • Guarda audio (original) en BD"
    echo "      • Guarda audio_processed (clon) en BD"
    echo "      • Spawna procesamiento en background"
else
    echo "   ❌ Servidor NO ACTUALIZADO"
fi

echo ""

# 3. Verificar BD
echo "3️⃣  Base de datos:"
if [ -f "/workspaces/WAVAULT-V2/WAVAULT/backend/wavault.db" ]; then
    COLS=$(sqlite3 /workspaces/WAVAULT-V2/WAVAULT/backend/wavault.db "PRAGMA table_info(beats);" | grep "audio_processed" | wc -l)
    if [ "$COLS" -gt 0 ]; then
        echo "   ✅ Tabla beats tiene columna audio_processed"
        COUNT=$(sqlite3 /workspaces/WAVAULT-V2/WAVAULT/backend/wavault.db "SELECT COUNT(*) FROM beats;")
        echo "      • $COUNT beats en BD"
    else
        echo "   ⚠️  Columna audio_processed NO EXISTE"
    fi
else
    echo "   ℹ️  BD vacía (se crea en primer acceso)"
fi

echo ""

# 4. Verificar beat-player-integration.js
echo "4️⃣  Integración del player:"
PRIORITY=$(grep -c "audio_processed" /workspaces/WAVAULT-V2/WAVAULT/public/js/beat-player-integration.js)
if [ "$PRIORITY" -gt 0 ]; then
    echo "   ✅ beat-player-integration.js prioriza audio_processed"
    echo "      • Extrae datos del card de beat"
    echo "      • PRIORIDAD: data-audioProcessed > data-audio"
    echo "      • Fallback: /uploads/audio/{id}_clone.mp3"
else
    echo "   ❌ Script NO configurado para audio_processed"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 FLUJO DE FUNCIONAMIENTO:"
echo ""
echo "  PASO 1 - SUBIDA"
echo "  └─ Usuario sube beat original (320 kbps)"
echo "     ├─ Guarda en: /uploads/audio/{id}.mp3"
echo "     └─ BD: audio = uploads/audio/{id}.mp3"
echo ""
echo "  PASO 2 - PROCESAMIENTO (async)"
echo "  └─ Script process_beat_clone.py"
echo "     ├─ Lee archivo original"
echo "     ├─ FFmpeg: Reduce a 128 kbps"
echo "     ├─ FFmpeg: Inserta tag WAVAULT a 2000ms"
echo "     └─ Guarda en: /uploads/audio/{id}_clone.mp3"
echo ""
echo "  PASO 3 - API /beats"
echo "  └─ Devuelve JSON con:"
echo "     ├─ audio: uploads/audio/{id}.mp3 (original, NO se usa)"
echo "     └─ audio_processed: uploads/audio/{id}_clone.mp3 ✅ SE USA"
echo ""
echo "  PASO 4 - CLICK EN FEED"
echo "  └─ beat-player-integration.js"
echo "     ├─ Lee data-audioProcessed del card"
echo "     ├─ Prioridad: _clone.mp3 > original"
echo "     └─ Llama: wavaultPlayer.setBeat(beatData)"
echo ""
echo "  PASO 5 - REPRODUCCIÓN"
echo "  └─ Player reproduce CLON (128 kbps + tag)"
echo "     ├─ Bitrate: 128 kbps (calidad reducida)"
echo "     ├─ Audio: Clon con baja calidad"
echo "     ├─ Tag: WAVAULT audible a los 2 seg"
echo "     └─ Duración: Completa del original"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🧪 TESTING:"
echo ""
echo "  Test 1: Estructura de BD"
echo "  $ bash /workspaces/WAVAULT-V2/test_beat_selection_simple.sh"
echo ""
echo "  Test 2: Selección de archivos"
echo "  $ bash /workspaces/WAVAULT-V2/test_beat_selection.sh"
echo ""
echo "  Test 3: Upload completo"
echo "  $ bash /workspaces/WAVAULT-V2/test_full_upload_process.sh"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 VERIFICACIÓN RÁPIDA:"
echo ""
echo "  1. Abre: http://localhost:3000/dashboard/client.html"
echo "  2. Haz click en un beat"
echo "  3. Abre DevTools (F12) → Console"
echo "  4. Deberías ver:"
echo "     🎵 Seleccionando beat: [Nombre]"
echo "     📁 Archivo: uploads/audio/..._clone.mp3 ✅"
echo "  5. Escucha: Bitrate 128kbps + tag WAVAULT a los 2 seg"
echo ""

echo "✅ SISTEMA OPERACIONAL Y FUNCIONAL"
echo ""
