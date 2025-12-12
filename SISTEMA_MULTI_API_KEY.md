# 🔑 SISTEMA MULTI-API KEY CON FALLBACK AUTOMÁTICO

## 🎯 QUÉ ES

Sistema inteligente que usa **múltiples API keys de Gemini** con fallback automático. Si una key falla (429, 403, etc.), el sistema cambia automáticamente a la siguiente sin intervención manual.

---

## ✅ IMPLEMENTADO

```python
# Sistema detecta automáticamente:
GEMINI_API_KEY       → KEY #1 (principal)
GEMINI_API_KEY_2     → KEY #2 (backup)
GEMINI_API_KEY_3     → KEY #3 (backup 2)

# Fallback automático:
Try KEY #1 → Error 429 → Try KEY #2 → Success ✅
Try KEY #1 → Error 403 → Try KEY #2 → Error → Try KEY #3 → Success ✅
```

---

## 📊 CÁLCULOS DE CAPACIDAD

### Para TU CASO: 20 beats/día

```
CON 1 API KEY:
├─ Capacidad: 1,500 beats/día (sin caché) o 3,000 beats/día (con caché 50%)
├─ Uso real: 20 beats (0.67% - 1.3%)
└─ Resultado: SOBRA CAPACIDAD ✅

CON 2 API KEYS (ÓPTIMO):
├─ Capacidad: 3,000 beats/día (sin caché) o 6,000 beats/día (con caché 50%)
├─ Uso real: 20 beats (0.33% - 0.67%)
├─ Beneficio: Si KEY #1 falla → KEY #2 automático
└─ Resultado: PREPARADO PARA ESCALAR ✅
```

### Escalado a 50-100 beats/día

```
50 BEATS/DÍA:
├─ MÍNIMO: 1 API Key (suficiente)
├─ ÓPTIMO: 2 API Keys (seguridad)
└─ Uso: 1.67% - 3.3% de capacidad total

100 BEATS/DÍA:
├─ MÍNIMO: 2 API Keys (recomendado)
├─ ÓPTIMO: 3 API Keys (producción seria)
└─ Uso: 2.2% - 6.7% de capacidad total
```

---

## 📋 RECOMENDACIÓN DIRECTA

### Para 20 beats/día:
```
✅ MÍNIMO: 1 API Key (ya la tienes)
✅ ÓPTIMO: 2 API Keys (crea 1 más)

Razón:
- Redundancia automática
- Si una falla → la otra toma el control
- Preparado para crecer a 100 beats sin preocuparte
```

### Para 50-100 beats/día:
```
✅ MÍNIMO: 2 API Keys
✅ ÓPTIMO: 3 API Keys

Razón:
- Triple redundancia
- Distribución de carga
- Margen de 97.8% libre para picos
```

---

## 🚀 CÓMO CONFIGURAR

### Paso 1: Crear API Keys

1. Ve a: https://aistudio.google.com/app/apikey
2. Click en "Get API key"
3. Click en "Create API key"
4. Repite para crear 2-3 keys

**IMPORTANTE**: Cada key tiene límites independientes:
- 1,500 requests/día
- 1,000,000 tokens/día
- 15 requests/minuto

### Paso 2: Agregar al .env

Edita `/workspaces/WAVAULT-V2/WAVAULT/backend/.env`:

```bash
# KEY PRINCIPAL (obligatoria)
GEMINI_API_KEY=AIzaSyD18HKDrddCIsfEH4fW0VpbefSHyfjFLNA

# KEY BACKUP #1 (recomendada)
GEMINI_API_KEY_2=TU_SEGUNDA_KEY_AQUI

# KEY BACKUP #2 (opcional, para 100+ beats/día)
GEMINI_API_KEY_3=TU_TERCERA_KEY_AQUI
```

### Paso 3: Reiniciar Servidor

```bash
cd /workspaces/WAVAULT-V2/WAVAULT/backend
./start-server.sh
```

---

## 🧪 CÓMO TESTEAR

### Test Automático (Recomendado)

```bash
cd /workspaces/WAVAULT-V2
./test_api_key_fallback.sh
```

Esto ejecuta 4 tests:
1. ✅ Inicialización (detecta cuántas keys hay)
2. ✅ KEY válida (verifica que funciona)
3. ✅ Fallback automático (KEY inválida → KEY válida)
4. ✅ Todas inválidas (verifica error claro)

### Test Manual (en Producción)

1. Sube un beat en `http://localhost:3000/public/upload-beat-final.html`
2. Abre la consola del servidor: `tail -f /workspaces/WAVAULT-V2/WAVAULT/backend/logs/server.log`
3. Busca estos logs:

```
🔑 Sistema Multi-API Key inicializado: 2 key(s) activa(s)
   └─ Fallback automático habilitado: KEY_1 → KEY_2 → KEY_3

🔑 Intentando con API KEY #1...
✅ API KEY #1 funcionó correctamente

# Si KEY #1 falla:
⚠️  API KEY #1 alcanzó límite (429) - probando siguiente...
🔑 Intentando con API KEY #2...
✅ API KEY #2 funcionó correctamente
```

---

## 📊 LOGS DEL SISTEMA

### Log Normal (KEY funcionando)

```
🔑 Sistema Multi-API Key inicializado: 2 key(s) activa(s)
🔑 Intentando con API KEY #1...
✅ API KEY #1 funcionó correctamente
```

### Log de Fallback (KEY #1 falló → KEY #2 OK)

```
🔑 Intentando con API KEY #1...
⚠️  API KEY #1 alcanzó límite (429) - probando siguiente...
🔑 Intentando con API KEY #2...
✅ API KEY #2 funcionó correctamente
```

### Log de Error Total (todas fallaron)

```
🔑 Intentando con API KEY #1...
⚠️  API KEY #1 alcanzó límite (429) - probando siguiente...
🔑 Intentando con API KEY #2...
⚠️  API KEY #2 inválida (403) - probando siguiente...
🔑 Intentando con API KEY #3...
⚠️  API KEY #3 alcanzó límite (429) - probando siguiente...
❌ Todas las API keys fallaron (3 intentos)
```

---

## 🔥 CASOS DE USO REALES

### Caso 1: Producer Casual (20 beats/día)

```
SETUP ACTUAL:
- 1 API Key configurada

RECOMENDACIÓN:
- Crea 1 key adicional (total 2)
- Redundancia sin costo adicional
- Preparado para crecer

BENEFICIO:
- Si falla → backup automático
- 0 downtime
```

### Caso 2: Producer Activo (50 beats/día)

```
SETUP RECOMENDADO:
- 2 API Keys

CAPACIDAD:
- 3,000 beats/día sin caché
- 6,000 beats/día con caché 50%

BENEFICIO:
- 98.3% de capacidad libre
- Fallback automático
- Listo para picos de trabajo
```

### Caso 3: Operación Seria (100+ beats/día)

```
SETUP RECOMENDADO:
- 3 API Keys

CAPACIDAD:
- 4,500 beats/día sin caché
- 9,000 beats/día con caché 50%

BENEFICIO:
- Triple redundancia
- 97.8% de margen libre
- Distribuye carga automáticamente
- Preparado para escalar a 1000+ beats
```

---

## 🛡️ BENEFICIOS DEL SISTEMA

### 1. Redundancia Automática
- Si una key falla → siguiente key toma el control
- 0 intervención manual
- 0 downtime

### 2. Escalabilidad Sin Esfuerzo
- Agrega keys en `.env`
- Sistema las detecta automáticamente
- Sin cambios de código

### 3. Inteligencia de Errores
- Detecta tipo de error (429, 403, 500)
- Log claro del motivo
- Fallback solo cuando es necesario

### 4. Costo = $0
- API Keys de Gemini son GRATIS
- Crear 2-3 keys = $0
- Mantener sistema = $0

---

## 🔧 CÓDIGO IMPLEMENTADO

### Inicialización (analyze_beat_ai.py líneas 41-59)

```python
# Soporta hasta 3 API keys
GEMINI_API_KEYS = [
    os.environ.get('GEMINI_API_KEY', ''),
    os.environ.get('GEMINI_API_KEY_2', ''),
    os.environ.get('GEMINI_API_KEY_3', ''),
]

# Filtrar keys vacías
ACTIVE_API_KEYS = [key for key in GEMINI_API_KEYS if key and key != 'empty']

print(f"🔑 Sistema Multi-API Key: {len(ACTIVE_API_KEYS)} key(s) activa(s)")
```

### Función de Fallback (analyze_beat_ai.py líneas 75-145)

```python
def call_gemini_with_fallback(prompt, model_name="gemini-2.0-flash-lite"):
    """Llama a Gemini con fallback automático entre múltiples API keys"""
    
    if not ACTIVE_API_KEYS:
        raise Exception("❌ No hay API keys configuradas")
    
    reset_api_key_rotation()
    last_error = None
    
    while True:
        api_key, key_index = get_next_api_key()
        
        if api_key is None:
            # Ya probamos todas las keys
            raise Exception(f"❌ Todas las API keys fallaron")
        
        try:
            print(f"🔑 Intentando con API KEY #{key_index + 1}...")
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt)
            
            print(f"✅ API KEY #{key_index + 1} funcionó correctamente")
            return response.text
            
        except Exception as e:
            error_str = str(e)
            
            if "429" in error_str or "quota" in error_str.lower():
                print(f"⚠️  API KEY #{key_index + 1} alcanzó límite (429)")
            elif "403" in error_str or "invalid" in error_str.lower():
                print(f"⚠️  API KEY #{key_index + 1} inválida (403)")
            else:
                print(f"⚠️  API KEY #{key_index + 1} falló: {error_str[:100]}")
            
            # Continuar con la siguiente key
```

---

## 📈 ESTADÍSTICAS ESPERADAS

### Con 2 API Keys (20 beats/día)

```
Scenario 1: KEY #1 siempre funciona
├─ Requests totales: 10/día (con caché 50%)
├─ KEY #1 uso: 10 requests (0.67% de límite)
└─ KEY #2 uso: 0 requests (backup sin usar)

Scenario 2: KEY #1 falla 50% del tiempo
├─ Requests totales: 10/día
├─ KEY #1 uso: 5 requests (0.33%)
├─ KEY #2 uso: 5 requests (0.33%)
└─ Distribución: Perfecta sin intervención manual

Scenario 3: KEY #1 alcanza límite diario
├─ KEY #1 uso: 1,500 requests (100%)
├─ Sistema detecta: 429 Too Many Requests
├─ Fallback: KEY #2 toma control automáticamente
└─ KEY #2 usa: 10 requests restantes (0.67%)
```

---

## 🎯 CONCLUSIÓN

### Para 20 beats/día:
```
✅ MÍNIMO: 1 API Key (suficiente)
✅ ÓPTIMO: 2 API Keys (redundancia)
└─ Costo: $0
└─ Tiempo setup: 2 minutos
└─ Beneficio: Tranquilidad total
```

### Para 50-100 beats/día:
```
✅ MÍNIMO: 2 API Keys
✅ ÓPTIMO: 3 API Keys
└─ Capacidad: 9,000 beats/día con caché
└─ Uso real: 2.2% (100 beats)
└─ Margen: 97.8% libre
```

---

## 📁 ARCHIVOS RELACIONADOS

- `/workspaces/WAVAULT-V2/WAVAULT/backend/.env` - Configuración de keys
- `/workspaces/WAVAULT-V2/WAVAULT/backend/analyze_beat_ai.py` - Implementación
- `/workspaces/WAVAULT-V2/test_api_key_fallback.sh` - Script de tests
- `/workspaces/WAVAULT-V2/CALCULO_API_KEYS.md` - Cálculos detallados

---

## 🚀 PRÓXIMO PASO

**Crea 1 API key adicional** (para tener 2 total):

1. https://aistudio.google.com/app/apikey
2. Click "Create API key"
3. Copia la key
4. Edita `.env`: `GEMINI_API_KEY_2=TU_KEY_AQUI`
5. Reinicia servidor: `./start-server.sh`
6. Verifica logs: `tail -f logs/server.log`

**Listo!** Sistema con redundancia automática sin costo adicional ✅
