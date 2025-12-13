# 🏥 SISTEMA DE HEALTH CHECK PARA API KEYS

## 🎯 PROBLEMA QUE RESUELVE

### Antes (Sin Health Check)

```
Beat #1 → Intenta KEY #1
         ├─ Envía PROMPT COMPLETO (650 tokens)
         ├─ Espera respuesta (3-5 segundos)
         ├─ ERROR 429: Quota exceeded
         └─ ❌ Desperdicio: 650 tokens + 5 segundos

         → Intenta KEY #2
         ├─ Envía PROMPT COMPLETO (650 tokens)
         ├─ Espera respuesta (3-5 segundos)
         └─ ✅ Funciona (pero perdimos tiempo y tokens)

PROBLEMA:
- Envía data a keys que ya sabemos están caídas
- Desperdicia tokens de la key mala
- Desperdicia tiempo esperando timeout
```

### Ahora (Con Health Check)

```
Beat #1 → Health Check KEY #1
         ├─ Envía "Say OK" (10 tokens - prompt mínimo)
         ├─ Respuesta rápida (0.5 segundos)
         ├─ ERROR 429: Quota exceeded
         └─ ⚠️  KEY #1 marcada como "bad" (cache)

         → Health Check KEY #2
         ├─ Envía "Say OK" (10 tokens)
         ├─ ✅ Funciona
         └─ Cache: KEY #2 = "ok" por 5 minutos

         → Envía PROMPT REAL a KEY #2
         ├─ Envía PROMPT COMPLETO (650 tokens)
         └─ ✅ Funciona DIRECTAMENTE (ahorramos 650 tokens + 5 seg)

BENEFICIO:
- Verifica ANTES de enviar data del beat
- Ahorra 650 tokens por key mala
- Ahorra 5 segundos por key mala
- Cache inteligente: no verifica constantemente
```

---

## 🚀 CÓMO FUNCIONA

### 1. Health Check Ligero (10 tokens)

```python
def check_api_key_health(api_key, key_index):
    """Verifica si una key está funcional con prompt mínimo"""
    
    # Verificar caché primero
    if key_index in API_KEY_HEALTH:
        cache = API_KEY_HEALTH[key_index]
        
        # Si estaba OK hace menos de 5 minutos → asumir OK
        if cache['status'] == 'ok' and (now - cache['last_check']) < 300:
            return True, None
        
        # Si estaba MAL hace menos de 1 minuto → skip
        if cache['status'] == 'bad' and (now - cache['last_check']) < 60:
            return False, cache['error_msg']
    
    # Health check real: prompt ultra-mínimo
    try:
        model = genai.GenerativeModel('gemini-2.0-flash-lite')
        response = model.generate_content("Say OK")  # 10 tokens
        
        # Actualizar cache: OK por 5 minutos
        API_KEY_HEALTH[key_index] = {
            'status': 'ok',
            'last_check': now,
            'error_count': 0
        }
        return True, None
        
    except Exception as e:
        # Actualizar cache: MAL por 1 minuto
        API_KEY_HEALTH[key_index] = {
            'status': 'bad',
            'last_check': now,
            'error_count': error_count + 1,
            'error_msg': str(e)[:100]
        }
        return False, str(e)
```

### 2. Integración en Fallback

```python
def call_gemini_with_fallback(prompt, model_name):
    """Llama a Gemini con health check previo"""
    
    while True:
        api_key, key_index = get_next_api_key()
        
        # 🏥 HEALTH CHECK PRIMERO
        print(f"🔍 Verificando API KEY #{key_index + 1}...")
        is_healthy, error_msg = check_api_key_health(api_key, key_index)
        
        if not is_healthy:
            print(f"⚠️  KEY #{key_index + 1} NO funcional - probando siguiente...")
            continue  # ⚡ SKIP sin enviar prompt completo
        
        print(f"✅ KEY #{key_index + 1} pasa health check - enviando prompt...")
        
        # Ahora SÍ enviar el prompt completo (650 tokens)
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            # Actualizar cache como "bad"
            API_KEY_HEALTH[key_index] = {'status': 'bad', ...}
            continue
```

---

## 📊 AHORRO DE RECURSOS

### Escenario: KEY #1 caída, KEY #2 funcional

#### Sin Health Check

```
Intento con KEY #1:
├─ Prompt: 650 tokens
├─ Tiempo: 5 segundos
├─ Resultado: Error 429
└─ Desperdicio: 650 tokens + 5 seg

Intento con KEY #2:
├─ Prompt: 650 tokens
├─ Tiempo: 2 segundos
├─ Resultado: Success
└─ Total: 1,300 tokens + 7 segundos
```

#### Con Health Check

```
Health Check KEY #1:
├─ Prompt: 10 tokens
├─ Tiempo: 0.5 segundos
├─ Resultado: Error 429
└─ Cache: "bad" por 1 minuto

Health Check KEY #2:
├─ Prompt: 10 tokens
├─ Tiempo: 0.5 segundos
├─ Resultado: OK
└─ Cache: "ok" por 5 minutos

Prompt Real a KEY #2:
├─ Prompt: 650 tokens
├─ Tiempo: 2 segundos
└─ Total: 670 tokens + 3 segundos

AHORRO:
├─ Tokens: 1,300 - 670 = 630 tokens (-48%)
└─ Tiempo: 7 - 3 = 4 segundos (-57%)
```

### Escenario: KEY #1 funcional (caso normal)

#### Sin Health Check

```
Intento KEY #1:
├─ Prompt: 650 tokens
├─ Tiempo: 2 segundos
└─ Total: 650 tokens + 2 seg
```

#### Con Health Check (primera vez)

```
Health Check KEY #1:
├─ Prompt: 10 tokens
├─ Tiempo: 0.5 segundos
└─ Cache: "ok" por 5 minutos

Prompt Real KEY #1:
├─ Prompt: 650 tokens
├─ Tiempo: 2 segundos
└─ Total: 660 tokens + 2.5 seg

OVERHEAD: +10 tokens + 0.5 seg (solo primera vez)
```

#### Con Health Check (beats 2-N dentro de 5 minutos)

```
Verifica Cache:
├─ KEY #1 = "ok" (hace 2 minutos)
└─ Skip health check

Prompt Real KEY #1:
├─ Prompt: 650 tokens
├─ Tiempo: 2 segundos
└─ Total: 650 tokens + 2 seg

OVERHEAD: 0 tokens + 0 seg (usa caché) ✅
```

---

## ⏱️ DURACIÓN DEL CACHÉ

### Keys Funcionales (Status = OK)

```
Cache válido por: 5 MINUTOS

Razón:
- Keys funcionales rara vez se caen repentinamente
- 5 minutos = buen balance entre verificación y performance
- Dentro de 5 min → usa caché, sin overhead

Ejemplo:
├─ Beat #1: Health check (10 tokens) → OK → cache 5 min
├─ Beat #2 (1 min después): Cache OK → skip health check ✅
├─ Beat #3 (2 min después): Cache OK → skip health check ✅
├─ Beat #4 (6 min después): Cache expiró → health check (10 tokens)
```

### Keys Caídas (Status = BAD)

```
Cache válido por: 1 MINUTO

Razón:
- Keys pueden recuperarse rápido (quota se resetea)
- 1 minuto = evita spam de requests a key caída
- Después de 1 min → reintenta (puede haberse recuperado)

Ejemplo:
├─ Beat #1: Health check → Error 429 → cache "bad" 1 min
├─ Beat #2 (30 seg después): Cache BAD → skip esta key ✅
├─ Beat #3 (2 min después): Cache expiró → reintenta health check
```

---

## 📈 LOGS ESPERADOS

### Caso 1: KEY #1 Funcional (Normal)

```bash
# Beat #1 (primera vez)
🔍 Verificando API KEY #1...
🏥 Health check: enviando "Say OK" (10 tokens)
✅ API KEY #1 pasa health check - enviando prompt...
✅ API KEY #1 funcionó correctamente

# Beat #2 (dentro de 5 min)
🔍 Verificando API KEY #1...
💾 Cache: KEY #1 OK (hace 2 min) - skip health check
✅ API KEY #1 pasa health check - enviando prompt...
✅ API KEY #1 funcionó correctamente
```

### Caso 2: KEY #1 Caída → Fallback a KEY #2

```bash
# Beat #1
🔍 Verificando API KEY #1...
🏥 Health check: enviando "Say OK" (10 tokens)
⚠️  API KEY #1 NO funcional (health check) - probando siguiente...
   Razón: 429 You exceeded your current quota

🔍 Verificando API KEY #2...
🏥 Health check: enviando "Say OK" (10 tokens)
✅ API KEY #2 pasa health check - enviando prompt...
✅ API KEY #2 funcionó correctamente

# Beat #2 (dentro de 1 min)
🔍 Verificando API KEY #1...
💾 Cache: KEY #1 BAD (hace 30 seg) - skip
⚠️  API KEY #1 NO funcional (health check) - probando siguiente...

🔍 Verificando API KEY #2...
💾 Cache: KEY #2 OK (hace 30 seg) - skip health check
✅ API KEY #2 pasa health check - enviando prompt...
✅ API KEY #2 funcionó correctamente
```

### Caso 3: Todas las Keys Caídas

```bash
🔍 Verificando API KEY #1...
⚠️  API KEY #1 NO funcional (health check) - probando siguiente...

🔍 Verificando API KEY #2...
⚠️  API KEY #2 NO funcional (health check) - probando siguiente...

🔍 Verificando API KEY #3...
⚠️  API KEY #3 NO funcional (health check) - probando siguiente...

❌ Todas las API keys fallaron (3 intentos)
Último error: 429 You exceeded your current quota
```

---

## 🎯 BENEFICIOS CLAVE

### 1. Ahorro de Tokens

```
- Health check: 10 tokens (vs 650 del prompt real)
- Ahorro por key mala: 640 tokens (98.5%)
- Con caché: 0 overhead adicional después de 1er check
```

### 2. Ahorro de Tiempo

```
- Health check: 0.5 segundos (vs 3-5 seg del prompt real)
- Ahorro por key mala: 2.5-4.5 segundos (50-90%)
- Fallback más rápido = mejor UX
```

### 3. Inteligencia de Caché

```
- Keys OK: Cache 5 minutos (reduce overhead)
- Keys BAD: Cache 1 minuto (evita spam, permite recovery)
- Auto-recovery: Keys caídas se reintenta después de 1 min
```

### 4. Menos Requests al Límite Diario

```
SIN health check (KEY #1 caída):
├─ Beat 1: KEY #1 falla (1 request) + KEY #2 OK (1 request) = 2 requests
├─ Beat 2: KEY #1 falla (1 request) + KEY #2 OK (1 request) = 2 requests
└─ 20 beats: 40 requests (desperdicio: 20 en KEY #1)

CON health check + caché:
├─ Beat 1: Health #1 (1) + Health #2 (1) + Prompt #2 (1) = 3 requests
├─ Beat 2-N: Prompt #2 (1) = 1 request (usa caché)
└─ 20 beats: 22 requests (ahorro: 18 requests = 45%)
```

---

## 🔧 CONFIGURACIÓN RECOMENDADA

### Duración de Caché

```python
# Keys OK: 5 minutos (300 segundos)
if cache['status'] == 'ok' and time_since_check < 300:
    return True, None

# Keys BAD: 1 minuto (60 segundos)
if cache['status'] == 'bad' and time_since_check < 60:
    return False, cache['error_msg']
```

**Ajustable según tu caso**:
- Más beats/minuto → Reducir a 2-3 minutos (más verificaciones)
- Pocos beats/día → Aumentar a 10 minutos (menos overhead)

---

## ✅ CONCLUSIÓN

**Sistema de Health Check implementado**:

✅ Verifica API key ANTES de enviar data del beat  
✅ Ahorra 640 tokens por key caída (98.5%)  
✅ Ahorra 2.5-4.5 segundos por key caída  
✅ Caché inteligente: 0 overhead después del 1er check  
✅ Auto-recovery: Keys caídas se reintentan después de 1 min  
✅ Menos requests desperdiciados en keys malas  

**Tu pregunta respondida**: SÍ, el sistema verifica el estado OK de la API ANTES de enviar la data del beat ✅
