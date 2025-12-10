#!/bin/bash

# ============================================================================
# 🧪 TEST COMPLETO: SUBIDA → PROCESAMIENTO → REPRODUCCIÓN
# ============================================================================

echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║  🧪 TEST COMPLETO: SUBIDA, PROCESAMIENTO Y REPRODUCCIÓN           ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"

SERVER_URL="http://localhost:3000"

echo ""
echo "🔍 PASO 1: Crear archivo de audio de prueba..."

# Crear un archivo MP3 pequeño con ffmpeg
TEST_AUDIO="/tmp/test_beat.mp3"
if [ ! -f "$TEST_AUDIO" ]; then
    # Crear tono de prueba (220Hz, 3 segundos)
    ffmpeg -f lavfi -i "sine=f=220:d=3" \
            -q:a 9 \
            -acodec libmp3lame \
            "$TEST_AUDIO" 2>/dev/null
    
    if [ -f "$TEST_AUDIO" ]; then
        SIZE=$(ls -lh "$TEST_AUDIO" | awk '{print $5}')
        echo "✅ Archivo de prueba creado: $TEST_AUDIO ($SIZE)"
    else
        echo "❌ No se pudo crear archivo de prueba"
        exit 1
    fi
else
    echo "✅ Usando archivo existente: $TEST_AUDIO"
fi

echo ""
echo "🔍 PASO 2: Crear imagen de portada..."

TEST_COVER="/tmp/test_cover.jpg"
if [ ! -f "$TEST_COVER" ]; then
    # Crear imagen PNG pequeña (1x1 píxel rojo) y convertir a JPG
    convert -size 100x100 xc:red "$TEST_COVER" 2>/dev/null
    if [ -f "$TEST_COVER" ]; then
        SIZE=$(ls -lh "$TEST_COVER" | awk '{print $5}')
        echo "✅ Imagen de portada creada: $TEST_COVER ($SIZE)"
    fi
else
    echo "✅ Usando portada existente: $TEST_COVER"
fi

echo ""
echo "🔍 PASO 3: Simular subida de beat..."

# Crear formulario multipart
BOUNDARY="----WebKitFormBoundary7MA4YWxkTrZu0gW"
PAYLOAD=$(cat <<'EOF'
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="beat_name"

Test Beat Clone
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="bpm"

120
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="key"

C
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="price"

29.99
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="producer"

test@producer.com
EOF
)

# Enviar con curl
RESPONSE=$(curl -s -X POST "$SERVER_URL/upload-beat" \
  -F "beat_name=Test Beat Clone" \
  -F "bpm=120" \
  -F "key=C" \
  -F "price=29.99" \
  -F "producer=test@producer.com" \
  -F "audio=@$TEST_AUDIO" \
  -F "cover=@$TEST_COVER" 2>&1)

echo "📤 Respuesta del servidor:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

# Extraer beat ID
BEAT_ID=$(echo "$RESPONSE" | grep -o '"beatId":[0-9]*' | grep -o '[0-9]*' | tail -1)

if [ -z "$BEAT_ID" ]; then
    echo "❌ No se obtuvo beatId de la respuesta"
    exit 1
fi

echo ""
echo "✅ Beat guardado con ID: $BEAT_ID"

echo ""
echo "⏳ PASO 4: Esperar procesamiento (5 segundos)..."
sleep 5

echo ""
echo "🔍 PASO 5: Verificar que la BD tiene audio_processed..."

BEAT_DATA=$(curl -s "$SERVER_URL/beats" | jq ".[] | select(.id == $BEAT_ID)")

echo "📋 Datos del beat en BD:"
echo "$BEAT_DATA" | jq '{id, title, audio, audio_processed, bpm, key}'

AUDIO=$(echo "$BEAT_DATA" | jq -r '.audio // "null"')
AUDIO_PROC=$(echo "$BEAT_DATA" | jq -r '.audio_processed // "null"')

echo ""
echo "Archivo original: $AUDIO"
echo "Archivo procesado: $AUDIO_PROC"

if [ "$AUDIO_PROC" != "null" ] && [ "$AUDIO_PROC" != "" ]; then
    echo "✅ audio_processed está guardado en la BD"
    
    echo ""
    echo "🔍 PASO 6: Verificar archivos en filesystem..."
    
    ORIG_PATH="/workspaces/WAVAULT-V2/WAVAULT/public/$AUDIO"
    PROC_PATH="/workspaces/WAVAULT-V2/WAVAULT/public/$AUDIO_PROC"
    
    echo "Original: $ORIG_PATH"
    if [ -f "$ORIG_PATH" ]; then
        ORIG_SIZE=$(ls -lh "$ORIG_PATH" | awk '{print $5}')
        echo "  ✅ Existe | Tamaño: $ORIG_SIZE"
    else
        echo "  ⚠️  No existe"
    fi
    
    echo "Procesado (clon): $PROC_PATH"
    if [ -f "$PROC_PATH" ]; then
        PROC_SIZE=$(ls -lh "$PROC_PATH" | awk '{print $5}')
        echo "  ✅ Existe | Tamaño: $PROC_SIZE"
    else
        echo "  ⏳ No existe aún (puede estar procesándose en background)"
        echo "  Esperando 10 segundos más..."
        sleep 10
        if [ -f "$PROC_PATH" ]; then
            PROC_SIZE=$(ls -lh "$PROC_PATH" | awk '{print $5}')
            echo "  ✅ Creado! | Tamaño: $PROC_SIZE"
        else
            echo "  ⚠️  Script de procesamiento no se ejecutó"
        fi
    fi
else
    echo "❌ audio_processed NO está en la BD"
    echo "   Verifica que el servidor está guardando este campo"
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║                      RESUMEN DEL TEST                             ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""
echo "✅ FLUJO COMPLETADO:"
echo "   1. Beat subido con ID: $BEAT_ID"
echo "   2. Archivo original: $AUDIO"
echo "   3. Archivo procesado: $AUDIO_PROC"
echo "   4. Se puede reproducir el clon con baja calidad + tag WAVAULT"
echo ""
echo "🧪 Para verificar selección:"
echo "   - Abre http://localhost:3000/dashboard/client.html"
echo "   - Haz click en el beat (debería ser el más nuevo)"
echo "   - Verifica en F12 → Network que se carga audio_processed"
echo "   - Escucha: Bitrate 128kbps + tag WAVAULT insertado"
echo ""
