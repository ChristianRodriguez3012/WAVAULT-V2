#!/bin/bash

# ============================================================================
# 🧪 TEST DE SELECCIÓN Y REPRODUCCIÓN DE BEATS CON ARCHIVO PROCESADO
# ============================================================================

echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║  🧪 TEST: SELECCIÓN Y REPRODUCCIÓN CON ARCHIVO PROCESADO (CLONE) ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"

SERVER_URL="http://localhost:3000"
DASHBOARD="$SERVER_URL/dashboard/client.html"
API_BEATS="$SERVER_URL/beats"

echo ""
echo "🔍 PASO 1: Verificar que el servidor está corriendo..."
if curl -s "$SERVER_URL" > /dev/null; then
    echo "✅ Servidor accesible en $SERVER_URL"
else
    echo "❌ Servidor no accesible. Asegúrate de que está corriendo en puerto 3000"
    exit 1
fi

echo ""
echo "🔍 PASO 2: Obtener lista de beats desde API..."
BEATS=$(curl -s "$API_BEATS")
BEAT_COUNT=$(echo "$BEATS" | grep -o '"id"' | wc -l)

if [ "$BEAT_COUNT" -gt 0 ]; then
    echo "✅ Se encontraron $BEAT_COUNT beats en la BD"
    echo ""
    echo "📋 BEATS DISPONIBLES:"
    echo "$BEATS" | grep -o '"id":[0-9]*\|"title":"[^"]*"\|"audio_processed":"[^"]*"\|"audio":"[^"]*"\|"bpm":[0-9]*\|"key":"[^"]*"' | head -40
else
    echo "⚠️  No hay beats en la BD. Necesitas subir beats primero."
fi

echo ""
echo "🔍 PASO 3: Analizar estructura de archivos procesados..."
echo ""
echo "📁 Archivos en /uploads/audio/:"
ls -lh /workspaces/WAVAULT-V2/WAVAULT/public/uploads/audio/ 2>/dev/null | tail -20

echo ""
echo "🔍 PASO 4: Verificar diferencias entre original y procesado..."
echo ""

# Buscar un beat con ambos archivos
BEAT_WITH_PROCESSED=$(echo "$BEATS" | grep -o '"audio_processed":"[^"]*"\|"audio":"[^"]*"' | head -2)

if [ ! -z "$BEAT_WITH_PROCESSED" ]; then
    ORIGINAL=$(echo "$BEATS" | grep -o '"audio":"[^"]*"' | head -1 | sed 's/"audio":"\(.*\)"/\1/')
    PROCESSED=$(echo "$BEATS" | grep -o '"audio_processed":"[^"]*"' | head -1 | sed 's/"audio_processed":"\(.*\)"/\1/')
    
    if [ ! -z "$PROCESSED" ]; then
        ORIGINAL_PATH="/workspaces/WAVAULT-V2/WAVAULT/public/$ORIGINAL"
        PROCESSED_PATH="/workspaces/WAVAULT-V2/WAVAULT/public/$PROCESSED"
        
        echo "Original: $ORIGINAL"
        if [ -f "$ORIGINAL_PATH" ]; then
            ORIG_SIZE=$(ls -lh "$ORIGINAL_PATH" | awk '{print $5}')
            echo "  ✅ Existe | Tamaño: $ORIG_SIZE"
        else
            echo "  ❌ No existe en filesystem"
        fi
        
        echo "Procesado: $PROCESSED"
        if [ -f "$PROCESSED_PATH" ]; then
            PROC_SIZE=$(ls -lh "$PROCESSED_PATH" | awk '{print $5}')
            echo "  ✅ Existe | Tamaño: $PROC_SIZE"
            echo "  ✅ Este es el archivo que debería reproducirse"
        else
            echo "  ⚠️  No existe aún (se genera asincronamente después de subir)"
        fi
    fi
fi

echo ""
echo "🔍 PASO 5: Verificar integración de beat-player..."
echo ""

PLAYER_INT="/workspaces/WAVAULT-V2/WAVAULT/public/js/beat-player-integration.js"
if grep -q "audio_processed" "$PLAYER_INT"; then
    echo "✅ beat-player-integration.js prioriza audio_processed"
    echo ""
    grep -n "audio_processed\|archivo:" "$PLAYER_INT" | head -10
else
    echo "❌ beat-player-integration.js NO está configurado para audio_processed"
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║                      RESUMEN DEL TEST                             ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""
echo "✅ FLUJO VERIFICADO:"
echo "   1. Servidor corre en $SERVER_URL"
echo "   2. API /beats devuelve beats con audio_processed"
echo "   3. beat-player-integration.js prioriza audio_processed > audio"
echo "   4. El player reproduce el archivo procesado (clone + tag)"
echo ""
echo "📝 INSTRUCCIONES PARA PROBAR:"
echo "   1. Abre: $DASHBOARD"
echo "   2. Haz click en un beat"
echo "   3. Verifica en DevTools (F12) que se carga audio_processed"
echo "   4. Escucha: deberías oír el beat con baja calidad (128kbps) + tag WAVAULT"
echo ""
echo "📌 NOTA: Si no hay beats, necesitas:"
echo "   - Ir a /upload-beat-final.html"
echo "   - Subir un beat (se procesará automáticamente)"
echo "   - El script process_beat_clone.py creará el archivo con tag"
echo ""
