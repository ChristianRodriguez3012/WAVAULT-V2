#!/bin/bash
set -e
cd /workspaces/WAVAULT-V2/WAVAULT/backend

echo "🧪 Probando autofill desde filename"
FILES=(
  "SWAE LEE x FEID - PLAYA - 95 BPM E Minor Type Beat.mp3"
  "Travis Scott x Lil Wayne - Rage - 140 BPM Cm Type Beat.wav"
  "Feid - Romántico - 96 BPM B Minor Reggaeton.mp3"
)

python3 - << 'PY'
import json
from parse_filename_improved import parse_filename
from analyze_beat_ai import build_autofill_from_filename

samples = [
  "SWAE LEE x FEID - PLAYA - 95 BPM E Minor Type Beat.mp3",
  "Travis Scott x Lil Wayne - Rage - 140 BPM Cm Type Beat.wav",
  "Feid - Romántico - 96 BPM B Minor Reggaeton.mp3",
]

for s in samples:
    info = parse_filename(s)
    auto = build_autofill_from_filename(info)
    print("\n🗂️ Archivo:", s)
    print(json.dumps({"parsed": info, "autofill": auto}, indent=2, ensure_ascii=False))
PY
