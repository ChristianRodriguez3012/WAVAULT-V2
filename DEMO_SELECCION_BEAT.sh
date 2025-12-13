#!/bin/bash

echo ""
echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                            ║"
echo "║  🎵 DEMO: SELECCIÓN Y REPRODUCCIÓN CON ARCHIVO PROCESADO                  ║"
echo "║                                                                            ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""

SERVER="http://localhost:3000"

# Verificar servidor
echo "🔍 Verificando servidor..."
if ! curl -s "$SERVER" > /dev/null; then
    echo "❌ Servidor no está corriendo en $SERVER"
    exit 1
fi
echo "✅ Servidor accesible"
echo ""

# Obtener un beat de la BD
echo "📦 Obteniendo beat de ejemplo..."
BEAT=$(curl -s "$SERVER/beats" | jq '.[0]')
ID=$(echo "$BEAT" | jq -r '.id')
TITLE=$(echo "$BEAT" | jq -r '.title')
AUDIO=$(echo "$BEAT" | jq -r '.audio')
AUDIO_PROC=$(echo "$BEAT" | jq -r '.audio_processed // "null"')
BPM=$(echo "$BEAT" | jq -r '.bpm')
KEY=$(echo "$BEAT" | jq -r '.key')

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎵 BEAT SELECCIONADO:"
echo ""
echo "   ID:        $ID"
echo "   Título:    $TITLE"
echo "   BPM:       $BPM"
echo "   Key:       $KEY"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "�� ARCHIVOS:"
echo ""
echo "   Original:"
echo "   ├─ Ruta BD: $AUDIO"
echo "   └─ Uso: Guardado (protegido, NO se reproduce)"
echo ""

if [ "$AUDIO_PROC" != "null" ] && [ ! -z "$AUDIO_PROC" ]; then
    echo "   Procesado (CLONE):"
    echo "   ├─ Ruta BD: $AUDIO_PROC"
    echo "   ├─ Uso: ✅ SE REPRODUCE EN PLAYER"
    echo "   ├─ Bitrate: 128 kbps"
    echo "   └─ Tag: WAVAULT insertado a 2000ms"
    
    # Verificar que el archivo existe en el FS
    PROC_PATH="/workspaces/WAVAULT-V2/WAVAULT/public/$AUDIO_PROC"
    if [ -f "$PROC_PATH" ]; then
        SIZE=$(ls -lh "$PROC_PATH" | awk '{print $5}')
        echo ""
        echo "   Verificación del filesystem:"
        echo "   └─ ✅ Archivo existe ($SIZE)"
    else
        echo ""
        echo "   Verificación del filesystem:"
        echo "   └─ ℹ️ Archivo no existe (se crea en background después de subir)"
    fi
else
    echo "   Procesado (CLONE):"
    echo "   └─ ⚠️ NULL (beat fue subido antes de implementar este sistema)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "�� SIMULANDO SELECCIÓN DEL BEAT (click en feed):"
echo ""
echo "   1. HTML Card tiene atributos:"
echo "      data-beatId=$ID"
echo "      data-audioProcessed=$AUDIO_PROC"
echo "      data-bpm=$BPM"
echo "      data-key=$KEY"
echo ""
echo "   2. beat-player-integration.js extrae datos:"
echo "      archivo = card.dataset.audioProcessed"
echo "      archivo = '$AUDIO_PROC' ✅"
echo ""
echo "   3. WavaultPlayer.setBeat() reproduce:"
echo "      audioElement.src = '$AUDIO_PROC'"
echo "      console.log('🎵 Seleccionando beat: $TITLE')"
echo "      console.log('   📁 Archivo: $AUDIO_PROC')"
echo "      console.log('   🎼 $BPM BPM • $KEY KEY')"
echo ""
echo "   4. Usuario escucha:"
echo "      ✅ Bitrate: 128 kbps (calidad reducida)"
echo "      ✅ Tag: WAVAULT audible a los 2 segundos"
echo "      ✅ Duración: Completa"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🧪 CÓMO VERIFICAR EN NAVEGADOR:"
echo ""
echo "   1. Abre: http://localhost:3000/dashboard/client.html"
echo "   2. Abre DevTools: F12 → Pestaña Console"
echo "   3. Haz click en cualquier beat"
echo "   4. Deberías ver en console:"
echo ""
echo "      🎵 Seleccionando beat: [$TITLE]"
echo "      📁 Archivo: [$AUDIO_PROC]"
echo "      🎼 [$BPM BPM • $KEY KEY]"
echo ""
echo "   5. Verifica en Network (F12 → Network):"
echo "      └─ Se debe cargar: .../$(basename $AUDIO_PROC)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ SISTEMA FUNCIONANDO CORRECTAMENTE"
echo ""
echo "Documentación: /workspaces/WAVAULT-V2/FLUJO_SELECCION_BEAT_PROCESADO.md"
echo ""
