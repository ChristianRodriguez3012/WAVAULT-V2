# 🎵 Configuración de analyze_beat_ai.py

## 1️⃣ Obtener API Key de Google Gemini

### Paso 1: Ir a Google AI Studio
Visita: https://makersuite.google.com/app/apikey

### Paso 2: Crear o usar tu cuenta Google
Si no tienes cuenta, créala. Si ya tienes, inicia sesión.

### Paso 3: Crear nueva API Key
- Haz clic en **"Create API Key"**
- Selecciona **"Create API key in new project"** (si es la primera vez)
- Copia la API Key generada

### Paso 4: Verificar acceso a Gemini API
- Ve a [Google Cloud Console](https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com)
- Asegúrate de que **Generative Language API** está habilitada

---

## 2️⃣ Configurar en tu Sistema

### Opción A: Variable de Entorno (Recomendado)

```bash
# Exportar en tu terminal actual
export GEMINI_API_KEY="tu_api_key_aqui"

# Hacer persistente (agregar a ~/.bashrc o ~/.zshrc)
echo 'export GEMINI_API_KEY="tu_api_key_aqui"' >> ~/.bashrc
source ~/.bashrc
```

### Opción B: Archivo .env (Para desarrollo)

Crear archivo `.env` en `/workspaces/WAVAULT-V2/WAVAULT/backend/`:

```
GEMINI_API_KEY=tu_api_key_aqui
```

Luego cargar antes de ejecutar:
```bash
source .env
python3 analyze_beat_ai.py audio.mp3
```

### Opción C: Editar el script directamente

En `analyze_beat_ai.py`, línea 13:
```python
GEMINI_API_KEY = "tu_api_key_aqui"  # Reemplazar con tu clave real
```

⚠️ **No commitar a Git con la clave visible**

---

## 3️⃣ Instalar Dependencias

```bash
cd /workspaces/WAVAULT-V2/WAVAULT/backend

# Opción 1: Instalar desde requirements.txt
pip install -r requirements.txt

# Opción 2: Instalar manualmente
pip install librosa numpy scipy google-generativeai
```

### Dependencia adicional: FFmpeg

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install ffmpeg

# macOS
brew install ffmpeg

# Verificar instalación
ffmpeg -version
```

---

## 4️⃣ Verificar Configuración

```bash
# Test básico de importes
python3 -c "import librosa, google.generativeai; print('✓ Dependencias OK')"

# Test de conexión a API
export GEMINI_API_KEY="tu_api_key"
python3 -c "import google.generativeai as genai; genai.configure(api_key='$GEMINI_API_KEY'); model = genai.GenerativeModel('gemini-pro'); response = model.generate_content('Hola'); print('✓ Conexión a Gemini OK')"
```

---

## 5️⃣ Usar el Script

### Ejecución básica
```bash
python3 analyze_beat_ai.py /ruta/del/audio.mp3
```

### Con API Key inline
```bash
GEMINI_API_KEY="tu_api_key" python3 analyze_beat_ai.py audio.mp3
```

### Guardar resultado en archivo
```bash
python3 analyze_beat_ai.py audio.mp3 > resultado.json
```

---

## 6️⃣ Integración en Node.js/Express

### Opción 1: Usar módulo ai-analysis-integration.js

```javascript
const AudioAIAnalyzer = require('./ai-analysis-integration');

// Con API Key de entorno
const analyzer = new AudioAIAnalyzer();

analyzer.analyze('/ruta/audio.mp3')
  .then(result => {
    console.log('Mood:', result.ai_inference.mood);
    console.log('Tags:', result.ai_inference.tags);
    console.log('BPM:', result.technical_data.bpm);
  })
  .catch(err => console.error(err));
```

### Opción 2: Usar en ruta Express (ejemplo-integracion.js)

```javascript
const express = require('express');
const multer = require('multer');
const routes = require('./ejemplo-integracion');

const app = express();
const upload = multer({ dest: '/tmp' });

app.post('/api/analyze-beat', upload.single('file'), routes);

app.listen(3000, () => {
  console.log('Servidor listo en http://localhost:3000');
});
```

### Opción 3: Llamar directamente con spawn

```javascript
const { spawn } = require('child_process');

const process = spawn('python3', ['analyze_beat_ai.py', 'audio.mp3'], {
  env: {
    ...process.env,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY
  }
});

let output = '';
process.stdout.on('data', (data) => {
  output += data.toString();
});

process.on('close', (code) => {
  if (code === 0) {
    const result = JSON.parse(output);
    console.log(result);
  }
});
```

---

## 7️⃣ Troubleshooting

### Error: "GEMINI_API_KEY no configurada"
```bash
# Verificar si está configurada
echo $GEMINI_API_KEY

# Si está vacía, configurarla
export GEMINI_API_KEY="tu_api_key"
```

### Error: "ModuleNotFoundError: No module named 'librosa'"
```bash
pip install librosa --upgrade

# O especificar versión exacta
pip install librosa==0.10.0
```

### Error: "ffmpeg not found"
```bash
# Ubuntu
sudo apt-get install ffmpeg

# Verificar
which ffmpeg
```

### Error de conexión a Gemini API
- Verificar que la API Key es válida
- Verificar conexión a internet: `ping google.com`
- Verificar que la Generative Language API está habilitada en Cloud Console

### Error: "Error en extracción de características"
- Verificar que el archivo de audio es válido
- Probar con otro archivo
- Revisar la consola para más detalles

---

## 8️⃣ Límites y Cuotas

### Google Gemini API
- **Cuota Gratuita**: 60 solicitudes por minuto
- **Modelos disponibles**: 
  - `gemini-pro` (texto)
  - `gemini-pro-vision` (texto + imagen)

### Script
- **Duración máxima de audio**: 120 segundos (optimizable)
- **Formatos soportados**: MP3, WAV, FLAC, OGG, etc.
- **Latencia**: ~3-5 segundos por análisis

---

## 9️⃣ Monitoreo en Producción

```bash
# Ver logs en tiempo real
tail -f /var/log/audio-analysis.log

# Contar solicitudes de análisis
grep -c "analyze_beat_ai.py" /var/log/audio-analysis.log

# Monitorear uso de API
# Ver en: https://console.cloud.google.com/apis/dashboard
```

---

## 🔟 Seguridad

### ⚠️ Nunca hagas esto:
```bash
# ❌ NO: Dejar API Key en el código
GEMINI_API_KEY = "sk-xxx" # BAD!

# ❌ NO: Comitear archivo .env con clave
git add .env  # BAD!

# ❌ NO: Mostrar clave en logs públicos
echo $GEMINI_API_KEY > log.txt  # BAD!
```

### ✅ Hacer esto:
```bash
# ✓ Usar variables de entorno
export GEMINI_API_KEY="..." 

# ✓ Agregar .env a .gitignore
echo ".env" >> .gitignore

# ✓ Usar secrets en CI/CD (GitHub Actions)
# github_env.GEMINI_API_KEY = secrets.GEMINI_API_KEY
```

---

## 📚 Recursos Útiles

- [Google Generative AI Docs](https://ai.google.dev/docs)
- [Librosa Documentation](https://librosa.org/)
- [FFmpeg Guide](https://ffmpeg.org/documentation.html)
- [NumPy Docs](https://numpy.org/doc/)

---

**¿Problemas?** Revisa la consola para mensajes de error detallados y consulta esta guía.
