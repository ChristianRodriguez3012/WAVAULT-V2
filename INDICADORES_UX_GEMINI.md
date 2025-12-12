# 🎯 Indicadores de Fuente de Etiquetas y Acceso Gemini

## 📊 Resumen
El backend ahora incluye **indicadores claros** en el JSON de análisis para informar al frontend sobre:
1. **Fuente de las etiquetas**: ¿Fueron generadas por IA (Gemini) + Parser, o solo por el Parser local?
2. **Estado de Gemini**: ¿Se accedió exitosamente? ¿Falló por cuota? ¿Hubo error?

---

## 🔧 Campos Agregados al `ai_inference`

### 1️⃣ `tags_source` (string)
Indica el origen de las etiquetas generadas:
- **`"IA + Parser"`**: Gemini accedió correctamente; los tags combinan la inferencia de Gemini con tags obligatorios del filename.
- **`"Solo Parser"`**: Gemini no estuvo disponible (cuota agotada, error, sin API keys válidas); los tags provienen únicamente del Parser local y tags obligatorios.

### 2️⃣ `gemini_access` (boolean)
Indica si se logró acceder a Gemini durante el análisis:
- **`true`**: Gemini respondió exitosamente.
- **`false`**: No se pudo usar Gemini (cuota, error de conexión, API keys inválidas, etc.).

### 3️⃣ `gemini_status` (string)
Detalla el estado del acceso a Gemini:
- **`"ok"`**: Llamada exitosa.
- **`"quota"`**: Cuota agotada (HTTP 429).
- **`"error"`**: Error general (timeout, parsing, etc.).
- **`"not_used"`**: No se intentó usar Gemini.

---

## 🎨 Ejemplo de Respuesta JSON

```json
{
  "status": "success",
  "ai_inference": {
    "mood": "Energético / Trap",
    "tags": ["Trap", "Dark", "808", "Hi-Hats", "Snare Roll", ...],
    "tags_source": "IA + Parser",
    "gemini_access": true,
    "gemini_status": "ok",
    "chord_progression": ["Fm", "Db", "Ab", "Eb"],
    "scale_explanation": "Escala menor armónica en F con progresión iv-bVI-bIII-bVII"
  },
  "confidence_report": {
    "items": [
      {
        "parameter": "Etiquetas (IA + Parser)",
        "value": "Trap, Dark, 808, Hi-Hats, Snare Roll, BPM 140, Minor Key, Latin",
        "confidence": 88,
        "source": "gemini",
        "rationale": "Gemini genera 18 tags considerando: artista + canción + análisis + búsqueda web"
      },
      ...
    ],
    "summary": "Pipeline: parseo del filename → análisis técnico (BPM/Key) → Gemini para mood y tags.",
    "method": "Fuentes: filename (si existe) + audio + Gemini 2.0 Flash."
  }
}
```

### Caso sin acceso a Gemini:
```json
{
  "status": "success",
  "ai_inference": {
    "mood": "Energético / Menor",
    "tags": ["Trap", "140 BPM", "Minor Key", ...],
    "tags_source": "Solo Parser",
    "gemini_access": false,
    "gemini_status": "quota",
    "chord_progression": [],
    "scale_explanation": ""
  },
  "confidence_report": {
    "items": [
      {
        "parameter": "Etiquetas (Solo Parser)",
        "value": "Trap, 140 BPM, Minor Key",
        "confidence": 65,
        "source": "parser",
        "rationale": "Parser fusiona tags obligatorios del filename y heurística local sin Gemini"
      },
      ...
    ]
  }
}
```

---

## 🎨 UX Recomendada para el Frontend

### Tabla de Confianza (`confidence_report`)
- **Parameter**: Ahora muestra `"Etiquetas (IA + Parser)"` o `"Etiquetas (Solo Parser)"` dinámicamente.
- **Source**: `"gemini"` si hubo acceso, `"parser"` si no.
- **Rationale**: Descripción ajustada según fuente.

### Indicador Visual de Gemini
Se puede agregar un **badge o botón** al inicio del análisis:

| Estado              | Indicador                  | Color  |
|---------------------|----------------------------|--------|
| `gemini_access: true, status: "ok"` | ✅ **IA Activa**        | Verde  |
| `gemini_access: false, status: "quota"` | ⚠️ **Cuota Agotada**  | Amarillo/Rojo |
| `gemini_access: false, status: "error"` | ❌ **IA No Disponible** | Rojo   |

#### Código Ejemplo (Frontend)
```javascript
const geminiIndicator = (ai_inference) => {
  if (ai_inference.gemini_access && ai_inference.gemini_status === 'ok') {
    return '<span class="badge bg-success">✅ IA Activa</span>';
  } else if (ai_inference.gemini_status === 'quota') {
    return '<span class="badge bg-warning">⚠️ Cuota Agotada</span>';
  } else {
    return '<span class="badge bg-danger">❌ IA No Disponible</span>';
  }
};

// En la tabla de beats
document.getElementById('gemini-status').innerHTML = geminiIndicator(data.ai_inference);
```

---

## 🧪 Ejemplo de Uso en la Interfaz

### Al subir un beat:
1. **Inicio del análisis**: Mostrar "Analizando..." con indicador de Gemini en gris.
2. **Respuesta recibida**: Actualizar el indicador según `gemini_access` y `gemini_status`.
3. **Tabla de resultados**:
   - Fila "Etiquetas (IA + Parser)" si `gemini_access: true`.
   - Fila "Etiquetas (Solo Parser)" si `gemini_access: false`.
4. **Tooltip opcional**: Al pasar el mouse sobre el badge de Gemini, mostrar:
   - ✅ "Análisis potenciado con IA y búsqueda web"
   - ⚠️ "Cuota API agotada, usando análisis local"
   - ❌ "Error al acceder IA, usando análisis local"

---

## 📂 Archivos Modificados

| Archivo | Cambios Realizados |
|---------|-------------------|
| `WAVAULT/backend/analyze_beat_ai.py` | - Agregado `tags_source`, `gemini_access`, `gemini_status` en `infer_with_gemini()` <br> - Actualizado fallback final para incluir estos campos <br> - Modificado `build_baseline_confidence()` para etiquetar dinámicamente según fuente <br> - Propagado al JSON final en `ai_inference` |

---

## ✅ Validación

```bash
# Sintaxis
cd /workspaces/WAVAULT-V2/WAVAULT/backend
python3 -m py_compile analyze_beat_ai.py
# ✅ Sintaxis correcta

# Prueba con un beat
python3 analyze_beat_ai.py test.mp3 "Travis Scott - SICKO MODE Type Beat 140 BPM C Minor.mp3"
```

### Salida esperada en `ai_inference`:
```json
{
  "tags_source": "IA + Parser",
  "gemini_access": true,
  "gemini_status": "ok"
}
```

O en caso de cuota agotada:
```json
{
  "tags_source": "Solo Parser",
  "gemini_access": false,
  "gemini_status": "quota"
}
```

---

## 🎯 Próximos Pasos (Frontend)

1. **Leer los nuevos campos** desde `data.ai_inference`.
2. **Mostrar badge** al inicio de la tabla o en el encabezado del beat.
3. **Actualizar tabla de confianza** para reflejar la fuente dinámica.
4. Opcional: Agregar endpoint `/api/health/gemini` para revisar el estado de las keys antes de subir un beat (pre-flight UI check).

---

**Creado**: 2025-01-XX  
**Estado**: ✅ Implementado en backend  
**Pendiente**: Integración en frontend (UI)
