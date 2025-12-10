#!/bin/bash
# Test de flujo completo del sistema de carga de beats

echo "🎵 ===== TEST DEL FLUJO COMPLETO DE CARGA DE BEATS ====="
echo ""

# 1. Test parse_filename_ai.py
echo "📋 TEST 1: Parse Filename"
echo "Probando con: 'Tropical Vibes - Drake Type Beat - Drake - Fm - 90.mp3'"
python3 /workspaces/WAVAULT-V2/WAVAULT/backend/parse_filename_ai.py "Tropical Vibes - Drake Type Beat - Drake - Fm - 90.mp3"
echo ""

# 2. Test con estructura exacta
echo "📋 TEST 2: Validar estructura NOMBRE - TYPE - REFERENCIA - KEY - BPM"
echo "Probando con: 'Sicko Mode - Travis Scott Type Beat - Travis Scott - Gm - 140.mp3'"
python3 /workspaces/WAVAULT-V2/WAVAULT/backend/parse_filename_ai.py "Sicko Mode - Travis Scott Type Beat - Travis Scott - Gm - 140.mp3"
echo ""

# 3. Test con BPM inválido
echo "📋 TEST 3: BPM fuera de rango (250 - debe rechazarse)"
python3 /workspaces/WAVAULT-V2/WAVAULT/backend/parse_filename_ai.py "Beat - Drake Type Beat - Drake - Am - 250.mp3"
echo ""

# 4. Test con parentheses
echo "📋 TEST 4: Nombre con parentheses (debe limpiarse)"
python3 /workspaces/WAVAULT-V2/WAVAULT/backend/parse_filename_ai.py "[Remasterizado] Beat Name (Remix) - Drake Type Beat - Drake - Dm - 95.mp3"
echo ""

echo "✅ Tests completados"
