# 🎵 FLUJO DE SELECCIÓN Y REPRODUCCIÓN - BEAT CON ARCHIVO PROCESADO

## 🎯 Resumen Ejecutivo

Ahora el sistema **prioriza el archivo procesado (clon)** sobre el original:
- **Original**: Guardado en `audio` (protegido, no debe reproducirse)
- **Procesado**: Guardado en `audio_processed` (clon con baja calidad 128kbps + tag WAVAULT)
- **Reproducción**: Player SIEMPRE usa `audio_processed` si está disponible

---

## 📊 Arquitectura del Flujo

```
┌─────────────────────────────────────────────────────────────────┐
│  PASO 1: USUARIO SUBE BEAT                                      │
└─────────────────────────────────────────────────────────────────┘
         │
         ↓
  /upload-beat (POST)
         │
         ├─→ Guardar audio ORIGINAL en: uploads/audio/{timestamp}.mp3
         ├─→ Guardar portada en: uploads/covers/{timestamp}.jpg
         └─→ Insertar en BD con campos:
              • audio = uploads/audio/{timestamp}.mp3
              • audio_processed = uploads/audio/{timestamp}_clone.mp3 (ruta)

┌─────────────────────────────────────────────────────────────────┐
│  PASO 2: PROCESAMIENTO ASINCRÓNICO                               │
└─────────────────────────────────────────────────────────────────┘
         │
         ↓
  process_beat_clone.py
         │
         ├─→ Lee archivo original
         ├─→ Busca tag WAVAULT (assets/tag.mp3)
         ├─→ FFmpeg: 
         │   - Inserta tag con delay (2000ms)
         │   - Reduce calidad a 128 kbps
         │   - Mix de 2 fuentes con volumes
         └─→ Guarda resultado en: uploads/audio/{timestamp}_clone.mp3

┌─────────────────────────────────────────────────────────────────┐
│  PASO 3: USUARIO ACCEDE AL FEED                                 │
└─────────────────────────────────────────────────────────────────┘
         │
         ↓
  GET /beats
         │
         ↓
  API devuelve JSON con:
  {
    "id": 1,
    "title": "My Beat",
    "audio": "uploads/audio/...",           ← ORIGINAL (protegido)
    "audio_processed": "uploads/audio/..._clone.mp3",  ← CLONE (se usa)
    "bpm": 120,
    "key": "C"
  }

┌─────────────────────────────────────────────────────────────────┐
│  PASO 4: USUARIO SELECCIONA BEAT                                │
└─────────────────────────────────────────────────────────────────┘
         │
         ↓
  Click en card de beat
         │
         ↓
  beat-player-integration.js
         │
         ├─→ Extrae datos del card
         ├─→ **PRIORIDAD**: 
         │   1. data-audioProcessed ✅
         │   2. data-audioUrl
         │   3. data-audio
         │   4. Fallback: /uploads/audio/{beatId}_clone.mp3
         └─→ Llama: window.wavaultPlayer.setBeat(beatData)

┌─────────────────────────────────────────────────────────────────┐
│  PASO 5: REPRODUCCIÓN                                            │
└─────────────────────────────────────────────────────────────────┘
         │
         ↓
  WavaultPlayer.setBeat(beatData)
         │
         ├─→ Actualiza UI:
         │   • Título, artista, portada
         │   • BPM, KEY en metadata
         │   • Barra progreso
         └─→ audioElement.src = beatData.archivo  ← URL PROCESADA
         │
         ↓
  Usuario escucha:
  ✅ Bitrate: 128 kbps (calidad reducida)
  ✅ Tag WAVAULT insertado a los 2 segundos
  ✅ Duración: tiempo completo del original
```

---

## 🗄️ Estructura de Base de Datos

### Tabla: `beats`

```sql
CREATE TABLE beats (
  id INTEGER PRIMARY KEY,
  title TEXT,
  audio TEXT,              -- uploads/audio/{timestamp}.mp3 (ORIGINAL)
  audio_processed TEXT,    -- uploads/audio/{timestamp}_clone.mp3 (PROCESADO)
  demo TEXT,               -- uploads/audio/{timestamp}_demo.mp3 (DEMO con marca)
  cover TEXT,
  bpm INTEGER,
  key TEXT,
  producer TEXT,
  price REAL,
  tags TEXT,
  ...
);
```

### Campos Importantes

| Campo | Contenido | Uso |
|-------|-----------|-----|
| `audio` | `uploads/audio/{id}.mp3` | **NO se usa** - Original protegido |
| `audio_processed` | `uploads/audio/{id}_clone.mp3` | ✅ **SE USA** - Clon reproducible |
| `demo` | `uploads/audio/{id}_demo.mp3` | Preview con marca de agua |

---

## 🔧 Componentes del Sistema

### 1. `process_beat_clone.py` (Backend)

**Ubicación**: `/WAVAULT/backend/process_beat_clone.py`

**Qué hace**:
```python
Input:  /uploads/audio/beat.mp3 (320 kbps, original)
↓
FFmpeg procesa:
├─ Reduce bitrate: 128 kbps
├─ Inserta tag WAVAULT a los 2000ms
├─ Mix de audio original + tag con volumen reducido
↓
Output: /uploads/audio/beat_clone.mp3 (128 kbps con tag)
```

**Parámetros**:
```bash
python3 process_beat_clone.py <input> <output> [delay_ms]

# Ejemplo
python3 process_beat_clone.py \
  /uploads/audio/beat.mp3 \
  /uploads/audio/beat_clone.mp3 \
  2000
```

**FFmpeg Filter**:
```
[0:a] = Audio original
[1:a] = Tag WAVAULT con delay 2000ms y volumen 0.4
Resultado: Mixtura de ambos
Codec: libmp3lame (MP3)
Bitrate: 128 kbps
```

---

### 2. `server.js` - Endpoint `/upload-beat` (Backend)

**Ubicación**: `/WAVAULT/backend/server.js` (línea ~523)

**Flujo**:
```javascript
1. Recibe audio + cover + metadata
2. Guarda archivos en /uploads/
3. Inserta en BD:
   • audio = ruta del original
   • audio_processed = ruta del clon (todavía NO existe)
4. Spawna proceso: python3 process_beat_clone.py
5. Script crea archivo _clone.mp3 en background
6. Retorna JSON con beatId y ruta audio_processed
```

**Respuesta**:
```json
{
  "success": true,
  "message": "✅ Beat guardado exitosamente",
  "beatId": 1,
  "audio_processed": "uploads/audio/1765371623469-LONER_-_Jumex_(320)_clone.mp3"
}
```

---

### 3. `beat-player-integration.js` (Frontend)

**Ubicación**: `/WAVAULT/public/js/beat-player-integration.js`

**Prioridad de Selección**:
```javascript
// ORDEN DE PRIORIDAD (primera que existe se usa):
archivo: 
  this.dataset.audioProcessed ||    // 1️⃣ Del atributo data-
  this.dataset.audioUrl ||           // 2️⃣ Del atributo data-
  this.dataset.audio ||              // 3️⃣ Del atributo data-
  '/uploads/audio/' + beatId + '_clone.mp3'  // 4️⃣ Fallback
```

**Extracción de Datos del Card**:
```javascript
beatData = {
  id: card.dataset.beatId,
  nombre: card.querySelector('.beat-title')?.textContent,
  productor: card.querySelector('.beat-producer')?.textContent,
  portada: card.querySelector('img')?.src,
  archivo: card.dataset.audioProcessed,  // ← AUDIO PROCESADO
  bpm: card.dataset.bpm,
  key: card.dataset.key
}
```

**Logs en Console**:
```javascript
console.log(`🎵 Seleccionando beat: ${beatData.nombre}`);
console.log(`   📁 Archivo: ${beatData.archivo}`);
console.log(`   🎼 ${beatData.bpm} BPM • ${beatData.key} KEY`);
```

---

### 4. `player-global.js` - WavaultPlayer (Frontend)

**Ubicación**: `/WAVAULT/public/js/player-global.js`

**Método setBeat()**:
```javascript
setBeat(beat, addToPlaylist = true) {
  this.currentBeat = beat;
  this.audioElement.src = beat.archivo;  // ← Usa archivo procesado
  // Actualiza UI con metadata
  updatePlayButton();
  if (addToPlaylist) play();
}
```

---

## 📁 Estructura de Archivos

### Directorio `/uploads/audio/`

```
beats/
├─ 1765371623469-LONER_-_Jumex_(320).mp3
│  ├─ Tamaño: 7.0 MB
│  ├─ Bitrate: 320 kbps
│  └─ Uso: ORIGINAL (guardado, protegido)
│
├─ 1765371623469-LONER_-_Jumex_(320)_clone.mp3 ✅
│  ├─ Tamaño: ~1.8 MB (25% del original)
│  ├─ Bitrate: 128 kbps
│  ├─ Contiene: Tag WAVAULT a los 2 segundos
│  └─ Uso: SE REPRODUCE EN PLAYER
│
└─ 1765371623469-LONER_-_Jumex_(320)_demo.mp3
   ├─ Tamaño: ~2.5 MB
   ├─ Bitrate: 128 kbps
   ├─ Contiene: Marca de agua (tag al inicio)
   └─ Uso: Preview antes de comprar
```

---

## 🔄 Flujo Completo de Reproducción

### 1. API /beats devuelve:
```json
{
  "id": 5,
  "title": "CICATRICES - Rafaell",
  "audio": "uploads/audio/1765319623630-CICATRICES...mp3",
  "audio_processed": "uploads/audio/1765319623630-CICATRICES..._clone.mp3",
  "bpm": 137,
  "key": "Cm",
  "producer": "rafaell@producer.com"
}
```

### 2. HTML card del beat (renderizado en feed):
```html
<div class="beat-card"
     data-beatId="5"
     data-audioProcessed="uploads/audio/1765319623630-CICATRICES..._clone.mp3"
     data-audio="uploads/audio/1765319623630-CICATRICES...mp3"
     data-bpm="137"
     data-key="Cm">
  <!-- Card content -->
</div>
```

### 3. Usuario hace click → beat-player-integration.js:
```javascript
beatData.archivo = card.dataset.audioProcessed  // ✅ Prioridad #1
// Resultado: "uploads/audio/1765319623630-CICATRICES..._clone.mp3"
```

### 4. Player reproduce:
```
Escucha:
✅ Bitrate 128 kbps (no es calidad full)
✅ Tag "WAVAULT" audible a los 2 segundos
✅ Duración completa del beat
✅ Metadatos: 137 BPM • Cm KEY
```

---

## 🧪 Test de Selección

### Comando para probar:
```bash
bash /workspaces/WAVAULT-V2/test_beat_selection_simple.sh
```

### Output esperado:
```
✅ Beat insertado manualmente con ID: 1
✅ API DEVUELVE AUDIO_PROCESSED
✅ beat-player-integration.js prioriza audio_processed > audio
```

---

## 🛡️ Protección del Original

| Escenario | Resultado |
|-----------|-----------|
| Usuario intenta acceder a `/uploads/audio/beat.mp3` directamente | ❌ Puede descargarlo (está públicamente accesible) |
| Player reproduce `audio` en lugar de `audio_processed` | ❌ INCORRECTO (código debe priorizar _clone.mp3) |
| Beat se sube sin script procesamiento | ⚠️ Se guarda audio_processed = NULL, player usa fallback |
| Beat se reproduce desde dashboard | ✅ Siempre usa `audio_processed` con tag |

**Nota**: Para protección completa del original, se necesitaría:
- Mover archivos a directorio privado (fuera de `/public`)
- Implementar autenticación en endpoint de descarga
- Usar DRM o watermarking avanzado

---

## 📚 Archivos Involucrados

```
Backend:
├─ /WAVAULT/backend/server.js ..................... POST /upload-beat
├─ /WAVAULT/backend/db.js ......................... Tabla beats + migraciones
├─ /WAVAULT/backend/process_beat_clone.py ........ Procesamiento (FFmpeg)
└─ /WAVAULT/backend/assets/tag.mp3 ............... Tag WAVAULT (audio)

Frontend:
├─ /WAVAULT/public/js/beat-player-integration.js . Selección de beat
├─ /WAVAULT/public/js/player-global.js ........... Reproducción
└─ Todos los HTML (index.html, dashboard/*, etc)

Pruebas:
├─ /test_beat_selection_simple.sh ................ Test básico
├─ /test_beat_selection.sh ....................... Test con API
└─ /test_full_upload_process.sh .................. Test completo
```

---

## 🚀 Cómo Probar

### 1. **Verificar que el servidor está corriendo**:
```bash
curl http://localhost:3000/beats | jq '.[0] | {audio, audio_processed}'
```

### 2. **Verificar estructura en BD**:
```bash
sqlite3 /workspaces/WAVAULT-V2/WAVAULT/backend/wavault.db \
  "SELECT id, title, audio, audio_processed FROM beats LIMIT 3;"
```

### 3. **Verificar que beat-player-integration.js tiene prioridad**:
```bash
grep -A 3 "archivo:" /workspaces/WAVAULT-V2/WAVAULT/public/js/beat-player-integration.js
```

### 4. **Test completo en navegador**:
1. Abre: `http://localhost:3000/dashboard/client.html`
2. Haz click en un beat
3. Abre DevTools (F12) → Console
4. Deberías ver: `🎵 Seleccionando beat: [nombre]`
5. Deberías ver: `📁 Archivo: uploads/audio/..._clone.mp3`
6. Escucha: Bitrate reducido + tag WAVAULT

---

## ⚠️ Problemas Comunes

| Problema | Causa | Solución |
|----------|-------|----------|
| Player reproduce original (320kbps audible) | `audio_processed` es NULL | Ejecutar process_beat_clone.py manualmente |
| No se escucha tag WAVAULT | Tag no existe o FFmpeg no funciona | Verificar `/backend/assets/tag.mp3` |
| `audio_processed` = NULL en BD | Script procesamiento no ejecutó | Verificar permisos de FFmpeg |
| Player no selecciona beat al hacer click | beat-player-integration.js no cargó | Verificar console por errores de load |

---

**Última actualización**: Diciembre 2025
**Versión**: 2.0 - Beat Clone + Tag System
