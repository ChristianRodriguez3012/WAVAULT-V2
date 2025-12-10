# 🎵 PRUEBAS DE ENDPOINTS CON IA - WAVAULT V2

## 🚀 SERVIDOR ACTIVO
- **URL Base:** http://localhost:3000
- **API Key Gemini:** Configurada ✅
- **Estado:** Corriendo (PID: 210543)

---

## 📍 ENDPOINTS DISPONIBLES

### 1️⃣ **POST /api/analyze-beat**
**Descripción:** Analiza un beat completo (técnico + IA)

**Uso:**
```bash
curl -F "audio=@ruta/archivo.mp3" http://localhost:3000/api/analyze-beat
```

**Respuesta:**
```json
{
  "success": true,
  "analysis": {
    "status": "success",
    "technical_data": {
      "bpm": 94,
      "bpm_confidence": 64.1,
      "key": "A# Minor",
      "key_confidence": 88.3,
      "duration": 3,
      "spectral_centroid": 3195,
      "lufs": -48.63,
      "spectral_rolloff": 7108,
      "zero_crossing_rate": 0.1553
    },
    "ai_inference": {
      "mood": "Sad / Introspective",
      "tags": ["A# Minor", "A#m", "94 BPM", "Lo-Fi", "Hip-Hop", ...],
      "chord_progression": ["G#min", "Emin", "A#min"],
      "scale_explanation": "..."
    }
  }
}
```

---

### 2️⃣ **POST /api/analyze-beat/inference-only**
**Descripción:** Solo inferencia IA (sin análisis técnico completo)

**Uso:**
```bash
curl -F "audio=@ruta/archivo.mp3" http://localhost:3000/api/analyze-beat/inference-only
```

---

### 3️⃣ **POST /api/enrich-metadata**
**Descripción:** Enriquece metadatos usando Tunebat + Gemini (scraping)

**Uso:**
```bash
curl -X POST http://localhost:3000/api/enrich-metadata \
  -H "Content-Type: application/json" \
  -d '{"filename":"Bad Bunny - Titi Me Pregunto - 95BPM - Am.mp3"}'
```

**Respuesta:**
```json
{
  "success": true,
  "enrichment": {
    "status": "success",
    "filename": "Bad Bunny - Titi Me Pregunto - 95BPM - Am.mp3",
    "internal_data": {
      "artist": "Bad Bunny",
      "title": "Titi Me Pregunto",
      "bpm": 95,
      "key": "A Minor"
    },
    "tunebat_data": [...],
    "enriched_metadata": {
      "bpm_final": 95,
      "tonalidad_final": "A Minor",
      "tags": [...]
    }
  }
}
```

---

### 4️⃣ **POST /api/enrich-beats-simple**
**Descripción:** Enriquecimiento simple (solo Gemini, sin Tunebat)

**Uso:**
```bash
curl -X POST http://localhost:3000/api/enrich-beats-simple \
  -H "Content-Type: application/json" \
  -d '{"filename":"Travis Scott - Goosebumps - 155BPM - Gm.mp3"}'
```

---

## ✅ CARACTERÍSTICAS IMPLEMENTADAS

### 🎯 Análisis Técnico
- ✅ Detección BPM multi-método (3 algoritmos)
- ✅ Detección de tonalidad (Krumhansl-Schmuckler)
- ✅ Análisis espectral (centroid, rolloff, ZCR)
- ✅ Medición LUFS (loudness)
- ✅ Progresión de acordes
- ✅ Sistema de confianza (0-100%)

### 🤖 Inteligencia Artificial
- ✅ Detección de mood (Gemini 2.0 Flash)
- ✅ Generación de 15-30 tags
- ✅ Búsqueda web habilitada (Google Search Retrieval)
- ✅ Explicación de escala musical
- ✅ Fallback local cuando no hay API key

### 🌐 Web Scraping
- ✅ Tunebat scraping (Selenium headless)
- ✅ ChromeDriverManager automático
- ✅ Extracción de BPM/Key desde web
- ✅ Comparación multi-fuente

### 📊 Sistema de Prioridades
1. **Datos del filename** (100% confianza)
2. **Tunebat scraping** (85-95% confianza)
3. **Gemini web search** (90% confianza)
4. **Detección automática** (60-80% confianza)

---

## 🧪 PRUEBAS RÁPIDAS

### Prueba 1: Análisis completo
```bash
curl -F "audio=@WAVAULT/backend/assets/tag.mp3" \
  http://localhost:3000/api/analyze-beat | python3 -m json.tool
```

### Prueba 2: Enriquecimiento con nombre
```bash
curl -X POST http://localhost:3000/api/enrich-beats-simple \
  -H "Content-Type: application/json" \
  -d '{"filename":"Bad Bunny - Titi Me Pregunto - 95BPM - Am.mp3"}' \
  | python3 -m json.tool
```

### Prueba 3: Verificar servidor
```bash
curl http://localhost:3000/
```

---

## 🔧 CONFIGURACIÓN

### Variables de Entorno
```bash
export GEMINI_API_KEY='AIzaSyBqreeolm2eh4e0SIoELyDGRT4EaT81aI4'
```

### Iniciar Servidor
```bash
cd /workspaces/WAVAULT-V2/WAVAULT/backend
GEMINI_API_KEY='AIzaSyBqreeolm2eh4e0SIoELyDGRT4EaT81aI4' nohup node server.js > /tmp/server.log 2>&1 &
```

### Ver Logs
```bash
tail -f /tmp/server.log
```

---

## 📦 DEPENDENCIAS INSTALADAS

### Python
- librosa (análisis de audio)
- numpy, scipy (procesamiento)
- google-generativeai (Gemini AI)
- selenium (web scraping)
- webdriver-manager (ChromeDriver)
- requests, beautifulsoup4 (HTTP/parsing)

### Node.js
- express
- multer (file uploads)
- sqlite3

---

## 🎉 ¡LISTO PARA USAR!

Todos los endpoints están funcionando. Puedes:
1. Subir beats desde la interfaz web
2. Usar cURL para pruebas rápidas
3. Integrar en el frontend con fetch/axios
4. Ver análisis en tiempo real con tags automáticos

**Servidor:** http://localhost:3000
**Logs:** /tmp/server.log
