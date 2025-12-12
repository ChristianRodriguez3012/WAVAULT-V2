# 🔧 MEJORAS AL SISTEMA DE EXTRACCIÓN DE METADATA

## 📋 Resumen de Implementaciones

Se ha mejorado completamente el sistema de extracción y validación de metadata de beats, implementando un sistema de confianza de 3 niveles y mejorando la integración con Gemini AI.

---

## ✨ 1. Parser de Nombres de Archivo Mejorado

### Archivo: `parse_filename_improved.py`

#### 🎯 Mejoras Implementadas:

**1.1. Detección de Metadata en Paréntesis/Corchetes/Llaves**
```
Antes: [TAGGED] ignorado completamente
Después: Detecta (demo), (tagged), (key bpm), [130], {Cm}
```

**Casos detectados:**
- `(demo)` → `is_demo: true`
- `(tagged)` / `[TAGGED]` → `is_tagged: true`
- `(130 BPM)` → `bpm_from_brackets: 130, confidence: 100`
- `[Cm]` → `key_from_brackets: "C Minor", confidence: 100`

**1.2. Sinónimos de Escalas Musicales**

| Entrada | Salida Normalizada |
|---------|-------------------|
| `min`, `m`, `minor`, `menor` | `Minor` |
| `maj`, `M`, `major`, `mayor` | `Major` |

**1.3. Detección Inteligente de BPM**

```python
# PRIORIDAD 1: BPM explícito
"beat 140BPM.mp3" → bpm: 140, confidence: 100

# PRIORIDAD 2: Número candidato (50-300)
"beat 150.mp3" → bpm: 150, confidence: 95

# EXCLUYE: Años (1990-2025)
"beat 2024.mp3" → bpm: null (no es BPM, es año)
```

**Algoritmo:**
1. Si tiene "BPM" explícito → extraer directamente (conf: 100)
2. Buscar números de 2-3 dígitos entre 50-300
3. Excluir rango de años (1990-2025)
4. Tomar el más cercano a 130 BPM (centro típico)

**1.4. Detección Mejorada de Notas Musicales**

Soporta múltiples formatos:
```
# Notas válidas:
A, A#, Ab, A♯, A♭
B, C, C#, Db, D, D#, Eb, E, F, F#, Gb, G, G#

# Con escalas:
Cm, C#m, C# Minor, C#minor
Dmaj, D Major, DM

# Notas inválidas automáticamente rechazadas:
E#, B#, Fb, Cb
```

**1.5. Normalización de Notas**
```python
"c♯" → "C#"
"Db" → "Db"  
"A SHARP" → "A#"
"g flat" → "Gb"
```

---

## 🎯 2. Sistema de Confianza (Confidence Scores)

### Niveles de Confianza:

| Nivel | Valor | Fuente | Descripción |
|-------|-------|--------|-------------|
| **VERIDICO** | 100 | Nombre archivo (explícito) | "140 BPM", "(Cm)", "C# Minor" |
| **ALTA** | 95 | Nombre archivo (implícito) | "150" (sin "BPM"), "Dm" detectado |
| **MEDIA** | 70 | Análisis IA (Gemini) | IA valida escala sugerida por script |
| **BAJA** | 50 | Script análisis audio | Librosa/FFT sugiere escala/BPM |
| **NO DETECTADO** | 0 | - | No se encontró información |

### Aplicación del Sistema:

#### **ESCALA/KEY:**
```
Prioridad 1: Nombre archivo (conf: 100) → SE TOMA COMO FINAL
Prioridad 2: IA valida sugerencia (conf: 70) → SE TOMA SI NO HAY P1
Prioridad 3: Script análisis notas (conf: 50) → SUGERENCIA SOLAMENTE
```

**Flujo:**
1. Parser busca KEY en nombre → Si encuentra → `key_confidence: 100` → **FINAL**
2. Si no → Script analiza notas → Sugiere KEY → `key_confidence: 50`
3. Gemini recibe: nombre + notas detectadas + KEY sugerida
4. Gemini valida o corrige → `key_confidence: 70`

#### **BPM:**
```
Prioridad 1: Nombre archivo (conf: 100/95) → SE TOMA COMO FINAL
Prioridad 2: Script cálculo BPM (conf: 50) → SE USA SI NO HAY P1
```

**Flujo:**
1. Parser busca BPM en nombre → Si encuentra → `bpm_confidence: 100` → **FINAL**
2. Si no → Script calcula BPM → `bpm_confidence: 50`
3. **MOSTRAR ALERTA:** "⚠️ BPM sugerido: 128. Por favor verifica."

---

## 🤖 3. Integración Mejorada con Gemini AI

### Archivo: `analyze_beat_ai.py` (modificado)

#### 3.1. Mensaje Mejorado a Gemini

**ANTES (genérico):**
```
"Analiza este beat y dame metadata"
```

**DESPUÉS (específico y estructurado):**
```
SOY LA INTEGRACIÓN DE WAVAULT.

BEAT ANALIZADO:
- Nombre archivo: "Drake Type Beat - Sicario - Dm 140.mp3"
- Notas detectadas: [D, F, A, C, E, G]
- Progresión de acordes: [Dm, Am, F, C]
- Escala sugerida por script: D Minor (confidence: 50%)
- BPM sugerido por script: 140 (confidence: 95% - del nombre)

ARTISTA DE REFERENCIA: Drake
CONOCIMIENTO DEL ARTISTA: Si conoces al artista, sugiere:
- Género típico
- Subgéneros asociados
- Mood característico

TAREAS ESPECÍFICAS:
1. VALIDAR ESCALA: Las notas detectadas [D, F, A, C] confirman D Minor?
   - Si es correcto → Retornar "D Minor" con confidence: 70
   - Si es incorrecto → Retornar la escala correcta con confidence: 70

2. DETERMINAR MOOD basado en:
   - Progresión de acordes detectada
   - BPM (140 = energético)
   - Nombre del beat
   - Artista de referencia

3. GENERAR TAGS INTELIGENTES:
   - Máximo 1-3 palabras por tag
   - Basados en: notas, artista, BPM, mood, género
   - Específicos y relevantes
   - Ejemplos: "Dark", "Melodic Trap", "Drake Style", "140BPM"

4. DETERMINAR TIPO DE BEAT:
   - Trap, Drill, Reggaeton, Afrobeat, etc.
   - Basado en BPM + progresión + nombre

RETORNA SOLO JSON (sin explicación):
{
  "key": "D Minor",
  "key_confidence": 70,
  "key_validated": true,
  "mood": "Dark Melodic",
  "type": "Trap",
  "genre": "Trap",
  "subgenres": ["Hip-Hop", "Dark Trap"],
  "tags": ["Dark", "Melodic", "Drake Style", "140BPM", "D Minor"],
  "description": "Descripción generada automáticamente"
}
```

#### 3.2. Campos Esperados en Respuesta JSON

```typescript
interface GeminiResponse {
  // ESCALA VALIDADA
  key: string;                    // "D Minor", "C# Major"
  key_confidence: number;         // 70 (IA validó)
  key_validated: boolean;         // true si confirma, false si corrigió
  
  // MOOD Y TIPO
  mood: string;                   // "Dark Melodic", "Uplifting", "Aggressive"
  type: string;                   // "Trap", "Drill", "Reggaeton"
  
  // GÉNERO
  genre: string;                  // Género principal
  subgenres: string[];            // ["Hip-Hop", "Dark Trap"]
  
  // TAGS INTELIGENTES (1-3 palabras máximo)
  tags: string[];                 // ["Dark", "Melodic", "Drake Style"]
  
  // DESCRIPCIÓN
  description: string;            // Descripción autocompletada
  
  // BPM (solo si IA detectó algo diferente)
  bpm_suggested?: number;         // Solo si difiere del detectado
}
```

#### 3.3. Autocompletado del Formulario

**Campos que se llenan automáticamente:**

| Campo Formulario | Fuente Primaria | Fuente Secundaria | Fuente Terciaria |
|------------------|----------------|-------------------|------------------|
| **Nombre del Beat** | Parser nombre | - | - |
| **Tipo de Beat** | Parser "TYPE BEAT" | Gemini `type` | - |
| **Referencia/Artista** | Parser nombre | - | - |
| **KEY** | Parser (conf:100) | Gemini validado (conf:70) | Script (conf:50) |
| **BPM** | Parser (conf:100/95) | Script cálculo (conf:50) | - |
| **Mood** | Gemini `mood` | - | - |
| **Tags** | Gemini `tags[]` | - | - |
| **Descripción** | Gemini `description` | - | - |
| **Precio** | Usuario (manual) | - | - |

---

## 📝 4. Tags Inteligentes

### 4.1. Características de Tags

**REGLAS:**
- ✅ Máximo 1-3 palabras por tag
- ✅ Preferiblemente 1 palabra
- ✅ Específicos y relevantes
- ✅ Basados en análisis técnico

**MAL (genérico):**
```
["beat", "instrumental", "music", "track"]
```

**BIEN (específico):**
```
["Dark", "Melodic Trap", "Drake Style", "140BPM", "D Minor"]
```

### 4.2. Fuentes para Tags Inteligentes

```python
tags_sources = {
    "Progresión de notas": ["D Minor", "Melodic"],
    "Artista referencia": ["Drake Style", "Commercial"],
    "BPM": ["140BPM", "Uptemp", "Energetic"],
    "Mood detectado": ["Dark", "Aggressive", "Chill"],
    "Género": ["Trap", "Hip-Hop"],
    "Análisis espectral": ["Heavy Bass", "808s"]
}
```

### 4.3. Ejemplos de Tags por Género

| Género | Tags Característicos |
|--------|---------------------|
| **Trap** | Dark, Heavy Bass, 808s, Hi-Hats, Aggressive |
| **Drill** | UK Drill, Sliding 808s, Dark, 140BPM |
| **Reggaeton** | Dembow, Latin, 95BPM, Perreo |
| **Afrobeat** | Afro, Percussion, 120BPM, Nigerian |
| **Lo-fi** | Chill, Jazzy, Vinyl, Laid Back |

---

## 🔄 5. Flujo Completo de Procesamiento

### Diagrama de Flujo:

```
┌─────────────────────────────────────────┐
│ USUARIO SUBE BEAT                       │
│ "Drake Type Beat - Sicario - Dm 140.mp3"│
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 1. PARSE NOMBRE (parse_filename_improved)│
│    ✅ Beat name: "Sicario"              │
│    ✅ Reference: "Drake Type Beat"      │
│    ✅ Key: "D Minor" (conf: 100) ←FINAL │
│    ✅ BPM: 140 (conf: 95) ←FINAL        │
│    ✅ is_tagged: false                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 2. ANÁLISIS AUDIO (analyze_beat_ai.py)  │
│    🔊 Librosa analiza archivo           │
│    🎵 Notas detectadas: [D, F, A, C]    │
│    🎼 Acordes: [Dm, Am, F, C]           │
│    🎹 Escala sugerida: D Minor (conf:50)│
│    ⏱️  BPM calculado: 139 (conf:50)     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 3. COMPARATIVA Y DECISIÓN               │
│    KEY:                                 │
│    - Parser: D Minor (conf:100) ✅ GANA │
│    - Script: D Minor (conf:50)          │
│    → RESULTADO: D Minor (VERIDICO)      │
│                                         │
│    BPM:                                 │
│    - Parser: 140 (conf:95) ✅ GANA      │
│    - Script: 139 (conf:50)              │
│    → RESULTADO: 140 (VERIDICO)          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 4. CONSULTA A GEMINI AI                 │
│    📤 Envía:                            │
│    - Nombre: "Drake Type Beat..."       │
│    - Notas: [D, F, A, C]                │
│    - KEY sugerida: D Minor (conf:50)    │
│    - Artista: Drake                     │
│                                         │
│    📥 Gemini retorna:                   │
│    {                                    │
│      "key": "D Minor",                  │
│      "key_validated": true,             │
│      "key_confidence": 70,              │
│      "mood": "Dark Melodic",            │
│      "type": "Trap",                    │
│      "genre": "Trap",                   │
│      "tags": ["Dark", "Melodic",        │
│              "Drake Style", "140BPM"]   │
│    }                                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 5. AUTOCOMPLETAR FORMULARIO             │
│    ✏️ Beat Name: "Sicario"              │
│    ✏️ Type: "Trap"                      │
│    ✏️ Reference: "Drake Type Beat"      │
│    ✏️ KEY: "D Minor" ✅ (conf:100)      │
│    ✏️ BPM: 140 ✅ (conf:95)             │
│    ✏️ Mood: "Dark Melodic"              │
│    ✏️ Tags: "Dark, Melodic, Drake Style"│
│    ⚠️  Precio: (usuario debe llenar)    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 6. USUARIO REVISA Y CONFIRMA            │
│    👤 Puede editar cualquier campo      │
│    💰 Completa precio                   │
│    📤 Submit                            │
└─────────────────────────────────────────┘
```

---

## ⚠️ 6. Sistema de Alertas

### 6.1. Alerta de BPM Sugerido

**Cuándo mostrar:**
- `bpm_confidence < 95` (no viene del nombre explícitamente)

**Mensaje:**
```
⚠️ BPM sugerido: 128
Este valor fue calculado automáticamente.
Por favor verifica que sea correcto.
```

**Implementación:**
```javascript
if (analysisData.bpm_confidence < 95) {
  showNotification(
    `⚠️ BPM sugerido: ${analysisData.bpm}. Por favor verifica que sea correcto.`,
    'warning'
  );
  document.getElementById('bpmField').style.borderColor = '#f59e0b';
  document.getElementById('bpmField').focus();
}
```

### 6.2. Alerta de KEY Validada por IA

**Cuándo mostrar:**
- `key_confidence === 70` (IA validó)
- `key_validated === false` (IA corrigió)

**Mensaje si IA corrigió:**
```
ℹ️ Escala corregida por IA
Script sugirió: C Major
IA detectó: C Minor
Se usó: C Minor
```

---

## 📊 7. Ejemplos de Casos de Uso

### Caso 1: Metadata Completa en Nombre
```
Archivo: "Drake Type Beat - Sicario - Dm 140BPM.mp3"

PARSER:
✅ beat_name: "Sicario"
✅ reference_artist: "Drake Type Beat"
✅ beat_type: "Type Beat"
✅ key: "D Minor" (confidence: 100) ← VERIDICO
✅ bpm: 140 (confidence: 100) ← VERIDICO

RESULTADO: No necesita validación, todo VERIDICO del nombre
```

### Caso 2: Solo BPM en Nombre, KEY del Análisis
```
Archivo: "Trap Beat 150.mp3"

PARSER:
✅ beat_name: "Trap Beat"
✅ bpm: 150 (confidence: 95) ← Del nombre
❌ key: null

SCRIPT ANÁLISIS:
🎵 Notas: [C, E, G, A]
🎼 Escala sugerida: A Minor (confidence: 50)

GEMINI VALIDA:
✅ key: "A Minor" (confidence: 70) ← IA validó

RESULTADO FINAL:
- BPM: 150 (del nombre, VERIDICO)
- KEY: A Minor (IA validó, confidence 70)
```

### Caso 3: Metadata en Paréntesis
```
Archivo: "[TAGGED] Reggaeton Beat (95 BPM) [Am].mp3"

PARSER:
✅ beat_name: "Reggaeton Beat"
✅ is_tagged: true
✅ bpm: 95 (confidence: 100) ← De paréntesis
✅ key: "A Minor" (confidence: 100) ← De corchetes

RESULTADO: Todo VERIDICO de paréntesis/corchetes
```

### Caso 4: Sin Metadata en Nombre
```
Archivo: "beat_final_v3.mp3"

PARSER:
✅ beat_name: "beat final v3"
❌ bpm: null
❌ key: null

SCRIPT ANÁLISIS:
🎵 BPM calculado: 128 (confidence: 50)
🎵 Notas: [F, A, C, E]
🎼 Escala sugerida: F Major (confidence: 50)

GEMINI VALIDA:
✅ key: "F Major" (confidence: 70)
✅ mood: "Uplifting"
✅ tags: ["Bright", "Major", "128BPM"]

RESULTADO FINAL:
- BPM: 128 (calculado, ⚠️ MOSTRAR ALERTA)
- KEY: F Major (IA validó)
- ALERTA: "⚠️ BPM sugerido: 128. Verifica."
```

---

## 🎓 Conclusión

El sistema mejorado proporciona:

✅ **Extracción inteligente** de metadata del nombre del archivo  
✅ **Sistema de confianza** de 3 niveles (100/70/50)  
✅ **Validación por IA** de escalas y mood  
✅ **Tags específicos** basados en análisis técnico  
✅ **Autocompletado** del formulario con datos confiables  
✅ **Alertas** para datos sugeridos (no verificados)

**Resultado:** Proceso de subida más rápido, preciso y profesional, con metadata confiable desde el nombre del archivo.
