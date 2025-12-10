# 🔑 GUÍA DE ACTUALIZACIÓN DE API KEY - WAVAULT V2

## 📌 Resumen Ejecutivo

**Cada vez que clones el proyecto WAVAULT V2, DEBES actualizar la API Key de Google Gemini.**

La API Key actual (`AIzaSyBqreeolm2eh4e0SIoELyDGRT4EaT81aI4`) es personal del desarrollador y tiene límites de uso. Usar la misma key múltiples veces puede causar problemas.

---

## 🎯 ¿Por qué actualizar la API Key?

### Razones Técnicas

1. **Límites de Cuota:** Cada API Key tiene límites de solicitudes por minuto/día
2. **Seguridad:** Nunca deben compartirse credenciales en código público
3. **Rastreo:** Google rastrea el uso por API Key para facturación y análisis
4. **Revocación:** Si la key se compromete, puedes desactivarla sin afectar otras claves
5. **Separación de Ambientes:** Dev, Test y Producción deben usar keys diferentes

### Razones Prácticas

- **Pruebas locales:** No agotarás la cuota de desarrollo
- **Múltiples desarrolladores:** Cada uno usa su propia key
- **Control de acceso:** Google Cloud Console muestra uso por API Key
- **Facturación:** Cada proyecto tiene su propio costos

---

## 📋 Pasos para Obtener tu Propia API Key

### Paso 1: Crear Cuenta Google (si no tienes)

1. Ve a https://accounts.google.com/
2. Clic en "Crear cuenta"
3. Completa los datos solicitados
4. Verifica tu correo

### Paso 2: Acceder a Google AI Studio

1. Visita: https://makersuite.google.com/app/apikey
2. Se abrirá tu dashboard de API Keys
3. Deberá mostrar: "Get API key for generative AI"

### Paso 3: Crear Nueva API Key

1. Haz clic en botón azul **"Create API Key"**
2. Se abrirá un modal con 2 opciones:
   ```
   ○ Create API key in new project
   ○ Create API key in an existing project
   ```
3. Selecciona **"Create API key in new project"** (primera vez)
4. Automáticamente creará un proyecto en Google Cloud
5. Verás tu nueva API Key, ej:
   ```
   AIzaSyC1x2y3z4a5b6c7d8e9f0g1h2i3j4k5l6m
   ```

### Paso 4: Copiar la API Key

1. Busca el botón de "copiar" (ícono de portapapeles)
2. Copia la clave exacta
3. Guárdala en un lugar seguro (password manager)

### Paso 5: Habilitar Generative Language API

1. Ve a: https://console.cloud.google.com/
2. Proyecto debe estar seleccionado (arriba)
3. Ir a: "APIs y Servicios" → "Biblioteca"
4. Buscar: "Generative Language API"
5. Clic en ella
6. Botón azul **"Habilitar"**
7. Esperar confirmación (puede tardar 1-2 minutos)

---

## 🔧 Dónde Reemplazar la API Key

### OPCIÓN A: Variable de Entorno (RECOMENDADO)

**Ventaja:** La key no aparece en archivos del proyecto

```bash
# En tu terminal actual
export GEMINI_API_KEY="tu_nueva_clave_aqui"

# Verificar
echo $GEMINI_API_KEY
```

**Para hacerlo persistente:**

```bash
# Editar ~/.bashrc (Linux) o ~/.zshrc (macOS)
nano ~/.bashrc

# Al final del archivo, agregar:
export GEMINI_API_KEY="tu_nueva_clave_aqui"

# Guardar (Ctrl+O, Enter, Ctrl+X)
# Aplicar cambios
source ~/.bashrc

# Verificar en nueva terminal
echo $GEMINI_API_KEY
```

### OPCIÓN B: Archivo .env (PARA DESARROLLO)

**Ventaja:** Fácil de cambiar durante desarrollo
**Desventaja:** Debes incluir .env en .gitignore

```bash
# En la carpeta /WAVAULT/backend/
cd /path/to/WAVAULT/backend

# Crear archivo .env
cat > .env << EOF
GEMINI_API_KEY=tu_nueva_clave_aqui
EOF

# Verificar contenido
cat .env

# Agregar a .gitignore
echo ".env" >> .gitignore

# Verificar que está en .gitignore
cat .gitignore | grep .env
```

**Cargar la key antes de ejecutar:**

```bash
# Opción 1: Cargar y ejecutar
source .env && node server.js

# Opción 2: En el mismo comando
GEMINI_API_KEY=$(cat .env | grep GEMINI_API_KEY | cut -d'=' -f2) node server.js

# Opción 3: Script helper
#!/bin/bash
source .env
node server.js
```

### OPCIÓN C: Directamente en el Código (NO RECOMENDADO)

**⚠️ RIESGO ALTO:** Expone la key si subes a Git público

```python
# En analyze_beat_ai.py línea 19
GEMINI_API_KEY = "tu_nueva_clave_aqui"  # ❌ MAL

# Mejor:
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')  # ✅ BIEN
```

---

## ✅ Verificar que la API Key Funciona

### Test 1: Verificar Variable de Entorno

```bash
echo $GEMINI_API_KEY
# Debe mostrar tu clave, ej: AIzaSyC1x2y3z4a5b6c7d8e9f0g1h2i3j4k5l6m
```

### Test 2: Test Python Simple

```bash
cd /path/to/WAVAULT/backend

python3 << 'EOF'
import os
import google.generativeai as genai

api_key = os.environ.get('GEMINI_API_KEY')
if not api_key:
    print("❌ API Key no configurada")
    exit(1)

try:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-pro')
    response = model.generate_content('Hola, prueba')
    print("✅ API Key válida - Gemini respondió correctamente")
except Exception as e:
    print(f"❌ Error: {e}")
EOF
```

### Test 3: Test con analyze_beat_ai.py

```bash
# Crear archivo de audio de prueba (necesita ffmpeg)
ffmpeg -f lavfi -i "sine=frequency=440:duration=5" -q:a 9 -acodec libmp3lame -ab 32k test_audio.mp3

# Ejecutar análisis
export GEMINI_API_KEY="tu_clave_aqui"
python3 analyze_beat_ai.py test_audio.mp3 "Test Beat - Type Beat - Em - 120.mp3"

# Debe mostrar:
# ✅ TuneBat (vía Gemini): BPM=..., Key=...
# ✅ Gemini enriquecimiento completado
```

---

## 📊 Tabla de Localización de API Key

| Archivo | Línea | Contexto |
|---|---|---|
| `analyze_beat_ai.py` | 19 | `GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', 'tu_api_key_aqui')` |
| `parse_filename_ai.py` | 14 | `GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')` |
| `metadata_enrichment.py` | 30 | `GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "empty")` |
| `server.js` | 305 | Lee de env: `process.env.GEMINI_API_KEY` |
| `backend/.env` | 1 | `GEMINI_API_KEY=tu_clave_aqui` |
| `~/.bashrc` | EOF | `export GEMINI_API_KEY="tu_clave_aqui"` |

---

## 🔐 Seguridad: Buenas Prácticas

### ✅ Hacer esto

```bash
# Usar variables de entorno
export GEMINI_API_KEY="clave_segura"

# Usar .env con .gitignore
# .env (NO commiteado)
# .gitignore contiene: .env

# Usar GitHub Secrets en CI/CD
# En Actions YAML:
env:
  GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}

# Usar Google Cloud Secret Manager
# Para producción con múltiples ambientes
```

### ❌ NO hacer esto

```bash
# ❌ API Key en el código
GEMINI_API_KEY = "AIzaSyC1x2y3z4a5b6c7d8e9f0g1h2i3j4k5l6m"

# ❌ .env commiteado a Git
git add .env  # MALO

# ❌ API Key en logs públicos
console.log("Key: " + GEMINI_API_KEY)

# ❌ API Key en documentación pública
README.md: "Use this key: AIzaSyC1..."
```

---

## 🔄 Proceso de Clonación Completo

```bash
# 1. Clonar repo
git clone https://github.com/ChristianRodriguez3012/WAVAULT-V2.git
cd WAVAULT-V2

# 2. Obtener tu propia API Key
# Visita: https://makersuite.google.com/app/apikey
# Copia la clave

# 3. Configurar API Key (elige una opción)

# OPCIÓN A: Variable de entorno
export GEMINI_API_KEY="tu_nueva_clave_aqui"

# OPCIÓN B: Archivo .env
cd WAVAULT/backend
echo "GEMINI_API_KEY=tu_nueva_clave_aqui" > .env
source .env

# 4. Instalar dependencias
npm install
pip install -r requirements.txt

# 5. Iniciar servidor
node server.js

# 6. Acceder
# http://localhost:3000/upload-beat
```

---

## 📞 Troubleshooting - Problemas Comunes

### "GEMINI_API_KEY not found" o vacía

```bash
# Verificar que está configurada
echo $GEMINI_API_KEY

# Si está vacía, configurarla
export GEMINI_API_KEY="tu_clave_aqui"

# Verificar que la variable persista
bash -c 'echo $GEMINI_API_KEY'  # Debe mostrar la clave
```

### "Error 400: Invalid API key"

```bash
# Causas posibles:
# 1. Clave incompleta o con espacios
echo "$GEMINI_API_KEY" | wc -c  # Debe ser ~40 caracteres

# 2. Clave expirada o revocada
# Ve a: https://console.cloud.google.com/
# Verifica el estado en "APIs and Services" → "Credentials"

# 3. API no habilitada
# Ve a: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com
# Haz clic en "Enable"
```

### "Error 429: Too many requests"

```bash
# Alcanzaste el límite de cuota (60 req/min en free tier)
# Soluciones:
# 1. Esperar 1 minuto
# 2. Crear otra API Key en Google Cloud
# 3. Usar un plan pagado (https://aistudio.google.com/pricing)
```

### ".env no se carga automáticamente"

```bash
# Node.js no carga .env automáticamente
# Debes hacerlo manualmente:

# En server.js, agregar al inicio:
require('dotenv').config();

# O cargar en terminal:
source .env && node server.js

# O instalar dotenv:
npm install dotenv
```

---

## 📈 Monitoreo del Uso de API

### En Google Cloud Console

1. Ve a: https://console.cloud.google.com/
2. "APIs and Services" → "Quotas"
3. Filtra por "Generative Language API"
4. Verás:
   - Solicitudes hoy
   - Solicitudes este mes
   - % de cuota usada

### En logs de WAVAULT

```bash
# Revisar logs del servidor
tail -f /tmp/server.log

# Buscar errores de Gemini
grep -i "gemini" /tmp/server.log
grep -i "error" /tmp/server.log

# Contar llamadas a Gemini
grep -c "genai.configure" /tmp/server.log
```

---

## 🎓 Para Tu Tesis

### Puntos a Destacar

1. **API Key Management:** Importante en arquitectura de software
2. **Seguridad:** Variables de entorno vs código hardcoded
3. **Escalabilidad:** Cada entorno (dev/test/prod) puede usar su propia key
4. **Documentación:** Imprescindible para que otros desarrolladores usen el proyecto
5. **DevOps:** Gestión de secretos en CI/CD (GitHub Actions, etc.)

### Diagrama para Tu Tesis

```
┌──────────────────────────────────────────────┐
│ Google Cloud Console                         │
│ └─ Create API Key → AIzaSyC1x2y3z4a5b6c7... │
└────────────────┬─────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ↓                 ↓
┌──────────────────┐  ┌──────────────────┐
│ Variable Entorno │  │ Archivo .env     │
│ export GEMINI... │  │ GEMINI_API_KEY=  │
└────────┬─────────┘  └────────┬─────────┘
         │                     │
         └────────┬────────────┘
                  ↓
         ┌────────────────────┐
         │ WAVAULT Backend    │
         │ analyze_beat_ai.py │
         │ genai.configure()  │
         └────────┬───────────┘
                  ↓
         ┌────────────────────┐
         │ Gemini API Request │
         │ (análisis de audio)│
         └────────────────────┘
```

---

## 📚 Referencias Oficiales

- **Google Gemini Docs:** https://ai.google.dev/
- **API Key Setup:** https://makersuite.google.com/app/apikey
- **Google Cloud Console:** https://console.cloud.google.com/
- **Generative Language API:** https://developers.google.com/generative-ai/docs

---

## ✅ Checklist Final

- [ ] Obtuve una API Key en Google AI Studio
- [ ] Verifiqué que Generative Language API está habilitada
- [ ] Configuré la API Key en variable de entorno O archivo .env
- [ ] Testé que la key funciona con Python script
- [ ] Agregué .env a .gitignore
- [ ] Servidor Node.js inicia sin errores de API Key
- [ ] Puedo hacer upload de beats y ver análisis con IA
- [ ] Documenté los pasos para otros desarrolladores

---

**Última actualización:** Diciembre 10, 2025
**Versión:** 1.0
**Estado:** ✅ Listo para usar

