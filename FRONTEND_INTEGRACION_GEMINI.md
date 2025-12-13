# 🎨 Frontend: Nuevos Campos de Estado Gemini

## ⚡ TL;DR

El backend ahora indica **explícitamente** en `ai_inference`:

```json
{
  "tags_source": "IA + Parser",  // o "Solo Parser"
  "gemini_access": true,         // true = usó Gemini, false = no
  "gemini_status": "ok"          // "ok" / "quota" / "error" / "not_used"
}
```

---

## 📋 Checklist de Integración Frontend

### ✅ Paso 1: Leer los nuevos campos

```javascript
fetch('/api/upload-beat', {...})
  .then(res => res.json())
  .then(data => {
    const ai = data.ai_inference;
    
    console.log('Tags source:', ai.tags_source);    // "IA + Parser" o "Solo Parser"
    console.log('Gemini OK?', ai.gemini_access);    // true/false
    console.log('Status:', ai.gemini_status);       // "ok", "quota", "error", "not_used"
  });
```

---

### ✅ Paso 2: Mostrar badge de estado

```javascript
function renderGeminiBadge(ai_inference) {
  if (ai_inference.gemini_access && ai_inference.gemini_status === 'ok') {
    return '<span class="badge bg-success">✅ IA Activa</span>';
  } else if (ai_inference.gemini_status === 'quota') {
    return '<span class="badge bg-warning text-dark">⚠️ Cuota Agotada</span>';
  } else {
    return '<span class="badge bg-danger">❌ IA No Disponible</span>';
  }
}

// En el HTML:
document.getElementById('gemini-status').innerHTML = renderGeminiBadge(data.ai_inference);
```

**Ejemplo visual:**

| Estado | Badge |
|--------|-------|
| Gemini OK | <span style="background: #28a745; color: white; padding: 2px 8px; border-radius: 4px;">✅ IA Activa</span> |
| Cuota agotada | <span style="background: #ffc107; color: black; padding: 2px 8px; border-radius: 4px;">⚠️ Cuota Agotada</span> |
| Error/sin IA | <span style="background: #dc3545; color: white; padding: 2px 8px; border-radius: 4px;">❌ IA No Disponible</span> |

---

### ✅ Paso 3: Actualizar tabla de confianza

El backend ya ajusta la tabla dinámicamente. Ejemplo:

**Con Gemini:**
```json
{
  "parameter": "Etiquetas (IA + Parser)",
  "value": "Trap, Dark, 808, Hi-Hats, ...",
  "confidence": 90,
  "source": "gemini",
  "rationale": "Gemini genera 18 tags considerando: artista + canción + análisis + búsqueda web"
}
```

**Sin Gemini:**
```json
{
  "parameter": "Etiquetas (Solo Parser)",
  "value": "Trap, 140 BPM, Minor Key, ...",
  "confidence": 60,
  "source": "parser",
  "rationale": "Parser fusiona tags obligatorios del filename y heurística local sin Gemini"
}
```

**Solo renderiza la tabla como siempre:**

```javascript
data.confidence_report.items.forEach(item => {
  tableHTML += `
    <tr>
      <td>${item.parameter}</td>
      <td>${item.value}</td>
      <td>${item.confidence}%</td>
      <td><span class="badge bg-secondary">${item.source}</span></td>
    </tr>
  `;
});
```

---

### ✅ Paso 4 (Opcional): Tooltip informativo

```javascript
function getGeminiTooltip(ai_inference) {
  if (ai_inference.gemini_access) {
    return 'Análisis potenciado con IA y búsqueda web en tiempo real';
  } else if (ai_inference.gemini_status === 'quota') {
    return 'Cuota API agotada. Usando análisis local (tags del filename y heurística técnica)';
  } else {
    return 'IA no disponible. Usando análisis local básico';
  }
}

// Bootstrap tooltip:
<span class="badge bg-success" data-bs-toggle="tooltip" title="${getGeminiTooltip(ai)}">
  ✅ IA Activa
</span>
```

---

## 🎨 Mockup Visual

```
┌─────────────────────────────────────────────────────┐
│ 🎵 Travis Scott - SICKO MODE Type Beat 140 BPM     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [✅ IA Activa]  ← Badge dinámico                   │
│                                                     │
│  📊 Tabla de Confianza:                             │
│  ┌─────────────────┬───────────┬──────┬─────────┐  │
│  │ Parámetro       │ Valor     │ Conf │ Fuente  │  │
│  ├─────────────────┼───────────┼──────┼─────────┤  │
│  │ BPM             │ 140       │ 100% │ filename│  │
│  │ Key             │ C Minor   │ 100% │ filename│  │
│  │ Mood            │ Energético│  88% │ gemini  │  │
│  │ Etiquetas       │ Trap,     │  90% │ gemini  │  │
│  │ (IA + Parser)   │ Dark,...  │      │         │  │
│  └─────────────────┴───────────┴──────┴─────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Cuando **no hay Gemini**:

```
┌─────────────────────────────────────────────────────┐
│ 🎵 Travis Scott - SICKO MODE Type Beat 140 BPM     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [⚠️ Cuota Agotada]  ← Badge rojo/amarillo         │
│                                                     │
│  📊 Tabla de Confianza:                             │
│  ┌─────────────────┬───────────┬──────┬─────────┐  │
│  │ Parámetro       │ Valor     │ Conf │ Fuente  │  │
│  ├─────────────────┼───────────┼──────┼─────────┤  │
│  │ BPM             │ 140       │ 100% │ filename│  │
│  │ Key             │ C Minor   │ 100% │ filename│  │
│  │ Mood            │ Energético│  65% │ local   │  │
│  │ Etiquetas       │ Trap,     │  60% │ parser  │  │
│  │ (Solo Parser)   │ 140 BPM,..│      │         │  │
│  └─────────────────┴───────────┴──────┴─────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Frontend

### Caso 1: Gemini OK
```bash
# Backend responde con gemini_access: true
curl -X POST http://localhost:3000/api/upload-beat \
  -F "file=@test.mp3" \
  | jq '.ai_inference'

# Output esperado:
{
  "tags_source": "IA + Parser",
  "gemini_access": true,
  "gemini_status": "ok"
}
```

### Caso 2: Sin Gemini (cuota agotada)
```bash
# Backend responde con gemini_access: false
{
  "tags_source": "Solo Parser",
  "gemini_access": false,
  "gemini_status": "quota"
}
```

---

## 🎯 Resumen

| Campo | Tipo | Valores | Uso en Frontend |
|-------|------|---------|-----------------|
| `tags_source` | string | "IA + Parser", "Solo Parser" | Label en tabla |
| `gemini_access` | boolean | true, false | Condicional para badge |
| `gemini_status` | string | "ok", "quota", "error", "not_used" | Color del badge |

**Acción inmediata:**
1. Leer `ai_inference.gemini_access` y `gemini_status`
2. Renderizar badge verde/rojo
3. La tabla se ajusta automáticamente (backend ya la modifica)

---

**Doc completa**: [INDICADORES_UX_GEMINI.md](INDICADORES_UX_GEMINI.md)  
**Ejemplos JSON**: [EJEMPLO_RESPUESTA_JSON_CON_GEMINI.json](EJEMPLO_RESPUESTA_JSON_CON_GEMINI.json), [EJEMPLO_RESPUESTA_JSON_SIN_GEMINI.json](EJEMPLO_RESPUESTA_JSON_SIN_GEMINI.json)
