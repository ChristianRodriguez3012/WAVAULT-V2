# 🔑 Configurar Análisis IA con Gemini

## El sistema ahora tiene dos modos:

### ✅ Modo Manual (Actual)
- Subes el audio
- Completas los metadatos manualmente
- Funciona sin configuración adicional

### 🤖 Modo IA Automático (Requiere API Key)

Para activar el análisis automático con IA:

## Paso 1: Obtener API Key de Gemini

1. Ve a: https://aistudio.google.com/app/apikey
2. Crea una nueva API key (gratis)
3. Copia la clave generada

## Paso 2: Configurar en el servidor

```bash
# Opción A: Variable de entorno temporal (actual sesión)
export GEMINI_API_KEY="tu-api-key-aqui"

# Opción B: Variable de entorno permanente (agregar a ~/.bashrc)
echo 'export GEMINI_API_KEY="tu-api-key-aqui"' >> ~/.bashrc
source ~/.bashrc

# Opción C: Crear archivo .env en /workspaces/WAVAULT-V2/WAVAULT/backend/
echo "GEMINI_API_KEY=tu-api-key-aqui" > /workspaces/WAVAULT-V2/WAVAULT/backend/.env
```

## Paso 3: Reiniciar el servidor

```bash
cd /workspaces/WAVAULT-V2/WAVAULT/backend
node server.js
```

## Una vez configurado, el análisis IA detectará automáticamente:

- 🎵 BPM (tempo)
- 🎹 Tonalidad (key/escala)
- 🎸 Género musical
- 😊 Mood/emoción
- ⚡ Nivel de energía
- 🎼 Instrumentos principales
- 📊 Nivel de confianza por cada metadato

## Solución de problemas

### Si sigue sin funcionar:

```bash
# Verificar que Python esté instalado
python3 --version

# Verificar que el script exista
ls -la /workspaces/WAVAULT-V2/WAVAULT/backend/analyze_beat_ai.py

# Ver logs del servidor al subir un beat
# (aparecerán en la terminal donde corre node server.js)
```

### Instalar dependencias de Python si es necesario:

```bash
cd /workspaces/WAVAULT-V2/WAVAULT/backend
pip3 install -r requirements.txt
```

---

💡 **Nota**: El sistema funciona perfectamente sin la API key, solo tendrás que completar los metadatos manualmente.
