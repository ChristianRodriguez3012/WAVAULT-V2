# IMPORTANTE: Inicio rápido WAVAULT (Codespaces)

## 1) Pre-requisitos del contenedor
- ffmpeg (audio de prueba):
  ```bash
  sudo apt-get update
  sudo apt-get install -y ffmpeg
  ```
- Node deps (raíz):
  ```bash
  cd /workspaces/WAVAULT-V2
  npm install
  ```
- Python deps (backend):
  ```bash
  cd /workspaces/WAVAULT-V2/WAVAULT/backend
  python3 -m pip install -r requirements.txt
  ```

## 2) Variables de entorno
- Copia `.env` a `WAVAULT/backend/.env`.
- Ajusta:
  - `GROQ_API_KEY=...` (activa Groq)
  - `USE_GROQ_PRIMARY=1`
  - Opcional: `GEMINI_API_KEY=...` para fallback.

## 3) Arrancar backend (modo simple)
```bash
cd /workspaces/WAVAULT-V2/WAVAULT/backend
export USE_GROQ_PRIMARY=1
export GROQ_API_KEY="<tu_key>"
node server.js
```

## 4) Smoke test IA (Groq)
Genera un audio sintético y valida el análisis V2 con artistas no usados:
```bash
cd /workspaces/WAVAULT-V2/WAVAULT/backend
export USE_GROQ_PRIMARY=1
export GROQ_API_KEY="<tu_key>"
ffmpeg -f lavfi -i "sine=f=440:d=8" -q:a 9 -acodec libmp3lame /tmp/test_unseen.wav -y
python3 analyze_beat_ai.py /tmp/test_unseen.wav "Central Cee x Ice Spice - Neon Drill TYPE BEAT - 140 BPM F# Minor [DEMO]" --v2 | tee /tmp/test_unseen_output.json
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
```

## 5) Errores vistos y cómo se resolvieron
- Timeouts altos (180s) -> Reducidos a 90s wrapper y 120s server para mejor UX.
- Tags genéricos/relleno -> Prompt y filtro backend limitan a 15 tags, bloquean genéricos (Music/Audio/Beat/Unknown/N/A/Type Beat sin artista, Style suelto, Urban genérico).
- Falta librería Groq -> Instalar con `pip install groq` (incluida en requirements).

## 6) Pendientes a revisar tras levantar la app
- Confirmar que los timeouts ajustados son suficientes bajo carga real.
- Validar que el filtrado de tags siga sin colar genéricos en múltiples artistas y tipos de beat.
- Evitar subir archivos temporales/DB/pid al repo (`wavault.db`, `server.pid`, `__pycache__`).
