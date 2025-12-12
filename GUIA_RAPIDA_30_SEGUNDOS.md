# ⚡ GUÍA RÁPIDA: Sistema Multi-API Key + UX (30 segundos)

## 🎯 Lo que hace

1. **Multi-key con fallback**: Si una API key falla (cuota, error), el sistema **automáticamente** prueba con la siguiente.
2. **Health check pre-flight**: Antes de enviar el prompt completo, hace un ping rápido para verificar que la key funcione (ahorra tokens).
3. **Indicadores UX**: El JSON ahora dice **explícitamente** si se usó IA o no, para que el frontend muestre un badge verde/rojo.

---

## 📦 Nuevo JSON de Respuesta

```json
{
  "ai_inference": {
    "tags": [...],
    "tags_source": "IA + Parser",     // 🆕 "IA + Parser" o "Solo Parser"
    "gemini_access": true,            // 🆕 true = usó Gemini, false = no
    "gemini_status": "ok"             // 🆕 "ok", "quota", "error", "not_used"
  },
  "confidence_report": {
    "items": [
      {
        "parameter": "Etiquetas (IA + Parser)",  // 🆕 Dinámico
        "source": "gemini",                      // 🆕 "gemini" o "parser"
        ...
      }
    ]
  }
}
```

---

## 🎨 Frontend: Badge Verde/Rojo

```javascript
// Leer:
const { gemini_access, gemini_status } = data.ai_inference;

// Renderizar:
const badge = gemini_access && gemini_status === 'ok'
  ? '<span class="badge bg-success">✅ IA Activa</span>'
  : '<span class="badge bg-danger">❌ IA No Disponible</span>';

document.getElementById('gemini-status').innerHTML = badge;
```

---

## 🔧 Configuración Backend (.env)

```bash
# Opción 1: Keys numeradas
GEMINI_API_KEY=AIza...
GEMINI_API_KEY_2=AIza...
GEMINI_API_KEY_3=AIza...

# Opción 2: CSV
GEMINI_API_KEYS=AIza...,AIza...,AIza...
```

El script detecta automáticamente todas las keys.

---

## ✅ Validación

```bash
# 1. Sintaxis OK?
python3 -m py_compile WAVAULT/backend/analyze_beat_ai.py
# ✅ Sintaxis correcta

# 2. Keys OK?
cd WAVAULT/backend && python3 health_check_keys.py
# Output: OK: 2 | QUOTA: 0 | INVALID: 0

# 3. Fallback funciona?
./test_api_key_fallback.sh
# ✅ Test 1, 2, 3, 4: COMPLETADO
```

---

## 📚 Docs Completas

| Doc | Para qué |
|-----|----------|
| [INDEX_MULTI_API_KEY.md](INDEX_MULTI_API_KEY.md) | Índice completo |
| [RESUMEN_MULTI_API_KEY.md](RESUMEN_MULTI_API_KEY.md) | Resumen ejecutivo multi-key |
| [RESUMEN_INDICADORES_UX.md](RESUMEN_INDICADORES_UX.md) | Resumen indicadores UX |
| [FRONTEND_INTEGRACION_GEMINI.md](FRONTEND_INTEGRACION_GEMINI.md) | Guía paso a paso frontend |
| [RESUMEN_VISUAL_SISTEMA_COMPLETO.md](RESUMEN_VISUAL_SISTEMA_COMPLETO.md) | Flowchart completo |

---

## 🎯 TL;DR

- **Backend**: Ya está listo. Retorna `tags_source`, `gemini_access`, `gemini_status`.
- **Frontend**: Solo falta leer esos campos y mostrar un badge verde/rojo.
- **Multi-key**: Configurar en `.env` y listo. El sistema rota automáticamente.

**Tiempo de implementación frontend**: 10 minutos.

---

**Versión**: 3.0  
**Estado**: ✅ Backend | ⏳ Frontend
