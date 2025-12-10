# 🎵 Nuevo Flujo de Carga de Beats - WAVAULT V2

## 📋 Descripción General

El nuevo flujo de carga automático de beats WAVAULT V2 está diseñado para ser **100% inteligente** y **amigable con el usuario**.

### ✨ Características Principales

1. **Extracción Automática de Metadatos** del nombre del archivo
2. **Análisis de Audio en Tiempo Real** (BPM, Key, Mood)
3. **Modal de Confirmación Interactivo** con datos pre-rellenados
4. **Guardado Solo Tras Confirmación** (seguridad de datos)
5. **Edición Manual de Campos** si es necesario

---

## 🔄 Flujo de Trabajo Paso a Paso

### **Paso 1: Usuario Sube un Beat**
```
Usuario → Selecciona archivo MP3 → El nombre del archivo es enviado al servidor
```

**Ejemplo de nombre válido:**
```
COLE x DRAKE TYPE BEAT - Fm Maj 90 - CLASSIC.mp3
Artist - Song - 140BPM - Cm - Beat Type.mp3
Drake TYPE BEAT - 120BPM - Am - Dark.mp3
```

### **Paso 2: Extracción Inteligente de Metadatos**
El servidor llama a `parse_filename_ai.py` que extrae:

```json
{
  "artist": "COLE x DRAKE",
  "title": "CLASSIC", 
  "bpm": 90,
  "key": "Fm",
  "type": "Type Beat",
  "artist_confidence": 85,
  "bpm_confidence": 90,
  "key_confidence": 85,
  "title_confidence": 80
}
```

**¿Qué identifica?**

| Campo | Patrón | Ejemplo |
|-------|--------|---------|
| **Artist** | Primera parte del nombre | `COLE x DRAKE` |
| **Title** | Última parte (sin números) | `CLASSIC` |
| **BPM** | Número 2-3 dígitos | `90`, `120BPM`, `140` |
| **Key** | Nota musical + suffijo | `Fm`, `Am`, `C#maj` |
| **Type** | "TYPE BEAT" en el nombre | `Type Beat` |

### **Paso 3: Análisis de Audio en Paralelo**
Mientras se extrae el nombre, el servidor analiza el audio con Python:

```
/api/analyze-beat
↓
analyze_beat_ai.py
↓
- Extrae BPM usando 3 métodos (librosa)
- Detecta Key usando Krumhansl-Schmuckler
- Identifica Mood (triste/feliz/etc)
- Genera 15-30 tags con Gemini
```

**Retorna:**
```json
{
  "technical_data": {
    "bpm": 94,
    "bpm_confidence": 64.1,
    "key": "A# Minor",
    "key_confidence": 88.3
  },
  "ai_inference": {
    "mood": "Sad / Introspective",
    "tags": ["melancholic", "dark", "trap", ...]
  }
}
```

### **Paso 4: Modal de Confirmación**
El cliente muestra un **MODAL INTERACTIVO** con:

**Datos Extraídos del Nombre (PRIORIDAD ALTA):**
- ✅ Artista: COLE x DRAKE (85% confianza)
- ✅ Canción: CLASSIC (80% confianza)
- ✅ BPM: 90 (90% confianza)
- ✅ Key: Fm (85% confianza)
- ✅ Type: Type Beat

**Datos del Análisis de Audio (COMPLEMENTO):**
- 🎵 Mood: Sad / Introspective
- 🏷️ Tags: [14 etiquetas generadas]

**Indicadores de Confianza:**
- 🟢 **Alto** (>80%): Verde - Muy fiable
- 🟡 **Medio** (60-80%): Naranja - Revisar
- 🔴 **Bajo** (<60%): Rojo - Editar manualmente

### **Paso 5: Usuario Puede Editar**
Todos los campos son **editables si el usuario lo desea**:

```html
<input type="text" id="modalArtist" />  <!-- Puede editar -->
<input type="text" id="modalTitle" />   <!-- Puede editar -->
<input type="number" id="modalBpm" />   <!-- Puede editar -->
```

### **Paso 6: Confirmación y Guardado**
Solo cuando el usuario hace clic en **✅ Confirmar y Guardar**:

```
Usuario → Confirma datos → Servidor valida → Guarda en BD
                                    ↓
                            Beat está disponible
```

---

## 🔧 Configuración Técnica

### Endpoints Utilizados

#### **1. POST /api/parse-filename**
Extrae metadata del nombre del archivo

**Request:**
```json
{
  "filename": "COLE x DRAKE TYPE BEAT - Fm Maj 90 - CLASSIC.mp3"
}
```

**Response:**
```json
{
  "artist": "COLE x DRAKE",
  "title": "CLASSIC",
  "bpm": 90,
  "key": "Fm",
  "type": "Type Beat",
  "artist_confidence": 85,
  "bpm_confidence": 90,
  "key_confidence": 85,
  "title_confidence": 80
}
```

#### **2. POST /api/analyze-beat**
Analiza el archivo de audio

**Request:** FormData con archivo
**Response:** JSON con BPM, Key, Mood, Tags

#### **3. POST /upload-beat**
Guarda el beat en la BD (SOLO tras confirmación)

**Request:**
```json
{
  "audio": File,
  "artist": "COLE x DRAKE",
  "title": "CLASSIC",
  "bpm": 90,
  "key": "Fm",
  "type": "Type Beat",
  "mood": "Melancholic",
  "price": 10,
  "producer": "username",
  "description": "Opcional"
}
```

---

## 📊 Formato de Nombres Soportados

El parser está optimizado para estos formatos:

```
✅ COLE x DRAKE TYPE BEAT - Fm Maj 90 - CLASSIC
✅ Drake - God's Plan - 140BPM - Fm
✅ Artist NAME - 120BPM - Gm - Song Title
✅ Producer TYPE BEAT - Am 100 - Title
✅ Artist - 95BPM - C#major - Song Name
```

---

## 🎯 Prioridades de Extracción

| Fuente | Confianza | Uso |
|--------|-----------|-----|
| **Nombre Archivo** | 85-95% | ✅ PRIMARIO |
| **Análisis Audio** | 50-90% | 🔄 Complemento |
| **Manual del Usuario** | 100% | 📝 Final |

### Ejemplo de Priorización:

Si el nombre dice `Fm` pero el audio detecta `G minor`:
→ Se muestra `Fm` (85% confianza) con opción a editar

Si el nombre no tiene BPM pero el audio detecta 94:
→ Se muestra `94` (64% confianza) del análisis

---

## 🛡️ Validaciones

**Antes de Guardar:**
- ✅ Todos los campos obligatorios presentes
- ✅ BPM es número válido (2-3 dígitos)
- ✅ Key es nota musical válida
- ✅ Precio > 0
- ✅ Archivo de audio existe

**Después de Guardar:**
- ✅ Se genera demo (watermark) automáticamente
- ✅ Se almacena en base de datos
- ✅ Se redirige a dashboard del productor

---

## 📁 Archivos Relacionados

| Archivo | Propósito |
|---------|-----------|
| `upload-beat-new.html` | Interfaz de carga (Frontend) |
| `parse_filename_ai.py` | Extracción de metadatos |
| `analyze_beat_ai.py` | Análisis de audio |
| `/api/upload-beat` | Endpoint guardado |
| `/api/parse-filename` | Endpoint extracción |

---

## 🚀 Cómo Usar

### Para Productores:

1. **Ir a:** `http://localhost:3000/upload-beat`
2. **Subir archivo** con nombre bien formado
3. **Esperar análisis** (30-60 segundos)
4. **Revisar modal** con datos extraídos
5. **Editar si necesario** (precio, descripción)
6. **Confirmar** para guardar

### Ejemplo de Nombre Perfecto:
```
Producer Name x Collaborator TYPE BEAT - Em 120BPM - Epic Title.mp3
```

---

## ⚙️ Tecnología Detrás

### Backend (Node.js)
- **Express.js:** Routing y middleware
- **Multer:** Manejo de uploads
- **sqlite3:** Base de datos

### Audio Analysis (Python)
- **librosa:** Análisis de BPM y características
- **scipy:** Procesamiento de señales
- **google.generativeai:** Gemini AI para tags

### Frontend (HTML5/JS)
- **Vanilla JavaScript:** Sin dependencias
- **Fetch API:** Comunicación con servidor
- **CSS3:** Interfaz responsiva

---

## 📈 Mejoras Futuras

- [ ] Soporte para más formatos (FLAC, WAV, M4A)
- [ ] Detección de cooperativas de productores
- [ ] Automático upload a TuneBat/Beatstars
- [ ] Batch upload múltiples beats
- [ ] Integración con metadata de Shazam

---

## ❓ FAQ

**P: ¿Qué pasa si el nombre no tiene BPM?**
R: Se usa el BPM detectado del audio (mostrado con menor confianza)

**P: ¿Puedo editar todos los campos?**
R: Sí, todos son editables en el modal antes de confirmar

**P: ¿Se guarda si no confirmo?**
R: No, el beat SOLO se guarda tras confirmación explícita

**P: ¿Qué hago si el análisis está mal?**
R: Edita los campos en el modal y confirma con tus datos correctos

**P: ¿Cuánto tarda el análisis?**
R: 30-60 segundos dependiendo de la duración del audio

---

## 📞 Soporte

Para problemas contacta al equipo de desarrollo de WAVAULT.

**Última actualización:** Diciembre 10, 2024
