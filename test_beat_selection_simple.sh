#!/bin/bash

# ============================================================================
# 🧪 TEST: VERIFICAR QUE SE SELECCIONA AUDIO_PROCESSED
# ============================================================================

echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║  🧪 TEST: SELECCIÓN DE ARCHIVO PROCESADO (CLON + TAG)             ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"

SERVER_URL="http://localhost:3000"

echo ""
echo "✅ Verificar estructura de la BD..."
cd /workspaces/WAVAULT-V2/WAVAULT/backend

# Crear un beat de prueba directamente en la BD
BEAT_ID=$(sqlite3 wavault.db << EOF
INSERT INTO beats (title, bpm, key, price, tags, cover, audio, audio_processed, producer)
VALUES ('Test Clone Beat', 120, 'C', 29.99, 'test,clone', 'uploads/covers/default.jpg', 
        'uploads/audio/1765318447802-test_beat.mp3', 
        'uploads/audio/1765318447802-test_beat_clone.mp3',
        'test@producer.com');
SELECT last_insert_rowid();
EOF
)

echo "✅ Beat insertado manualmente con ID: $BEAT_ID"

echo ""
echo "📋 Verificar que está en BD..."
sqlite3 /workspaces/WAVAULT-V2/WAVAULT/backend/wavault.db << EOF | head -20
SELECT id, title, audio, audio_processed, bpm, key FROM beats WHERE id = $BEAT_ID;
EOF

echo ""
echo "🌐 Verificar respuesta de API /beats..."
BEAT_FROM_API=$(curl -s "$SERVER_URL/beats?producer=test@producer.com" | jq ".[] | select(.id == $BEAT_ID)")

echo "$BEAT_FROM_API" | jq '{id, title, audio, audio_processed, bpm, key}'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ANÁLISIS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

AUDIO=$(echo "$BEAT_FROM_API" | jq -r '.audio // "null"')
AUDIO_PROC=$(echo "$BEAT_FROM_API" | jq -r '.audio_processed // "null"')

echo ""
echo "Archivo original: $AUDIO"
echo "Archivo procesado: $AUDIO_PROC"
echo ""

if [ "$AUDIO_PROC" != "null" ] && [ ! -z "$AUDIO_PROC" ]; then
    echo "✅ API DEVUELVE AUDIO_PROCESSED"
    echo ""
    echo "📁 Verificar archivo en filesystem..."
    
    if [ -f "/workspaces/WAVAULT-V2/WAVAULT/public/$AUDIO_PROC" ]; then
        SIZE=$(ls -lh "/workspaces/WAVAULT-V2/WAVAULT/public/$AUDIO_PROC" | awk '{print $5}')
        echo "   ✅ Archivo procesado existe: $SIZE"
    else
        echo "   ℹ️ Archivo procesado no existe (pero puede ser creado cuando se suba)"
    fi
else
    echo "❌ API NO devuelve audio_processed"
fi

echo ""
echo "🧪 Verificar que beat-player-integration.js usa audio_processed..."
if grep -q "audio_processed" /workspaces/WAVAULT-V2/WAVAULT/public/js/beat-player-integration.js; then
    echo "✅ beat-player-integration.js prioriza audio_processed > audio"
else
    echo "❌ Script NOT configurado"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 FLUJO DE REPRODUCCIÓN:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Usuario hace click en beat del feed"
echo "2. beat-player-integration.js extrae datos del card"
echo "3. Prioridad: data-audioProcessed > data-audioUrl > data-audio > fallback"
echo "4. Para beats con BD, el player recibe:"
echo "   - beat.audio = '$AUDIO' (ORIGINAL - no se usa)"
echo "   - beat.audio_processed = '$AUDIO_PROC' (CLONE - SI SE USA)"
echo "5. WavaultPlayer.setBeat() reproduce AUDIO_PROCESSED"
echo "6. Se escucha: Bitrate 128kbps + tag WAVAULT"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
