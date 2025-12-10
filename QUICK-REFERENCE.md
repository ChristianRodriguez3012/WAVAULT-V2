# 🚀 GUÍA RÁPIDA - WAVAULT V2 Beat Upload System

## Archivos Modificados

| Archivo | Cambio | Estado |
|---------|--------|--------|
| `parse_filename_ai.py` | Nueva estructura + validación BPM | ✅ ACTUALIZADO |
| `upload-beat-final.html` | Modal obligatorio + análisis inmediato | ✅ CREADO |
| `server.js` | Endpoints actualizados para nuevos campos | ✅ ACTUALIZADO |
| `ai-analysis-integration.js` | (No requiere cambios) | ✅ OK |
| `analyze_beat_ai.py` | (Ya genera tags con Gemini) | ✅ OK |

---

## 📋 Estructura Exacta del Filename

```
NOMBRE DEL BEAT - TYPE DEL BEAT - REFERENCIA/ARTISTA - KEY - BPM
```

### Ejemplos Válidos ✅
- `Tropical Vibes - Drake Type Beat - Drake - Fm - 90.mp3`
- `Sicko Mode - Travis Scott Type Beat - Travis Scott - Gm - 140.mp3`
- `Bad Bunny Vibe - Reggaeton Type Beat - Bad Bunny - Am - 95.mp3`

### Ejemplos Inválidos ❌
- `Drake Beat 140 BPM.mp3` (sin estructura)
- `Beat - Type - Ref - Am - 250.mp3` (BPM fuera de rango)
- `Beat - Type - Ref - Am.mp3` (sin BPM)

---

## 🔢 Validación de BPM

```
VÁLIDO:    50-220 BPM (rango musical realista)
NO VÁLIDO: <50 o >220 (rechazado automáticamente)
```

### Géneros vs BPM
| Género | Rango |
|--------|-------|
| Ballad/Slow | 50-90 |
| Hip-Hop | 85-115 |
| Pop | 100-130 |
| Trap/Dubstep | 140-180 |
| Drum & Bass | 160-220 |

---

## 🎯 Flujo de Análisis Obligatorio

```
1. Usuario selecciona archivo MP3
   ↓ ANÁLISIS INMEDIATO
2. Modal abre: "Analizando beat..."
   ├─ Parse Filename → beat_name, beat_type, reference, key, bpm
   ├─ Audio Analysis → Detecta características técnicas
   └─ Gemini Web Search → 18-30 tags + mood
   ↓
3. Modal muestra resultados con CONFIANZA:
   └─ 🟢 >80% | 🟡 60-80% | 🔴 <60%
   ↓
4. Usuario puede:
   └─ ✅ Aceptar → Guardar en BD
   └─ ❌ Rechazar → Re-analizar
```

---

## 📊 Confianza por Fuente

### Extracción de Nombre (Filename)
- `beat_name_confidence`: 85-95%
- `beat_type_confidence`: 80-90%
- `reference_confidence`: 70-85%
- `key_confidence`: 80-90%
- `bpm_confidence`: 85% (si 50-220)

### Análisis de Audio
- BPM detectado: 50-90%
- Key detectado: 60-80%
- Mood: 70-80%

### Tags (IA + Gemini)
- Confianza general: 80%+
- Mínimo 18 tags
- Máximo 30 tags

---

## 🔧 Campos en BD (Nueva Estructura)

```sql
INSERT INTO beats (
  beat_name,              -- "Tropical Vibes"
  beat_type,              -- "Drake Type Beat"
  reference,              -- "Drake"
  key,                    -- "Fm"
  bpm,                    -- 90
  mood,                   -- "Dark & Atmospheric"
  tags,                   -- "Drake,Hip-Hop,90 BPM,Fm,..."
  audio,                  -- "uploads/audio/filename.mp3"
  price,                  -- 15
  description,            -- "Optional description"
  producer                -- "username"
)
```

---

## 🚀 Comandos de Prueba Rápida

### Test 1: Parse Filename
```bash
python3 /workspaces/WAVAULT-V2/WAVAULT/backend/parse_filename_ai.py \
  "Tropical Vibes - Drake Type Beat - Drake - Fm - 90.mp3"
```

### Test 2: Iniciar Servidor
```bash
cd /workspaces/WAVAULT-V2/WAVAULT/backend
node server.js
```

### Test 3: Endpoint Parse
```bash
curl -X POST http://localhost:3000/api/parse-filename \
  -H 'Content-Type: application/json' \
  -d '{"filename": "Tropical Vibes - Drake Type Beat - Drake - Fm - 90.mp3"}'
```

### Test 4: Interfaz Web
```
http://localhost:3000/upload-beat
```

---

## 📱 Interfaz Web

### Elementos Principales

1. **Área de Carga**
   - Drag-drop o click
   - Muestra nombre del archivo

2. **Modal de Análisis**
   - Spinner durante análisis
   - Secciones con confianza visual
   - Tags editables
   - Botones: Aceptar / Rechazar

3. **Campos Editables**
   - Key: Puede cambiar
   - BPM: Puede ajustar
   - Tags: Puede remover

---

## ✅ Requisitos Cumplidos

| Requisito | Estado |
|-----------|--------|
| Estructura NOMBRE - TYPE - REFERENCIA - KEY - BPM | ✅ |
| Validación BPM 50-220 | ✅ |
| Limpieza de parentheses/brackets | ✅ |
| Análisis obligatorio e inmediato | ✅ |
| Modal con progreso | ✅ |
| Confianza por fuente | ✅ |
| Botón deshabilitado hasta aceptar | ✅ |
| Tags 18-30 por Gemini | ✅ |
| Campos editables | ✅ |
| Guardar en BD con nuevos campos | ✅ |

---

## 🔐 Configuración Requerida

```bash
# API Key de Gemini
export GEMINI_API_KEY="tu_clave_aqui"

# Python 3.8+
python3 --version

# Node.js 14+
node --version

# Paquetes Python
pip install librosa scipy numpy google-generativeai
```

---

## 📚 Documentación Completa

- **REFACTOR-SUMMARY.md** - Resumen detallado de cambios
- **BEFORE-AFTER-COMPARISON.md** - Comparativa antes/después
- **TESTING-GUIDE.sh** - Guía completa de testing (25 tests)

---

## 🎯 Próximos Pasos

1. ✅ Código refactorizado
2. ⏳ **Ejecutar tests unitarios**
3. ⏳ Probar interfaz web
4. ⏳ Validar en BD
5. ⏳ Deploy en producción

---

## 📞 Soporte Rápido

| Problema | Solución |
|----------|----------|
| BPM no se valida | Verificar rango 50-220 |
| Modal no abre | F12 → Ver errores JS |
| Tags no generan | Verificar GEMINI_API_KEY |
| BD vacía | Revisar respuestas POST |
| Parentheses no se limpian | Verificar regex en parser |

---

**Sistema listo para testing y validación ✅**
