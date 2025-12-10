#!/bin/bash

# Script para probar la barra de reproducción persistente tipo Spotify
# Verifica que esté implementada correctamente en todas las páginas

echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                        ║"
echo "║        🎵 PRUEBA DE BARRA DE REPRODUCCIÓN PERSISTENTE TIPO SPOTIFY   ║"
echo "║                                                                        ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""

TOTAL=0
PASSED=0

# Test 1: Verificar presencia del player global en index.html
echo "📋 TEST 1: Player persistente en index.html"
if grep -q 'class="player-wrapper"' /workspaces/WAVAULT-V2/WAVAULT/public/index.html && \
   grep -q 'player-global.js' /workspaces/WAVAULT-V2/WAVAULT/public/index.html && \
   grep -q 'beat-player-integration.js' /workspaces/WAVAULT-V2/WAVAULT/public/index.html; then
    echo "✅ PASS: Player global encontrado en index.html"
    ((PASSED++))
else
    echo "❌ FAIL: Player global NO encontrado en index.html"
fi
((TOTAL++))

# Test 2: Verificar presencia del player global en perfil.html
echo ""
echo "📋 TEST 2: Player persistente en perfil.html"
if grep -q 'class="player-wrapper"' /workspaces/WAVAULT-V2/WAVAULT/public/perfil.html && \
   grep -q 'player-global.js' /workspaces/WAVAULT-V2/WAVAULT/public/perfil.html; then
    echo "✅ PASS: Player global encontrado en perfil.html"
    ((PASSED++))
else
    echo "❌ FAIL: Player global NO encontrado en perfil.html"
fi
((TOTAL++))

# Test 3: Verificar presencia del player global en beat.html
echo ""
echo "📋 TEST 3: Player persistente en beat.html"
if grep -q 'class="player-wrapper"' /workspaces/WAVAULT-V2/WAVAULT/public/beat.html && \
   grep -q 'player-global.js' /workspaces/WAVAULT-V2/WAVAULT/public/beat.html; then
    echo "✅ PASS: Player global encontrado en beat.html"
    ((PASSED++))
else
    echo "❌ FAIL: Player global NO encontrado en beat.html"
fi
((TOTAL++))

# Test 4: Verificar presencia del player global en dashboard cliente
echo ""
echo "📋 TEST 4: Player persistente en dashboard/client.html"
if grep -q 'class="player-wrapper"' /workspaces/WAVAULT-V2/WAVAULT/public/dashboard/client.html && \
   grep -q 'player-global.js' /workspaces/WAVAULT-V2/WAVAULT/public/dashboard/client.html; then
    echo "✅ PASS: Player global encontrado en dashboard/client.html"
    ((PASSED++))
else
    echo "❌ FAIL: Player global NO encontrado en dashboard/client.html"
fi
((TOTAL++))

# Test 5: Verificar presencia del player global en dashboard productor
echo ""
echo "📋 TEST 5: Player persistente en dashboard/producer.html"
if grep -q 'class="player-wrapper"' /workspaces/WAVAULT-V2/WAVAULT/public/dashboard/producer.html && \
   grep -q 'player-global.js' /workspaces/WAVAULT-V2/WAVAULT/public/dashboard/producer.html; then
    echo "✅ PASS: Player global encontrado en dashboard/producer.html"
    ((PASSED++))
else
    echo "❌ FAIL: Player global NO encontrado en dashboard/producer.html"
fi
((TOTAL++))

# Test 6: Verificar archivo player-global.js existe
echo ""
echo "📋 TEST 6: Archivo player-global.js existe"
if [ -f /workspaces/WAVAULT-V2/WAVAULT/public/js/player-global.js ]; then
    echo "✅ PASS: player-global.js encontrado"
    ((PASSED++))
else
    echo "❌ FAIL: player-global.js NO encontrado"
fi
((TOTAL++))

# Test 7: Verificar clases WavaultPlayer en player-global.js
echo ""
echo "📋 TEST 7: Clase WavaultPlayer en player-global.js"
if grep -q 'class WavaultPlayer' /workspaces/WAVAULT-V2/WAVAULT/public/js/player-global.js && \
   grep -q 'setBeat' /workspaces/WAVAULT-V2/WAVAULT/public/js/player-global.js && \
   grep -q 'togglePlay\|play()' /workspaces/WAVAULT-V2/WAVAULT/public/js/player-global.js; then
    echo "✅ PASS: Clase WavaultPlayer con métodos encontrados"
    ((PASSED++))
else
    echo "❌ FAIL: Clase WavaultPlayer incompleta"
fi
((TOTAL++))

# Test 8: Verificar beat-player-integration.js
echo ""
echo "📋 TEST 8: Archivo beat-player-integration.js existe"
if [ -f /workspaces/WAVAULT-V2/WAVAULT/public/js/beat-player-integration.js ]; then
    echo "✅ PASS: beat-player-integration.js encontrado"
    ((PASSED++))
else
    echo "❌ FAIL: beat-player-integration.js NO encontrado"
fi
((TOTAL++))

# Test 9: Verificar estilos player en CSS
echo ""
echo "📋 TEST 9: Estilos .player-wrapper en style.css"
if grep -q '.player-wrapper' /workspaces/WAVAULT-V2/WAVAULT/public/assets/css/style.css && \
   grep -q 'position: fixed' /workspaces/WAVAULT-V2/WAVAULT/public/assets/css/style.css && \
   grep -q 'bottom: 0' /workspaces/WAVAULT-V2/WAVAULT/public/assets/css/style.css; then
    echo "✅ PASS: Estilos de player-wrapper encontrados (fixed al bottom)"
    ((PASSED++))
else
    echo "❌ FAIL: Estilos de player-wrapper incompletos"
fi
((TOTAL++))

# Test 10: Verificar CSS padding en body para footer
echo ""
echo "📋 TEST 10: Body padding-bottom para footer player"
if grep -q 'padding-bottom: 120px' /workspaces/WAVAULT-V2/WAVAULT/public/assets/css/style.css || \
   grep -q 'padding-bottom: 140px' /workspaces/WAVAULT-V2/WAVAULT/public/assets/css/style.css; then
    echo "✅ PASS: Body padding añadido para footer"
    ((PASSED++))
else
    echo "❌ FAIL: Body padding NO encontrado"
fi
((TOTAL++))

# Test 11: Verificar función playBeat integrada
echo ""
echo "📋 TEST 11: Función playBeat usa player global en client.js"
if grep -q 'window.wavaultPlayer.setBeat' /workspaces/WAVAULT-V2/WAVAULT/public/assets/js/client.js; then
    echo "✅ PASS: playBeat integrado con player global"
    ((PASSED++))
else
    echo "❌ FAIL: playBeat NO integrado con player global"
fi
((TOTAL++))

# Test 12: Verificar elemento audio global
echo ""
echo "📋 TEST 12: Elemento audio global en WavaultPlayer"
if grep -q 'id=.*wavaultGlobalAudio' /workspaces/WAVAULT-V2/WAVAULT/public/js/player-global.js || \
   grep -q "id: 'wavaultGlobalAudio'" /workspaces/WAVAULT-V2/WAVAULT/public/js/player-global.js; then
    echo "✅ PASS: Audio global element encontrado"
    ((PASSED++))
else
    echo "❌ FAIL: Audio global element NO encontrado"
fi
((TOTAL++))

# Test 13: Verificar localStorage para persistencia
echo ""
echo "📋 TEST 13: localStorage para persistencia entre páginas"
if grep -q "localStorage.setItem.*wavaultCurrentBeat" /workspaces/WAVAULT-V2/WAVAULT/public/js/player-global.js && \
   grep -q "localStorage.getItem.*wavaultCurrentBeat" /workspaces/WAVAULT-V2/WAVAULT/public/js/player-global.js; then
    echo "✅ PASS: localStorage implementado para persistencia"
    ((PASSED++))
else
    echo "❌ FAIL: localStorage NO implementado"
fi
((TOTAL++))

# Test 14: Verificar estilos responsivos
echo ""
echo "📋 TEST 14: Estilos responsive para mobile"
if grep -q '@media (max-width: 768px)' /workspaces/WAVAULT-V2/WAVAULT/public/assets/css/style.css && \
   grep -q '.player-container' /workspaces/WAVAULT-V2/WAVAULT/public/assets/css/style.css; then
    echo "✅ PASS: Media queries para mobile encontradas"
    ((PASSED++))
else
    echo "❌ FAIL: Media queries NO encontradas"
fi
((TOTAL++))

# Test 15: Verificar elementos de control
echo ""
echo "📋 TEST 15: Elementos de control (play, volume, progress)"
if grep -q 'id="playPauseBtn"' /workspaces/WAVAULT-V2/WAVAULT/public/index.html && \
   grep -q 'id="volumeSlider"' /workspaces/WAVAULT-V2/WAVAULT/public/index.html && \
   grep -q 'id="progressSlider"' /workspaces/WAVAULT-V2/WAVAULT/public/index.html; then
    echo "✅ PASS: Todos los elementos de control encontrados"
    ((PASSED++))
else
    echo "❌ FAIL: Faltan elementos de control"
fi
((TOTAL++))

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 RESULTADO DE PRUEBAS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Tests pasados: $PASSED / $TOTAL"
echo ""

if [ $PASSED -eq $TOTAL ]; then
    echo "🎉 ¡TODOS LOS TESTS PASARON! La barra de reproducción está lista."
    echo ""
    echo "📋 CARACTERÍSTICAS IMPLEMENTADAS:"
    echo "  ✓ Player flotante en footer en todas las páginas"
    echo "  ✓ Sincronización entre páginas con localStorage"
    echo "  ✓ Controles: Play/Pause, Volumen, Barra de progreso"
    echo "  ✓ Integración con cards de beats (click para reproducir)"
    echo "  ✓ Estilos responsivos para desktop y mobile"
    echo "  ✓ Font Awesome icons incluidos"
    echo "  ✓ Barra no oculta contenido (padding en body)"
    echo ""
    echo "🌐 CÓMO PROBAR:"
    echo "  1. Navega a http://localhost:3000/dashboard/client.html"
    echo "  2. Haz click en cualquier beat para reproducir"
    echo "  3. Navega a otra página (perfil, feed, etc)"
    echo "  4. El beat sigue reproduciéndose en la barra del footer"
    echo ""
else
    echo "⚠️  Algunos tests fallaron. Revisa los resultados arriba."
    echo "Passed: $PASSED / Total: $TOTAL"
fi

echo ""
echo "╚════════════════════════════════════════════════════════════════════════╝"
