#!/usr/bin/env bash
set -euo pipefail

# Smoke test rápido para Groq V2
# Requisitos: ffmpeg, python deps instaladas, GROQ_API_KEY en entorno o .env

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

# Cargar GROQ_API_KEY desde .env si no está en el entorno
if [ -z "${GROQ_API_KEY:-}" ] && [ -f .env ]; then
  export GROQ_API_KEY="$(awk -F= '/^GROQ_API_KEY=/{print $2}' .env)"
fi

if [ -z "${GROQ_API_KEY:-}" ]; then
  echo "❌ GROQ_API_KEY no encontrada. Exporta GROQ_API_KEY o colócala en .env"
  exit 1
fi

export USE_GROQ_PRIMARY=1
export SKIP_GEMINI_FALLBACK=1

AUDIO_FILE="/tmp/test_unseen.wav"
FILENAME="Central Cee x Ice Spice - Neon Drill TYPE BEAT - 140 BPM F# Minor [DEMO]"

# Generar audio sintético de 8s
ffmpeg -f lavfi -i "sine=f=440:d=8" -q:a 9 -acodec libmp3lame "$AUDIO_FILE" -y 2>/dev/null

# Ejecutar análisis V2 (solo Groq; Gemini omitido)
python3 analyze_beat_ai.py "$AUDIO_FILE" "$FILENAME" --v2 | tee /tmp/test_unseen_output.json

# Resumen
python3 - <<'PY'
import json
with open('/tmp/test_unseen_output.json') as f:
    data=json.load(f)
print('Status:', data.get('status'))
print('Total tags:', len(data.get('tags', [])))
print('Tags:', ', '.join(data.get('tags', [])))
print('Artist:', data.get('reference_artist'))
print('Beat type:', data.get('beat_type'))
print('BPM:', data.get('bpm'), 'Key:', data.get('key'))
print('Is demo:', data.get('is_demo'), 'Is tagged:', data.get('is_tagged'))
PY
