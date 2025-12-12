# 🔐 GUÍA: REPARAR API KEY LEAKEADA Y CONFIGURAR GEMINI

## 🚨 SITUACIÓN ACTUAL

Tu API key de Google Gemini fue **expuesta en GitHub** y **revocada por Google**.

**Error confirmado**:
```
403 Your API key was reported as leaked. Please use another API key.
```

**Causa**:
- El archivo `WAVAULT/backend/.env` estaba trackeado en git
- La API key fue pusheada a GitHub (repositorio público)
- Google detectó el leak automáticamente y la revocó

---

## ✅ SOLUCIÓN INMEDIATA

### **Paso 1: Crear Nueva API Key**

1. **Ir a Google AI Studio**:
   - URL: https://aistudio.google.com/apikey
   - Login con tu cuenta de Google

2. **Crear nueva key**:
   - Click en **"Create API Key"**
   - Selecciona tu proyecto existente o crea uno nuevo
   - **IMPORTANTE**: No uses la key anterior, está revocada

3. **Copiar la nueva key**:
   - Formato: `AIza...` (empieza con AIza)
   - Guárdala temporalmente en un lugar seguro

---

### **Paso 2: Actualizar .env Local**

Edita el archivo: `/workspaces/WAVAULT-V2/WAVAULT/backend/.env`

```bash
# Reemplaza con tu NUEVA API key
GEMINI_API_KEY=AIza_TU_NUEVA_KEY_AQUI
```

---

### **Paso 3: Verificar que Funciona**

Ejecuta este comando para probar:

```bash
cd /workspaces/WAVAULT-V2/WAVAULT/backend
python3 -c "
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv('GEMINI_API_KEY')

genai.configure(api_key=API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')
response = model.generate_content('Di: OK')
print('✅ API KEY FUNCIONA:', response.text)
"
```

**Resultado esperado**:
```
✅ API KEY FUNCIONA: OK
```

---

### **Paso 4: Probar el Sistema V2**

```bash
cd /workspaces/WAVAULT-V2/WAVAULT/backend
python3 analyze_beat_ai.py \
  "/workspaces/WAVAULT-V2/WAVAULT/public/uploads/audio/1765371065109-Can't_Fight_It_-_Quintino_Cheat_Codes_(320).mp3" \
  "[DEMO] Travis Scott Type Beat - Cm 140.mp3" \
  --v2
```

**Resultado esperado**:
```json
{
  "tags": [
    "Cm", "Minor", "140BPM", "Dark", "Trap", "Travis Scott",
    "Rage", "808 Heavy", "Atmospheric", "Melancholic", ...
  ],
  "artist_known": true,
  "artist_info": {
    "genre": "Hip-Hop/Trap",
    "subgenres": ["Rage", "Melodic Trap"]
  }
}
```

---

## 🔒 PROTECCIÓN IMPLEMENTADA

Ya se implementaron las siguientes medidas de seguridad:

### ✅ 1. .gitignore Creado
```
.env
*.env
.env.*
```

### ✅ 2. .env Removido del Tracking
```bash
git rm --cached WAVAULT/backend/.env
```
El archivo `.env` ya NO será trackeado por git

### ✅ 3. .env.example Creado
Archivo de ejemplo sin datos sensibles para referencia

---

## 📋 PRÓXIMOS PASOS DESPUÉS DE ACTUALIZAR LA KEY

1. **Commit los cambios de seguridad**:
```bash
cd /workspaces/WAVAULT-V2
git add .gitignore WAVAULT/backend/.env.example
git commit -m "🔒 Security: Add .gitignore and remove .env from tracking"
git push
```

2. **Verificar que .env NO está en el commit**:
```bash
git status
# No debería aparecer .env
```

3. **Probar el sistema V2** con la nueva key

---

## 🎯 MODELOS GEMINI DISPONIBLES (FREE TIER)

Tu nueva API key tendrá acceso a estos modelos gratuitos:

| Modelo | Límites FREE | Mejor Para |
|--------|--------------|------------|
| **gemini-2.5-flash** | 15 RPM, 1500 RPD | **RECOMENDADO** - Rápido y eficiente |
| gemini-2.0-flash-exp | 10 RPM, 500 RPD | Experimental, menos límites |
| gemini-flash-latest | 15 RPM, 1500 RPD | Alias del más reciente |

**RPM** = Requests Per Minute  
**RPD** = Requests Per Day

---

## 📊 LÍMITES DEL FREE TIER

### Sin Pago (FREE)
```
✅ 15 requests/minuto
✅ 1,500 requests/día
✅ 1 millón tokens/minuto
✅ Sin límite de tokens/día
```

### Costo si Excedes (Pay-as-you-go)
```
gemini-2.5-flash:
  - Input: $0.075 / 1M tokens
  - Output: $0.30 / 1M tokens
```

**Para tu caso**: Con 1,500 requests/día FREE, es **más que suficiente** para desarrollo.

---

## 🔧 CONFIGURACIÓN DEL SISTEMA

El código ya está configurado para usar múltiples modelos como fallback:

```python
try:
    model = genai.GenerativeModel('gemini-2.0-flash-exp')
    response = model.generate_content(prompt)
except Exception as e:
    if '429' in str(e) or 'quota' in str(e).lower():
        print("⚠️ gemini-2.0 quota exceeded, trying gemini-1.5-flash...")
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
```

---

## ⚠️ PREVENCIÓN DE FUTUROS LEAKS

### ❌ NUNCA HAGAS ESTO:
```bash
git add .env                    # ❌
git commit -m "Add config"      # ❌
git push                         # ❌ API key expuesta
```

### ✅ SIEMPRE VERIFICA:
```bash
git status
# Si ves .env listado, NO hagas commit!
```

### ✅ USA VARIABLES DE ENTORNO:
```python
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv('GEMINI_API_KEY')  # ✅ Seguro
```

### ❌ NUNCA HARDCODEES:
```python
API_KEY = "AIza123456..."  # ❌ NUNCA EN EL CÓDIGO
```

---

## 🆘 SI VUELVE A PASAR

1. **Revocar key inmediatamente**:
   - Ve a: https://console.cloud.google.com/apis/credentials
   - Encuentra la key comprometida
   - Click en "Delete"

2. **Crear nueva key**

3. **Actualizar .env localmente**

4. **Verificar .gitignore** está funcionando:
```bash
git status
# .env NO debe aparecer
```

---

## 📞 SOPORTE

Si tienes problemas:

1. **API Key no funciona**: Verifica que copiaste correctamente (sin espacios)
2. **Quota agotada**: Espera 1 minuto y reintenta
3. **403 Forbidden**: La key fue revocada, crea una nueva
4. **404 Model not found**: Usa `gemini-2.5-flash` en vez de modelos viejos

---

## ✅ CHECKLIST DE SEGURIDAD

- [x] .gitignore creado con `.env`
- [x] .env removido del tracking git
- [x] .env.example creado (sin datos sensibles)
- [ ] Nueva API key obtenida de Google
- [ ] .env actualizado con nueva key
- [ ] Sistema V2 probado y funcional
- [ ] Commit de cambios de seguridad pusheado

---

**Última actualización**: 2025-12-12  
**Status**: 🔴 API KEY REVOCADA - Requiere nueva key  
**Próximo paso**: Crear nueva API key en https://aistudio.google.com/apikey
