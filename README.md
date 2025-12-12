# 🎵 WAVAULT-V2 - Sistema de Análisis y Venta de Beats

![Status](https://img.shields.io/badge/status-Ready%20for%20Production-green)
![Version](https://img.shields.io/badge/version-1.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-v14+-green)
![Python](https://img.shields.io/badge/Python-3.8+-blue)

> **Sistema automático de análisis de beats musicales con tabla visual de confianza**

## ✨ Características Principales

### 🚀 Análisis Automático Obligatorio
- ✅ **SI O SI** - Sin toggle, sin opcionales
- ✅ Se ejecuta automáticamente al hacer upload
- ✅ Modal muestra resultados inmediatamente
- ✅ Tabla de confianza para cada parámetro

### 📊 Tabla de Confianza Visual
Muestra el nivel de certeza de cada campo detectado:
- **Nombre del Beat** - Extraído del nombre de archivo
- **Tipo de Beat** - Estilo/Tipo (Ej: Drake Type Beat)
- **Referencia/Artista** - Artista que inspira
- **Key (Tonalidad)** - Nota musical detectada
- **BPM** - Tempo del beat

Cada uno con:
- 📈 Porcentaje (0-100%)
- 🎨 Color visual (🟢 Verde / 🟡 Amarillo / �� Rojo)
- 📝 Label descriptivo (Alta/Media/Baja/No detectado)

### ✏️ Edición de Resultados
**Campos Editables (después del análisis):**
- `Key` - Con validación musical
- `BPM` - Rango 50-220
- `Mood` - Descripción libre
- `Tags` - Removibles con X

**Campos Readonly:**
- Nombre, Tipo, Referencia (extraídos del nombre)

### 🔒 Validaciones Estrictas
```
BPM: 50 - 220 (tempos realistas)
Key: [A-G] + sufijo (#, b, m, maj, min)
Estructura: "NOMBRE - TIPO - REF - KEY - BPM.mp3"
```

### 🏷️ Tags Inteligentes
- 18-30 tags generados por Gemini AI
- Web search enabled para contexto
- Removibles/editables por usuario

---

## 📁 Estructura del Proyecto

```
WAVAULT-V2/
├── WAVAULT/
│   ├── public/
│   │   ├── upload-beat-final.html    ← Frontend principal
│   │   ├── css/style.css
│   │   ├── js/main.js, client.js, producer.js
│   │   └── uploads/audio/, covers/
│   │
│   ├── backend/
│   │   ├── server.js                 ← Express API
│   │   ├── parse_filename_ai.py      ← Parser de metadata
│   │   ├── analyze_beat_ai.py        ← Análisis de audio
│   │   └── db.js
│   │
│   └── db.sqlite                     ← Base de datos
│
├── IMPLEMENTATION_SUMMARY.md         ← Resumen completo
├── SYSTEM_OVERVIEW.md                ← Arquitectura técnica
├── DEMO_VISUAL.md                    ← Ejemplos visuales
├── SETUP_AND_RUN.md                  ← Guía de ejecución
└── README.md                         ← Este archivo
```

---

## 🚀 Inicio Rápido (clonado fresco)

```bash
cd /workspaces/WAVAULT-V2

# 1) Instalar dependencias
npm install

# 2) Iniciar servidor
./start_server.sh

# 3) Abrir en navegador
# http://localhost:3000
```

Notas rápidas:
- El player global está simplificado a controles de reproducción/loop/volumen (playlist y shuffle deshabilitados).
- Si el puerto 3000 está ocupado, libera con `lsof -ti:3000 | xargs kill -9` antes de ejecutar el script.

---

## 📖 Documentación

| Documento | Contenido |
|-----------|-----------|
| **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** | Resumen técnico completo, arquitectura, flujo de datos |
| **[SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md)** | Detalles técnicos, validaciones, ejemplos |
| **[DEMO_VISUAL.md](./DEMO_VISUAL.md)** | Paso-a-paso visual, tabla de confianza, ejemplos |
| **[SETUP_AND_RUN.md](./SETUP_AND_RUN.md)** | Instalación, testing, troubleshooting |

---

## 🎯 Flujo de Uso

```
1. 📁 Upload    → 2. ⏳ Análisis (Auto)    → 3. ✏️ Editar (Opcional)    → 4. ✅ Guardar
   archivo         Extrae metadata,          Key, BPM, Mood                BD
                   analiza audio,            Tags
                   genera tags
```

---

## 📊 Tabla de Confianza

```
┌──────────────────────┬────────┬──────────────────┐
│ Parámetro            │ Confza │ Estado           │
├──────────────────────┼────────┼──────────────────┤
│ Nombre del Beat      │  95%   │ ✅ Alta confza   │
│ Tipo de Beat         │  90%   │ ✅ Alta confza   │
│ Referencia/Artista   │  80%   │ ✅ Alta confza   │
│ Key                  │  85%   │ ✅ Alta confza   │
│ BPM                  │  85%   │ ✅ Alta confza   │
└──────────────────────┴────────┴──────────────────┘

🟢 Verde >80%    ✅ Alta confianza
🟡 Amarillo 60-80% ⚡ Confianza media
🔴 Rojo <60%    ⚠️ Baja confianza
```

---

## 🔍 Ejemplo

```
INPUT:
Tropical Vibes - Drake Type Beat - Drake - Fm - 90.mp3

OUTPUT:
✅ beat_name: "Tropical Vibes" (95%)
✅ beat_type: "Drake Type Beat" (90%)
✅ reference: "Drake" (80%)
✅ key: "Fm" (85%)
✅ bpm: 90 (85%)
🏷️ tags: [Drake, Hip-Hop, Dark, Atmospheric, ...]
```

---

## ��️ Tecnologías

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Node.js, Express.js
- **IA:** Python, Gemini 2.0 Flash, Librosa
- **BD:** SQLite

---

## ✅ Características Implementadas

- [x] Análisis automático (SI O SI)
- [x] Tabla de confianza visual
- [x] Validación de BPM (50-220)
- [x] Validación de Key (notas musicales)
- [x] Campos editables
- [x] Tags removibles
- [x] Generación de tags con IA
- [x] Guardado en SQLite
- [x] Estilos profesionales
- [x] Responsive design

---

## 📚 Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `public/upload-beat-final.html` | Frontend + Modal + Tabla |
| `backend/server.js` | Express API |
| `backend/parse_filename_ai.py` | Extracción de metadata |
| `backend/analyze_beat_ai.py` | Análisis de audio |

---

## 🚀 Status

**✅ LISTO PARA PRODUCCIÓN**

Versión 1.0 - 2024

---

Para más información, ver documentación en archivos `.md`
