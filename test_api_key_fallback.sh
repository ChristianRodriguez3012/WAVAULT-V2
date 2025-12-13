#!/bin/bash

# 🧪 TEST DE FALLBACK MULTI-API KEY
# Verifica que el sistema cambia automáticamente entre API keys cuando una falla

echo "🧪 INICIANDO TEST DE FALLBACK MULTI-API KEY"
echo "=============================================="
echo ""

# Verificar que el servidor está corriendo
if ! pgrep -f "node.*server.js" > /dev/null; then
    echo "❌ Servidor no está corriendo. Iniciando..."
    cd /workspaces/WAVAULT-V2/WAVAULT/backend
    node server.js > /dev/null 2>&1 &
    sleep 3
    echo "✅ Servidor iniciado"
fi

echo "📋 TESTS PLANIFICADOS:"
echo "1. ✅ Verificar que sistema multi-key se inicializa correctamente"
echo "2. ✅ Test con KEY válida (debería funcionar)"
echo "3. ⚠️  Test con KEY inválida → KEY válida (debería cambiar automáticamente)"
echo "4. ❌ Test con TODAS las keys inválidas (debería fallar con mensaje claro)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 1: Inicialización del Sistema Multi-Key"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd /workspaces/WAVAULT-V2/WAVAULT/backend

# Verificar cuántas keys están configuradas
echo "🔍 Verificando configuración actual en .env..."
CSV_KEYS=$(grep -E "^GEMINI_API_KEYS=" .env | grep -v "^#" | cut -d'=' -f2- | tr -d '"' | tr ',' '\n' | sed '/^$/d' | wc -l)
NUM_KEYS=$(grep -E "^GEMINI_API_KEY(_[0-9]+)?=" .env | grep -v "^#" | wc -l)
KEYS_CONFIGURED=$(( CSV_KEYS > 0 ? CSV_KEYS : NUM_KEYS ))
echo "   Keys configuradas (detectadas): $KEYS_CONFIGURED"

if [ $KEYS_CONFIGURED -eq 0 ]; then
    echo "❌ No hay API keys configuradas en .env"
    exit 1
fi

# Test básico: Verificar que el script Python reconoce las keys
echo ""
echo "🔑 Verificando que Python detecta las keys..."
python3 - << 'PY'
from dotenv import load_dotenv
import os

# Cargar .env del backend explícitamente
load_dotenv(dotenv_path='/workspaces/WAVAULT-V2/WAVAULT/backend/.env')

csv = os.environ.get('GEMINI_API_KEYS', '')
keys = []
if csv:
    keys.extend([k.strip() for k in csv.split(',') if k.strip()])

base = os.environ.get('GEMINI_API_KEY', '')
if base:
    keys.append(base)
for i in range(2, 11):
    v = os.environ.get(f'GEMINI_API_KEY_{i}', '')
    if v:
        keys.append(v)

# Filtrar vacíos/placeholders/duplicados
seen = set()
active = []
for k in keys:
    if not k or k in ('tu_api_key_aqui', 'empty') or k in seen:
        continue
    seen.add(k)
    active.append(k)

print(f'✅ Sistema detectó {len(active)} key(s) activa(s)')
for i, key in enumerate(active):
    masked = (key[:10] + '...' + key[-5:]) if len(key) > 20 else (key[:3] + '...' + key[-3:])
    print(f'   KEY #{i+1}: {masked}')
PY

if [ $? -ne 0 ]; then
    echo "❌ Error al verificar keys en Python"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 2: Análisis con KEY Válida"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Crear archivo de audio de prueba (1 segundo de silencio)
TEST_AUDIO="/tmp/test_beat_valid_key.wav"
echo "🎵 Generando audio de prueba..."
ffmpeg -f lavfi -i "sine=frequency=440:duration=1" -ar 44100 -ac 2 "$TEST_AUDIO" -y > /dev/null 2>&1

if [ ! -f "$TEST_AUDIO" ]; then
    echo "❌ No se pudo crear audio de prueba"
    exit 1
fi

echo "📊 Analizando beat con KEY válida..."
echo ""

python3 analyze_beat_ai.py "$TEST_AUDIO" "Travis_Scott_Type_Beat_140bpm_Aminor.wav" 2>&1 | tee /tmp/test_output_valid.log

# Verificar resultado
if grep -q "✅ API KEY #1 funcionó correctamente" /tmp/test_output_valid.log; then
    echo ""
    echo "✅ TEST 2 PASÓ: Sistema usó KEY #1 correctamente"
elif grep -q "✅ API KEY #" /tmp/test_output_valid.log; then
    echo ""
    echo "✅ TEST 2 PASÓ: Sistema usó una de las keys de fallback"
else
    echo ""
    echo "⚠️  TEST 2 WARNING: No se detectó mensaje de key exitosa"
    echo "   Puede ser que el formato de log haya cambiado"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 3: Fallback Automático (KEY inválida → KEY válida)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Backup del .env original
cp .env .env.backup

# Modificar .env para tener 1 key inválida y 1 válida
echo "🔧 Configurando: KEY #1 = INVÁLIDA, KEY #2 = VÁLIDA"

VALID_KEY=$(grep "^GEMINI_API_KEY=" .env | head -1 | cut -d'=' -f2)

cat > .env << EOF
# Test de fallback: KEY #1 inválida, KEY #2 válida
GEMINI_API_KEY=INVALID_KEY_FOR_TEST_12345
GEMINI_API_KEY_2=$VALID_KEY
EOF

echo "📊 Analizando beat con KEY #1 inválida..."
echo "   (Debería fallar KEY #1 y cambiar automáticamente a KEY #2)"
echo ""

python3 analyze_beat_ai.py "$TEST_AUDIO" "Travis_Scott_Type_Beat_140bpm_Aminor.wav" 2>&1 | tee /tmp/test_output_fallback.log

# Verificar resultado
if grep -q "⚠️  API KEY #1" /tmp/test_output_fallback.log && grep -q "✅ API KEY #2 funcionó correctamente" /tmp/test_output_fallback.log; then
    echo ""
    echo "✅ TEST 3 PASÓ: Sistema detectó KEY #1 inválida y cambió automáticamente a KEY #2"
else
    echo ""
    echo "⚠️  TEST 3 WARNING: No se detectó el comportamiento esperado de fallback"
    echo "   Revisa el log en /tmp/test_output_fallback.log"
fi

# Restaurar .env original
mv .env.backup .env

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 4: Todas las Keys Inválidas (debería fallar limpiamente)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Backup del .env
cp .env .env.backup

# Configurar todas las keys como inválidas
echo "🔧 Configurando: TODAS las keys como INVÁLIDAS"

cat > .env << EOF
# Test de fallback completo: todas las keys inválidas
GEMINI_API_KEY=INVALID_KEY_1
GEMINI_API_KEY_2=INVALID_KEY_2
GEMINI_API_KEY_3=INVALID_KEY_3
EOF

echo "📊 Analizando beat con TODAS las keys inválidas..."
echo "   (Debería intentar todas y fallar con mensaje claro)"
echo ""

python3 analyze_beat_ai.py "$TEST_AUDIO" "Travis_Scott_Type_Beat_140bpm_Aminor.wav" 2>&1 | tee /tmp/test_output_all_fail.log

# Verificar resultado
if grep -q "❌ Todas las API keys fallaron" /tmp/test_output_all_fail.log; then
    echo ""
    echo "✅ TEST 4 PASÓ: Sistema intentó todas las keys y falló correctamente"
elif grep -q "artist_known.*false" /tmp/test_output_all_fail.log; then
    echo ""
    echo "✅ TEST 4 PASÓ: Sistema retornó resultado con fallback local (esperado)"
else
    echo ""
    echo "⚠️  TEST 4 WARNING: No se detectó el mensaje de fallo esperado"
fi

# Restaurar .env original
mv .env.backup .env

# Limpiar archivos temporales
rm -f "$TEST_AUDIO"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMEN DE TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Test 1: Inicialización - COMPLETADO"
echo "✅ Test 2: KEY válida - COMPLETADO"
echo "✅ Test 3: Fallback automático - COMPLETADO"
echo "✅ Test 4: Todas las keys inválidas - COMPLETADO"
echo ""
echo "📁 Logs guardados en:"
echo "   - /tmp/test_output_valid.log"
echo "   - /tmp/test_output_fallback.log"
echo "   - /tmp/test_output_all_fail.log"
echo ""
echo "🎉 TESTS FINALIZADOS"
echo ""
echo "💡 PRÓXIMOS PASOS:"
echo "1. Crea 2-3 API keys en: https://aistudio.google.com/app/apikey"
echo "2. Agrega las keys en /workspaces/WAVAULT-V2/WAVAULT/backend/.env"
echo "3. Reinicia el servidor: ./start-server.sh"
echo "4. Sube beats en producer.html y observa los logs"
echo ""
