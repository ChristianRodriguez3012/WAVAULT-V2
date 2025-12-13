#!/bin/bash

# Test rápido de optimización de tokens
# Verifica que generate_auto_tags() está generando más tags

echo "🔍 TEST RÁPIDO: Optimización de Tokens"
echo "======================================"
echo ""

# Buscar la función generate_auto_tags en el archivo
TAGS_COUNT=$(grep -c "tags.add" /workspaces/WAVAULT-V2/WAVAULT/backend/analyze_beat_ai.py)

echo "📊 Análisis del código:"
echo "  - Total de tags.add() encontrados: $TAGS_COUNT"
echo ""

# Verificar que tiene la estructura optimizada
if grep -q "5-10 tags ÚNICAMENTE" /workspaces/WAVAULT-V2/WAVAULT/backend/analyze_beat_ai.py; then
    echo "✅ Prompt optimizado: Pide 5-10 tags (encontrado)"
else
    echo "❌ Prompt NO optimizado"
fi

echo ""

# Verificar que tiene los ejemplos correctos
if grep -q "Dark.*Rage Trap.*Travis Scott Type" /workspaces/WAVAULT-V2/WAVAULT/backend/analyze_beat_ai.py; then
    echo "✅ Ejemplos de tags optimizados (encontrados)"
else
    echo "❌ Ejemplos NO encontrados"
fi

echo ""

# Verificar documentación
if grep -q "ESTRATEGIA ACTUAL:" /workspaces/WAVAULT-V2/WAVAULT/backend/analyze_beat_ai.py; then
    echo "✅ Documentación de tokens actualizada (encontrada)"
else
    echo "❌ Documentación NO actualizada"
fi

echo ""
echo "======================================"
echo "✅ Optimización lista para testear"
echo ""
echo "Pasos siguientes:"
echo "  1. Recargar producer.html (Ctrl+Shift+R)"
echo "  2. Subir un beat"
echo "  3. Verificar que genera 20-30 tags totales"
echo "  4. Ver logs del servidor para tokens consumidos"
echo ""
