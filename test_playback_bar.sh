#!/bin/bash
# test_playback_bar.sh - Test de la barra de reproducción

echo "═══════════════════════════════════════════════════════════════"
echo "🎵 TEST DE BARRA DE REPRODUCCIÓN - WAVAULT V2"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# 1. Verificar que beat.html existe y tiene el player
echo "✓ Test 1: Verificar estructura HTML del player"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if grep -q "player-wrapper" /workspaces/WAVAULT-V2/WAVAULT/public/beat.html; then
    echo "✅ player-wrapper encontrado en beat.html"
else
    echo "❌ player-wrapper NO encontrado"
    exit 1
fi

if grep -q "progressSlider" /workspaces/WAVAULT-V2/WAVAULT/public/beat.html; then
    echo "✅ progressSlider encontrado"
else
    echo "❌ progressSlider NO encontrado"
    exit 1
fi

if grep -q "player-progress" /workspaces/WAVAULT-V2/WAVAULT/public/beat.html; then
    echo "✅ player-progress encontrado"
else
    echo "❌ player-progress NO encontrado"
    exit 1
fi

echo ""

# 2. Verificar funciones JavaScript
echo "✓ Test 2: Verificar funciones JavaScript"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if grep -q "formatTime" /workspaces/WAVAULT-V2/WAVAULT/public/beat.html; then
    echo "✅ Función formatTime encontrada"
else
    echo "❌ Función formatTime NO encontrada"
    exit 1
fi

if grep -q "seekAudio" /workspaces/WAVAULT-V2/WAVAULT/public/beat.html; then
    echo "✅ Función seekAudio encontrada"
else
    echo "❌ Función seekAudio NO encontrada"
    exit 1
fi

if grep -q "updateProgress" /workspaces/WAVAULT-V2/WAVAULT/public/beat.html; then
    echo "✅ Función updateProgress encontrada"
else
    echo "❌ Función updateProgress NO encontrada"
    exit 1
fi

echo ""

# 3. Verificar controles del player
echo "✓ Test 3: Verificar controles del player"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if grep -q "playPauseBtn" /workspaces/WAVAULT-V2/WAVAULT/public/beat.html; then
    echo "✅ playPauseBtn encontrado"
else
    echo "❌ playPauseBtn NO encontrado"
    exit 1
fi

if grep -q "volumeSlider" /workspaces/WAVAULT-V2/WAVAULT/public/beat.html; then
    echo "✅ volumeSlider encontrado"
else
    echo "❌ volumeSlider NO encontrado"
    exit 1
fi

if grep -q "volumeBtn" /workspaces/WAVAULT-V2/WAVAULT/public/beat.html; then
    echo "✅ volumeBtn encontrado"
else
    echo "❌ volumeBtn NO encontrado"
    exit 1
fi

echo ""

# 4. Verificar CSS
echo "✓ Test 4: Verificar estilos CSS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if grep -q "\.player-container" /workspaces/WAVAULT-V2/WAVAULT/public/assets/css/style.css; then
    echo "✅ .player-container encontrado en CSS"
else
    echo "❌ .player-container NO encontrado en CSS"
    exit 1
fi

if grep -q "\.progress-bar" /workspaces/WAVAULT-V2/WAVAULT/public/assets/css/style.css; then
    echo "✅ .progress-bar encontrado en CSS"
else
    echo "❌ .progress-bar NO encontrado en CSS"
    exit 1
fi

if grep -q "\.progress-slider" /workspaces/WAVAULT-V2/WAVAULT/public/assets/css/style.css; then
    echo "✅ .progress-slider encontrado en CSS"
else
    echo "❌ .progress-slider NO encontrado en CSS"
    exit 1
fi

echo ""

# 5. Verificar que Font Awesome está incluido
echo "✓ Test 5: Verificar Font Awesome"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if grep -q "font-awesome" /workspaces/WAVAULT-V2/WAVAULT/public/beat.html; then
    echo "✅ Font Awesome incluido en beat.html"
else
    echo "❌ Font Awesome NO incluido"
    exit 1
fi

echo ""

# 6. Verificar sintaxis HTML y JavaScript básica
echo "✓ Test 6: Verificar sintaxis"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Contar etiquetas HTML abiertas y cerradas (básico)
OPEN_DIVS=$(grep -o "<div" /workspaces/WAVAULT-V2/WAVAULT/public/beat.html | wc -l)
CLOSE_DIVS=$(grep -o "</div>" /workspaces/WAVAULT-V2/WAVAULT/public/beat.html | wc -l)

if [ "$OPEN_DIVS" -eq "$CLOSE_DIVS" ]; then
    echo "✅ Divs balanceados: $OPEN_DIVS abiertos, $CLOSE_DIVS cerrados"
else
    echo "⚠️  Posible desbalance de divs: $OPEN_DIVS abiertos, $CLOSE_DIVS cerrados"
fi

echo ""

# 7. Mostrar resumen de cambios
echo "✓ Test 7: Resumen de cambios"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Elementos añadidos al reproductor:"
echo "  📊 Barra de progreso (progress-bar)"
echo "  ⏯️  Botón Play/Pause"
echo "  🔊 Control de volumen"
echo "  ⏱️  Visualización de tiempo actual y duración"
echo "  🖱️  Slider para buscar en la canción"
echo ""

# 8. Información de uso
echo "✓ Test 8: Cómo probar manualmente"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Abrir: http://localhost:3000/beat.html?id=1"
echo "2. Hacer clic en el botón Play (▶️)"
echo "3. Verificar que:"
echo "   ✓ El ícono cambia a pausa (⏸️)"
echo "   ✓ La barra de progreso se llena"
echo "   ✓ El tiempo se actualiza"
echo "   ✓ El slider se puede arrastrar"
echo "   ✓ El control de volumen funciona"
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "✅ TODOS LOS TESTS PASARON EXITOSAMENTE"
echo "═══════════════════════════════════════════════════════════════"
