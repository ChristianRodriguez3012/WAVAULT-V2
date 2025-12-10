#!/bin/bash
# Test del endpoint /api/parse-filename

echo "🧪 ===== TEST ENDPOINT /api/parse-filename ====="
echo ""
echo "Asegúrate de que el servidor esté corriendo en http://localhost:3000"
echo ""

# Función para hacer test
test_parse() {
    local filename="$1"
    echo "📝 Testing: $filename"
    curl -s -X POST http://localhost:3000/api/parse-filename \
        -H 'Content-Type: application/json' \
        -d "{\"filename\": \"$filename\"}" | python3 -m json.tool
    echo ""
    echo "─────────────────────────────────────────────"
    echo ""
}

# Test 1: Estructura exacta
test_parse "Tropical Vibes - Drake Type Beat - Drake - Fm - 90.mp3"

# Test 2: Otra estructura
test_parse "Sicko Mode - Travis Scott Type Beat - Travis Scott - Gm - 140.mp3"

# Test 3: Con parentheses
test_parse "[Remix] Beat Name (Master) - Drake Type Beat - Drake - Am - 95.mp3"

# Test 4: BPM inválido
test_parse "Bad Beat - Drake Type Beat - Drake - Cm - 250.mp3"

# Test 5: Sin referencia
test_parse "Cool Vibe - Trap Type Beat - Em - 110.mp3"

echo "✅ Tests completados"
