# 🔧 Configuración de la API de Google Gemini

Este documento describe cómo se ha configurado la API de Google Gemini en WAVAULT-V2.

## ✅ Configuración Completada

### 1. API Key de Google Gemini
La API Key de Google Gemini ha sido configurada exitosamente:
```
AIzaSyBqreeolm2eh4e0SIoELyDGRT4EaT81aI4
```

### 2. Archivo de Configuración (.env)
Se ha creado el archivo `.env` en `/WAVAULT/backend/.env` con las siguientes variables:

```bash
# Google Gemini API Configuration
GEMINI_API_KEY=AIzaSyBqreeolm2eh4e0SIoELyDGRT4EaT81aI4

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 3. Dependencias Instaladas

#### Node.js Dependencies
- ✅ express@5.1.0
- ✅ body-parser@2.2.0
- ✅ multer@2.0.1
- ✅ sqlite3@5.1.7
- ✅ fluent-ffmpeg@2.1.3
- ✅ dotenv@17.2.3

#### Python Dependencies
- ✅ librosa (análisis de audio)
- ✅ numpy (cálculos numéricos)
- ✅ scipy (procesamiento científico)
- ✅ google-generativeai (API de Gemini)
- ✅ requests (HTTP requests)
- ✅ beautifulsoup4 (web scraping)
- ✅ selenium (automatización web)
- ✅ webdriver-manager (gestión de drivers)

### 4. Protección de Datos Sensibles
Se ha creado un archivo `.gitignore` en la raíz del proyecto para prevenir que datos sensibles sean comprometidos:
- `.env` files
- `node_modules/`
- `__pycache__/`
- Archivos de base de datos
- Uploads

## 🚀 Cómo Iniciar la Aplicación

### Opción 1: Usando el script de inicio
```bash
./start_server.sh
```

### Opción 2: Manualmente
```bash
cd WAVAULT/backend
node server.js
```

El servidor se iniciará en `http://localhost:3000`

## 🔍 Verificación

Para verificar que la API está configurada correctamente:

```bash
cd WAVAULT/backend
node -e "require('dotenv').config(); console.log('API Key:', process.env.GEMINI_API_KEY ? 'Configurada ✅' : 'NO configurada ❌');"
```

## 📋 Características Disponibles

Con la API de Google Gemini configurada, la aplicación puede:

1. **Análisis Automático de Beats**
   - Detección de BPM
   - Identificación de tonalidad (key)
   - Detección de mood/emoción
   - Clasificación de género musical
   - Nivel de energía

2. **Extracción de Metadatos**
   - Parseo inteligente de nombres de archivo
   - Identificación de artista de referencia
   - Tipo de beat

3. **Enriquecimiento de Metadatos**
   - Búsqueda web con Gemini
   - Generación de tags relevantes (18-30 tags)
   - Sugerencias contextuales

## 🔐 Seguridad

- La API Key está almacenada en el archivo `.env` que está excluido del control de versiones
- Las variables de entorno se cargan automáticamente al iniciar el servidor
- El script `start_server.sh` tiene un fallback por si no existe el archivo `.env`

## 📝 Notas Importantes

1. **Modo Manual vs IA**: La aplicación funciona perfectamente sin la API key configurada, en cuyo caso los metadatos deben completarse manualmente.

2. **Límites de API**: Google Gemini tiene límites de uso gratuito. Monitorea tu uso en: https://aistudio.google.com/

3. **Actualizaciones**: Si necesitas cambiar la API key, simplemente edita el archivo `.env` y reinicia el servidor.

## 🆘 Solución de Problemas

### El servidor no inicia
```bash
# Verificar dependencias de Node.js
npm install

# Verificar dependencias de Python
cd WAVAULT/backend
pip3 install -r requirements.txt
```

### La API no funciona
```bash
# Verificar que la API key está cargada
cd WAVAULT/backend
node -e "require('dotenv').config(); console.log(process.env.GEMINI_API_KEY);"
```

### Error de permisos en start_server.sh
```bash
chmod +x start_server.sh
```

## 📞 Soporte

Para más información sobre la API de Gemini:
- Documentación: https://ai.google.dev/docs
- Consola: https://aistudio.google.com/
