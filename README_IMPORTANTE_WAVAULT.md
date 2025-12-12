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
Opción rápida usando el script listo:
```bash
cd /workspaces/WAVAULT-V2/WAVAULT/backend
chmod +x smoke_groq_test.sh
./smoke_groq_test.sh
```

Si prefieres manual, sigue los pasos del script (exporta `GROQ_API_KEY`, genera audio con ffmpeg y corre `analyze_beat_ai.py --v2`).

## 5) Errores vistos y cómo se resolvieron
- Timeouts altos (180s) -> Reducidos a 90s wrapper y 120s server para mejor UX.
- Tags genéricos/relleno -> Prompt y filtro backend limitan a 15 tags, bloquean genéricos (Music/Audio/Beat/Unknown/N/A/Type Beat sin artista, Style suelto, Urban genérico).
- Falta librería Groq -> Instalar con `pip install groq` (incluida en requirements).

## 6) Pendientes a revisar tras levantar la app
- Confirmar que los timeouts ajustados son suficientes bajo carga real.
- Validar que el filtrado de tags siga sin colar genéricos en múltiples artistas y tipos de beat.
- Evitar subir archivos temporales/DB/pid al repo (`wavault.db`, `server.pid`, `__pycache__`).
