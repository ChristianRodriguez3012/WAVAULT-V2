# 🏷️ SISTEMA DE TAGS INTELIGENTE - WAVAULT V2

## 📋 Resumen

Sistema de generación automática de tags musicales relevantes que combina:
- **Parser de filename** (confidence 95-100%)
- **Análisis técnico de audio** (confidence 50%)
- **Validación por IA (Gemini)** (confidence 70%)

**Cantidad de tags generados**:
- ✅ **15-25 tags** si Gemini conoce al artista y tiene info verídica
- ✅ **10-16 tags** si no hay info del artista o Gemini no disponible
- ❌ **NO tags genéricos** como "AI Analyzed", "Music", "Audio"

---

## 🎯 Categorías de Tags Generados

### 1. **OBLIGATORIOS (Siempre presentes)**

#### KEY Musical
```
Ejemplos: "Cm", "D#m", "F", "G#", "Bb"
```
- Formato corto de la escala
- Si es Minor: agrega "m" (ej: "Dm")
- Si es Major: solo la nota (ej: "D")
- Tag adicional: "Minor" o "Major"

#### BPM Numérico
```
Ejemplos: "85BPM", "140BPM", "174BPM"
```
- Siempre formato: `{número}BPM`

---

### 2. **NOMBRE DEL BEAT (Derivados del nombre)**

#### Beat Name Completo
```
Ejemplo: "Travis Scott" si filename es "[DEMO] Travis Scott Type Beat - Cm 140.mp3"
```

#### Sinónimos/Variaciones
```
Ejemplo: "Travis", "Scott" (cada palabra del nombre por separado)
```
- Solo palabras de 4+ caracteres

#### Artista de Referencia
```
Ejemplo: Si filename tiene "Drake Type Beat"
Tags generados: "Drake", "Drake Type"
```

---

### 3. **MOOD/VIBE (Por KEY y análisis)**

#### Por Escala (Automático)
```
Minor → "Dark", "Melancholic", "Emotional", "Deep"
Major → "Uplifting", "Positive", "Bright"
```

#### Por IA (Si Gemini está activo)
```
Ejemplos adicionales: "Energetic", "Sad", "Happy", "Chill", "Aggressive"
```

---

### 4. **GÉNERO (Por BPM + IA)**

#### Determinación Automática por BPM
| BPM Range | Género Automático | Tags Adicionales |
|-----------|-------------------|------------------|
| 60-89 | Hip-Hop/Trap | "Slow", "Hip-Hop", "Chill" |
| 90-109 | Lo-Fi/Chill | "Medium", "Lo-Fi" |
| 110-127 | Pop/R&B | "Mid-Tempo", "Pop" |
| 128-139 | House/Dance | "Energetic", "House", "Dance" |
| 140-160 | Trap/Dubstep | "Hard", "Trap", "Aggressive" |
| 161-180 | Drum & Bass | "Fast", "DnB" |
| 180+ | Electronic | "Electronic" |

#### Por IA (Si conoce al artista)
```
Ejemplo: Si reconoce "Travis Scott"
Tags: "Trap", "Hip-Hop", "Rage", "Melodic Trap"
```

---

### 5. **INSTRUMENTACIÓN (Por IA)**

Solo si Gemini está activo y puede inferir:
```
Ejemplos: "808s", "Piano", "Synth", "Guitar", "Hi-Hats", "Reverb", "Distorted"
```

**Reglas**:
- Tags específicos de producción
- Relacionados al género/artista conocido
- NO incluir si no hay certeza

---

### 6. **USO/CONTEXTO**

#### Tags Estándar
```
Siempre: "Beat", "Instrumental", "Professional"
```

#### Por IA (Si tiene contexto)
```
Ejemplos: "Freestyle", "Commercial", "Underground", "Club", "Radio", "Studio"
```

---

### 7. **TYPE BEAT / DEMO / TAGGED**

#### Type Beat
```
Si filename tiene "Type Beat":
Tags: "Type Beat", "{Artista} Type", "Reference"
```

#### Demo
```
Si filename tiene "[DEMO]" o "(demo)":
Tags: "Demo", "Preview"
```

#### Tagged
```
Si filename tiene "[TAGGED]" o "(tagged)":
Tags: "Tagged", "Watermarked"
```

---

## 🚫 Tags Excluidos (Filtrados)

Estos tags **NO se incluyen** aunque Gemini los sugiera:
- ❌ "AI Analyzed"
- ❌ "Music"
- ❌ "Audio"
- ❌ "Track"
- ❌ "Sound"
- ❌ Cualquier tag genérico no útil para búsqueda musical

---

## 📊 Ejemplos de Output

### Ejemplo 1: Metadata Completa en Filename

**Input**: `[DEMO] Travis Scott Type Beat - Cm 140.mp3`

**Tags Generados (16)**:
```json
[
  "Cm", "Minor", "140BPM", "Hard", "Trap", "Aggressive",
  "Melancholic", "Dark", "Emotional", "Deep",
  "Travis Scott", "Travis", "Scott", "Type Beat",
  "Demo", "Preview", "Beat", "Instrumental", "Professional"
]
```

**Metadata**:
- KEY: C Minor (confidence: 95, source: filename, verified: true)
- BPM: 140 (confidence: 95, source: filename, verified: true)
- Mood: Dark (automático por Minor)
- Genre: Trap/Dubstep (automático por 140 BPM)

---

### Ejemplo 2: Sin Metadata, Solo Audio Analysis

**Input**: `My Beat.mp3` (audio detecta G Minor, 86 BPM)

**Tags Generados (12)**:
```json
[
  "Gm", "Minor", "86BPM", "Slow", "Hip-Hop", "Chill",
  "Melancholic", "Dark", "My Beat",
  "Beat", "Instrumental", "Professional"
]
```

**Metadata**:
- KEY: G Minor (confidence: 50, source: audio_analysis, verified: false)
- BPM: 86 (confidence: 50, source: audio_analysis, verified: false)
- Warnings: "Escala sugerida, verifica", "BPM calculado, verifica"

---

### Ejemplo 3: Con IA Activa (Artista Conocido)

**Input**: `[TAGGED] Drake Type Beat - 85 BPM.mp3`

**Tags Generados con Gemini (20-25)**:
```json
[
  "Dm", "Minor", "85BPM", "Slow", "Hip-Hop", "Chill",
  "Drake", "Drake Type", "Type Beat", "Reference",
  "Dark", "Melancholic", "Emotional", "Deep",
  "Trap", "R&B", "Melodic", "Toronto Sound",
  "808 Heavy", "Ambient", "Modern", "Commercial",
  "Freestyle", "Studio", "Tagged", "Watermarked",
  "Beat", "Instrumental", "Professional"
]
```

**Metadata Adicional**:
```json
{
  "artist_known": true,
  "artist_info": {
    "genre": "Hip-Hop/R&B",
    "subgenres": ["Trap", "Melodic Rap"],
    "style": "Dark, melodic, 808-heavy, ambient"
  }
}
```

---

## 🔧 Integración en el Sistema

### Función Principal
```python
def generate_auto_tags(parsed_data, audio_analysis, gemini_analysis, bpm, key):
    """
    Genera tags automáticos inteligentes.
    
    Returns:
        list[str]: Lista de tags únicos (10-25 tags)
    """
```

### Llamada en `combine_all_analysis()`
```python
# Generar tags inteligentes combinando todo
result['tags'] = generate_auto_tags(
    parsed_data, 
    audio_analysis, 
    gemini_analysis, 
    result.get('bpm'), 
    result.get('key')
)
```

---

## 🎯 Casos de Uso

### Búsqueda de Beats
Usuario busca: **"dark trap 140bpm"**

Beats matcheados:
- ✅ Tag "Dark" (mood)
- ✅ Tag "Trap" (genre)
- ✅ Tag "140BPM" (bpm exacto)

---

### Filtros por Artista
Usuario filtra: **"Travis Scott Type"**

Beats matcheados:
- ✅ Tag "Travis Scott Type"
- ✅ Tag "Travis Scott"
- ✅ Tag "Type Beat"

---

### Filtros por KEY
Usuario filtra: **"Cm minor melancholic"**

Beats matcheados:
- ✅ Tag "Cm" (key corta)
- ✅ Tag "Minor" (scale type)
- ✅ Tag "Melancholic" (mood)

---

## 📈 Métricas de Calidad

### Sin IA (Fallback Automático)
- ✅ **10-16 tags** generados
- ✅ **100% relevantes** (KEY, BPM, mood automático)
- ✅ **0 tags genéricos**

### Con IA Activa (Artista Conocido)
- ✅ **20-25 tags** generados
- ✅ **Enriquecidos** con info del artista
- ✅ **Instrumentación específica**
- ✅ **Contexto de uso**

---

## 🔄 Actualización del Prompt Gemini

El prompt mejorado incluye:

1. **Pregunta explícita**: "¿Conoces al artista X?"
2. **Cantidad solicitada**: 15-25 tags si conoce, 10 si no
3. **Prohibición de genéricos**: Lista explícita de tags a NO usar
4. **Ejemplos concretos**: JSON de ejemplo con buenos tags
5. **Contexto completo**: BPM, KEY, mood automático como referencia

---

## ✅ Testing

Probado con:
- ✅ `[DEMO] Travis Scott Type Beat - Cm 140.mp3` → 16 tags
- ✅ `Can't_Fight_It_-_Quintino_Cheat_Codes.mp3` → 12 tags
- ✅ Mood correcto (Dark para Minor, Uplifting para Major)
- ✅ Genre correcto por BPM (140 → Trap/Dubstep)
- ✅ Sin tags genéricos

---

**Última actualización**: 2025-12-12  
**Versión**: V2  
**Status**: ✅ FUNCIONAL
