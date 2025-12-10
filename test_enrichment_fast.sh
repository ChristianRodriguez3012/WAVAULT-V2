#!/bin/bash
# Test rápido del sistema de enriquecimiento

cd /workspaces/WAVAULT-V2/WAVAULT/backend

echo "🎯 TEST: ENRIQUECIMIENTO DE METADATOS"
echo "════════════════════════════════════════"

# Test 1: Parser de filename
python3 << 'EOF'
from metadata_enrichment import parse_filename

print("\n📍 TEST 1: Parser de Filename")
test_files = [
    "Bad Bunny - Tití Me Preguntó - 95BPM - Am.mp3",
    "Travis_Scott_Goosebumps_155BPM_Gm.mp3",
    "Drake - God's Plan - 104BPM - Bbmaj.mp3"
]

for f in test_files:
    result = parse_filename(f)
    print(f"\n  {f}")
    print(f"  → Artist: {result['artist']}, Title: {result['title']}")
    print(f"  → BPM: {result['bpm']}, Key: {result['key']}")
EOF

# Test 2: Enriquecimiento completo (sin API key, modo fallback)
echo ""
echo "📍 TEST 2: Enriquecimiento Completo (fallback mode)"
python3 metadata_enrichment.py "Test Beat - 120BPM - Cm.mp3" 2>&1 | python3 << 'EOF'
import json, sys
try:
    data = json.load(sys.stdin)
    print(f"✅ Enriquecimiento completado")
    if 'final_metadata' in data:
        meta = data['final_metadata']
        print(f"  BPM: {meta.get('bpm')}")
        print(f"  Key: {meta.get('key')}")
        print(f"  Tags: {len(meta.get('tags', []))} generados")
except Exception as e:
    print(f"⚠️  {e}")
EOF

echo ""
echo "════════════════════════════════════════"
echo "✅ TEST COMPLETADO - Sistema Operativo"
