#!/bin/bash

# =================================================================
# TEST RÁPIDO DEL SISTEMA DE ANÁLISIS DE BEATS
# NO PARALIZA, SOLO PRUEBA Y CONTINÚA
# =================================================================

cd /workspaces/WAVAULT-V2/WAVAULT/backend

echo "════════════════════════════════════════════════════════════"
echo "🎵 TEST RÁPIDO: ANÁLISIS DE BEATS CON IA"
echo "════════════════════════════════════════════════════════════"

# Test 1: Probar analyze_beat_ai.py directamente
echo ""
echo "📍 TEST 1: Archivo de test en datos"
ls -lh data/beats.json 2>/dev/null && echo "✅ Archivo de datos existe" || echo "⚠️  No hay datos precargados"

# Test 2: Verificar sintaxis de Python
echo ""
echo "📍 TEST 2: Validar sintaxis Python"
python3 -m py_compile analyze_beat_ai.py 2>&1 | grep -q "Error" && echo "❌ Error de sintaxis" || echo "✅ Sintaxis OK"

# Test 3: Verificar funciones principales
echo ""
echo "📍 TEST 3: Funciones disponibles en analyze_beat_ai.py"
python3 << 'EOF' 2>&1 | head -20
import inspect
import sys
sys.path.insert(0, '/workspaces/WAVAULT-V2/WAVAULT/backend')
try:
    from analyze_beat_ai import (
        extract_filename_metadata,
        scrape_tunebat_song,
        validate_bpm_with_gemini,
        analyze_audio
    )
    print("✅ Todas las funciones principales disponibles")
except ImportError as e:
    print(f"❌ Error de importación: {e}")
EOF

# Test 4: Verificar servidor está corriendo
echo ""
echo "📍 TEST 4: Estado del servidor"
if curl -s http://localhost:3000/ > /dev/null 2>&1; then
    echo "✅ Servidor corriendo en localhost:3000"
else
    echo "⚠️  Servidor no responde - puede no estar iniciado"
    echo "   Inicia con: cd /workspaces/WAVAULT-V2/WAVAULT && bash start_server.sh"
fi

# Test 5: Verificar archivos de prueba
echo ""
echo "📍 TEST 5: Archivos de prueba disponibles"
find /workspaces/WAVAULT-V2 -name "*.mp3" -o -name "*.wav" 2>/dev/null | head -5 | while read f; do
    echo "   📄 $(basename "$f")"
done

# Test 6: Verificar dependencias Python
echo ""
echo "📍 TEST 6: Dependencias Python"
python3 << 'EOF'
import sys
deps = ['librosa', 'numpy', 'scipy', 'google.generativeai']
missing = []
for dep in deps:
    try:
        __import__(dep)
    except ImportError:
        missing.append(dep)

if missing:
    print(f"❌ Faltan: {', '.join(missing)}")
else:
    print("✅ Todas las dependencias instaladas")
EOF

# Test 7: Verificar variables de entorno
echo ""
echo "📍 TEST 7: Variables de entorno"
if [ -z "$GEMINI_API_KEY" ]; then
    echo "⚠️  GEMINI_API_KEY no configurada (puede usar fallback local)"
else
    echo "✅ GEMINI_API_KEY configurada"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ TEST COMPLETADO"
echo "════════════════════════════════════════════════════════════"
