# 🚀 GUÍA DE EJECUCIÓN - WAVAULT V2 Beat Upload System

## Inicio Rápido

### 1. Requisitos Previos
```bash
# Verificar que Node.js esté instalado
node --version  # Debe ser v14+ 

# Verificar que Python esté instalado
python3 --version  # Debe ser 3.8+

# Verificar que SQLite esté instalado
sqlite3 --version
```

### 2. Instalación de Dependencias
```bash
cd /workspaces/WAVAULT-V2/WAVAULT

# Instalar dependencias de Node.js
npm install

# O si tienes yarn:
yarn install
```

### 3. Configuración de Variables de Entorno
```bash
# Crear archivo .env en WAVAULT/backend/.env
echo "GEMINI_API_KEY=tu_clave_aqui" > backend/.env

# O editar manualmente:
nano backend/.env

# Debe contener:
GEMINI_API_KEY=sk-...
```

### 4. Inicializar Base de Datos
```bash
# El sistema crea la BD automáticamente si no existe
# Pero puedes resetear si es necesario:
cd backend
node reset-db.js
```

### 5. Ejecutar el Servidor
```bash
cd /workspaces/WAVAULT-V2/WAVAULT

# Opción 1: Ejecución simple
npm start
# O manualmente:
node backend/server.js

# Opción 2: Ejecución con nodemon (auto-reload)
npm run dev
```

### 6. Acceder a la Aplicación
```
URL: http://localhost:3000/upload-beat
```

---

## Flujo de Testing Recomendado

### Test 1: Formulario Básico
```
1. Ir a http://localhost:3000/upload-beat
2. Observar la estructura del formulario
3. Nota: Estructura esperada mostrada en la página
```

### Test 2: Upload de Beat con Nombre Válido
```
ARCHIVO DE PRUEBA:
"Tropical Vibes - Drake Type Beat - Drake - Fm - 90.mp3"

PASOS:
1. Hacer clic en área de upload o arrastra el archivo
2. Esperar a que se muestre el nombre del archivo
3. Ingresar Precio: 250
4. Hacer clic en "Cargar y Analizar"
5. ✅ Modal debe abrirse automáticamente
6. ✅ Spinner debe mostrarse durante análisis (3-5 seg)
7. ✅ Tabla de Confianza debe llenarse con datos
```

### Test 3: Verificar Tabla de Confianza
```
VERIFICACIONES:
1. ✅ Tabla tiene 5 filas (Nombre, Tipo, Referencia, Key, BPM)
2. ✅ Columnas: Parámetro | Confianza | Estado
3. ✅ Porcentajes son números (80%, 90%, etc)
4. ✅ Colores:
   - Verde: >80% (Alta confianza)
   - Amarillo: 60-80% (Confianza media)
   - Rojo: <60% (Baja confianza)
5. ✅ Iconos: ✅ ⚡ ⚠️ ❓
```

### Test 4: Verificar Campos Editable vs Readonly
```
CAMPOS READONLY (Gris, no editable):
- Nombre del Beat: "Tropical Vibes"
- Tipo de Beat: "Drake Type Beat"
- Referencia/Artista: "Drake"

CAMPOS EDITABLE (Blanco, editable):
- Key: "Fm" (puede cambiar)
- BPM: "90" (puede cambiar)
- Mood: "Dark & Atmospheric" (puede cambiar)

INTENTA EDITAR:
- Haz click en Nombre del Beat → No debería permitir edición
- Haz click en BPM → Debería permitir edición
```

### Test 5: Editar Valores
```
EDITAR BPM:
1. Haz clic en campo BPM
2. Cambia "90" a "100"
3. Presiona Tab o clic fuera
4. ✅ Debe aceptar (100 está en rango 50-220)

EDITAR BPM INVÁLIDO:
1. Cambia BPM a "40"
2. Presiona "Aceptar y Continuar"
3. ✅ Debe mostrar error: "BPM debe estar entre 50 y 220"

EDITAR KEY:
1. Cambia "Fm" a "Cmaj"
2. Presiona "Aceptar y Continuar"
3. ✅ Debe aceptar (Cmaj es válida)

EDITAR KEY INVÁLIDO:
1. Cambia "Fm" a "XYZ"
2. Presiona "Aceptar y Continuar"
3. ✅ Debe mostrar error: "Key no válida"
```

### Test 6: Remover Tags
```
PASOS:
1. En sección "TAGS SUGERIDOS" busca un tag
2. Haz clic en la X del tag (Ej: [Drake] ✕)
3. ✅ Tag debe desaparecer
4. Confirma en consola que se removió correctamente
```

### Test 7: Aceptar y Guardar
```
PASOS:
1. Asegúrate que todos los campos sean válidos
2. Presiona "✅ Aceptar y Continuar"
3. ✅ Modal debe cerrarse
4. ✅ Mensaje: "✅ ¡Beat guardado exitosamente!"
5. ✅ Formulario se resetea
```

### Test 8: Verificar en BD
```
CONSULTAR DATOS GUARDADOS:
cd /workspaces/WAVAULT-V2/WAVAULT/backend

# Abrir SQLite
sqlite3 ../db.sqlite

# Ver todos los beats:
SELECT beat_name, beat_type, reference, key, bpm FROM beats LIMIT 5;

# Ver última entrada:
SELECT * FROM beats ORDER BY id DESC LIMIT 1;

# Salir:
.quit
```

---

## Troubleshooting

### Error: "GEMINI_API_KEY not found"
```
SOLUCIÓN:
1. Verificar que .env existe en backend/
2. Ejecutar: export GEMINI_API_KEY="tu_clave"
3. O agregar a .env: GEMINI_API_KEY=sk-...
```

### Error: "Puerto 3000 ya está en uso"
```
SOLUCIÓN:
# Opción 1: Usar otro puerto
PORT=3001 npm start

# Opción 2: Matar proceso existente
lsof -ti:3000 | xargs kill -9
npm start

# Opción 3: Cambiar en server.js
// Busca: const port = 3000;
// Cambia a: const port = 3001;
```

### Modal no se abre automáticamente
```
VERIFICACIÓN:
1. Ver consola del navegador (F12 → Console)
2. Ver consola del servidor (terminal)
3. Revisar que el archivo es válido:
   - Debe ser MP3/WAV/FLAC
   - Debe tener estructura correcta
4. Verificar que /api/parse-filename responde
```

### Análisis toma más de 10 segundos
```
NORMAL:
- Primer análisis: 3-5 segundos
- Cache posterior: <1 segundo

SI TOMA MÁS:
1. Verificar conexión de red
2. Verificar que Gemini API está respondiendo
3. Ver logs del servidor
```

### Tabla de Confianza no se muestra
```
VERIFICACIÓN:
1. Abrir Inspector (F12)
2. Buscar elemento: <tbody id="confidenceTable">
3. Ver si está vacio o tiene filas
4. Si está vacío: Revisar función updateConfidenceTable()
5. Verificar consola por errores JavaScript
```

### BPM no se valida
```
VERIFICACIÓN:
1. Asegurar que es número (no string)
2. Rango correcto: parseInt(value) >= 50 && <= 220
3. Revisar validación en JavaScript:
   function acceptAnalysis() {
     const bpmValue = parseInt(document.getElementById('bpmField').value);
     if (bpmValue < 50 || bpmValue > 220) { ... }
   }
```

---

## Archivos Clave

### Frontend
```
WAVAULT/public/upload-beat-final.html
├─ HTML: Estructura del formulario y modal
├─ CSS: Estilos de tabla, badges, campos
├─ JavaScript: Lógica de análisis y validación
└─ Total: ~1050 líneas
```

### Backend - Node.js
```
WAVAULT/backend/server.js
├─ GET /upload-beat → Sirve HTML
├─ POST /api/parse-filename → Extrae metadata
├─ POST /api/analyze-beat → Análisis de audio
├─ POST /upload-beat → Guarda en BD
└─ Total: ~677 líneas
```

### Backend - Python
```
WAVAULT/backend/parse_filename_ai.py
├─ Función: parseFilename()
├─ Extrae: beat_name, beat_type, reference, key, bpm
├─ Calcula: confianza para cada campo
└─ Validaciones: Estructura, BPM 50-220, Key válida

WAVAULT/backend/analyze_beat_ai.py
├─ Función: analyzeBeat()
├─ Extrae: key, bpm, duration (audio)
├─ Genera: mood, tags con Gemini
└─ Output: JSON con technical_data + ai_inference
```

### Database
```
WAVAULT/db.sqlite (SQLite)
├─ Tabla: beats
├─ Campos: beat_name, beat_type, reference, key, bpm, mood, tags, price, audio_url
└─ Creación: Automática en primer uso

WAVAULT/backend/db.js
├─ Conexión a SQLite
├─ Métodos: insertBeat(), getBeat(), getAllBeats()
└─ Queries SQL preparadas
```

---

## Estructura de Respuesta API

### POST /api/parse-filename
```json
{
  "beat_name": "Tropical Vibes",
  "beat_type": "Drake Type Beat",
  "reference": "Drake",
  "key": "Fm",
  "bpm": 90,
  "beat_name_confidence": 95,
  "beat_type_confidence": 90,
  "reference_confidence": 80,
  "key_confidence": 85,
  "bpm_confidence": 85
}
```

### POST /api/analyze-beat
```json
{
  "success": true,
  "analysis": {
    "technical_data": {
      "key": "Fm",
      "key_confidence": 85,
      "bpm": 90,
      "bpm_confidence": 85,
      "duration": 120
    },
    "ai_inference": {
      "mood": "Dark & Atmospheric",
      "tags": ["Drake", "Hip-Hop", "Dark", ...]
    }
  }
}
```

---

## Logs Esperados

### Servidor iniciando
```
✅ Servidor ejecutándose en puerto 3000
✅ Base de datos conectada: db.sqlite
✅ Esperando conexiones...
```

### Análisis en progreso
```
📋 Parseando nombre: Tropical Vibes - Drake Type Beat - Drake - Fm - 90.mp3
🎵 Analizando beat: [archivo]
🏷️ Generando tags con Gemini...
✅ Análisis completado
```

---

## Testing Automatizado

### Ejecutar tests del parser
```bash
cd /workspaces/WAVAULT-V2/WAVAULT/backend
python3 -m pytest parse_filename_ai.py -v
```

### Test manual del parser
```bash
python3 parse_filename_ai.py "Tropical Vibes - Drake Type Beat - Drake - Fm - 90.mp3"
# Esperado: JSON con todos los campos
```

---

## Performance Tips

```
OPTIMIZACIONES:
1. Cache de resultados: Beats ya analizados se caché
2. Compresión: Archivos audio comprimidos en MP3
3. CDN: Servir archivos estáticos desde CDN
4. Database: Indices en beat_name, reference, key

MONITOREO:
- Ver tiempo de respuesta en Dev Tools (F12)
- Esperar 3-5 segundos en primer análisis
- <1 segundo en análisis posteriores
```

---

## Deployment

### Desarrollo Local
```bash
npm start
# Activo en http://localhost:3000
```

### Production
```bash
# 1. Compilar/optimizar
npm run build

# 2. Ejecutar en background
nohup npm start > server.log 2>&1 &

# 3. Usar PM2 (recomendado)
pm2 start "npm start" --name "wavault"
pm2 startup
pm2 save
```

---

## Resumen Rápido

| Aspecto | Detalles |
|---------|----------|
| **Puerto** | 3000 |
| **URL** | http://localhost:3000/upload-beat |
| **BD** | SQLite (db.sqlite) |
| **Python** | 3.8+ |
| **Node.js** | v14+ |
| **Tiempo Análisis** | 3-5 segundos |
| **Formato Esperado** | "NOMBRE - TIPO - REF - KEY - BPM.mp3" |
| **Validaciones** | BPM 50-220, Key musical válida |

---

**Estado:** ✅ LISTO PARA PRODUCCIÓN
**Última Actualización:** 2024
**Soporte:** Ver SYSTEM_OVERVIEW.md para más detalles
