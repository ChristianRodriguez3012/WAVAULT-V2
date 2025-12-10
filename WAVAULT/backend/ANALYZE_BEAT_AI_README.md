# analyze_beat_ai.py - Guía de Uso

## Descripción
Script robusto de Python que analiza archivos de audio para extraer características técnicas e inferir el Mood y Tags usando la API de Google Gemini.

## Características Principales

### Fase 1: Análisis Matemático (Local)
- **Detección de BPM**: Identifica el tempo exacto usando análisis de onset
- **Extracción de Chroma Features**: Determina la tonalidad (Key) y si es Mayor/Menor
- **Análisis Espectral**: Calcula el centroide espectral para brillo/oscuridad
- **Clasificación por BPM**: Sugiere géneros basados en tempo

### Fase 2: Inteligencia Artificial (Gemini API)
- Conecta con Google Gemini para análisis musicológico avanzado
- Infiere el Mood basado en datos técnicos
- Genera 5 tags descriptivos contextualizados

## Instalación

```bash
# Instalar dependencias
pip install librosa numpy scipy google-generativeai

# O usar requirements.txt
pip install -r requirements.txt
```

## Configuración

### Variables de Entorno
```bash
export GEMINI_API_KEY="tu_api_key_de_google_gemini"
```

O editar directamente en el script (línea 13):
```python
GEMINI_API_KEY = "tu_api_key_aqui"
```

**Obtener API Key**: [Google AI Studio](https://makersuite.google.com/app/apikey)

## Uso

```bash
# Forma básica
python3 analyze_beat_ai.py /ruta/del/audio.mp3

# Con variable de entorno
GEMINI_API_KEY="tu_key" python3 analyze_beat_ai.py /ruta/del/audio.mp3
```

## Salida JSON

```json
{
  "status": "success",
  "technical_data": {
    "bpm": 95,
    "key": "C Minor",
    "duration": 180,
    "spectral_centroid": 2450
  },
  "ai_inference": {
    "mood": "Melancholic / Dark",
    "tags": ["Lo-Fi Hip-Hop", "Sad Type Beat", "Minor Key", "Dark Ambient", "Underground"]
  }
}
```

## Integración con Node.js

```javascript
const { spawn } = require('child_process');

function analyzeAudioWithAI(audioPath) {
  return new Promise((resolve, reject) => {
    const process = spawn('python3', ['analyze_beat_ai.py', audioPath], {
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
        resolve(result);
      } else {
        reject(new Error('Script de análisis falló'));
      }
    });

    process.stderr.on('data', (data) => {
      console.error('Error:', data.toString());
    });
  });
}

// Uso
analyzeAudioWithAI('/ruta/audio.mp3')
  .then(result => console.log(result))
  .catch(err => console.error(err));
```

## Manejo de Errores

El script retorna JSON con estado de error:

```json
{
  "status": "error",
  "error": "file_not_found",
  "message": "Archivo no encontrado: /ruta/inexistente.mp3"
}
```

Códigos de error:
- `file_not_found`: Archivo de audio no existe
- `invalid_input`: Argumentos inválidos
- `processing_error`: Error durante análisis

## Características Técnicas

### Algoritmos Utilizados
- **Onset Detection**: Para detección de BPM preciso
- **Chroma CQT**: Para análisis de tonalidad robusta
- **Mel-Spectrogram**: Para análisis espectral
- **MFCC**: Coeficientes mel-frecuencia para contexto armónico

### Optimizaciones
- Limita duración a 120 segundos para rendimiento
- Caché de Gemini API (reutiliza modelos)
- JSON limpio sin caracteres especiales problemáticos

## Requisitos

- Python 3.7+
- Librosa 0.10+
- NumPy
- SciPy
- google-generativeai
- Acceso a API de Google Gemini
- Archivos de audio en formatos: MP3, WAV, FLAC, OGG

## Límites y Consideraciones

- **Duración máxima**: 120 segundos (optimizable)
- **Formatos soportados**: Los que librosa puede procesar
- **API Rate Limits**: Respetar límites de Gemini API
- **Latencia**: ~3-5 segundos por análisis (depende de API)

## Troubleshooting

### "ModuleNotFoundError: No module named 'librosa'"
```bash
pip install librosa --upgrade
```

### "Error en inferencia con Gemini"
- Verificar GEMINI_API_KEY válida
- Verificar conexión a internet
- Revisar cuota de API

### Audio no reconocido
```bash
# Instalar ffmpeg (requerido por librosa)
# Ubuntu/Debian
sudo apt-get install ffmpeg

# macOS
brew install ffmpeg
```
