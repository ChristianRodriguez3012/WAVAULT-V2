# 🎬 DEMO VISUAL - WAVAULT Beat Upload System

## Flujo Completo del Sistema

### PASO 1: Formulario de Upload
```
┌─────────────────────────────────────────────────────────────┐
│                  CARGAR UN BEAT AL MERCADO                  │
└─────────────────────────────────────────────────────────────┘

📝 INFORMACIÓN DEL PRODUCTOR:
├─ Nombre de Usuario: [username]
└─ (Obtenido de sesión autenticada)

📁 SELECCIONA TU BEAT:
├─ Arrastra aquí o haz clic para cargar
├─ Formatos soportados: MP3, WAV, FLAC
└─ ⚠️ Estructura recomendada: "NOMBRE - TIPO - REFERENCIA - KEY - BPM.mp3"

💰 INFORMACIÓN DE VENTA:
├─ Precio: [250] USD
├─ Descripción: [Beat de Hip-Hop oscuro con] (opcional)
└─ Categoría: [Seleccionar]

📋 ESTRUCTURA ESPERADA DEL NOMBRE:
├─ NOMBRE: El nombre del beat (Ej: "Tropical Vibes")
├─ TIPO: Estilo/Tipo (Ej: "Drake Type Beat")
├─ REFERENCIA: Artista que inspira (Ej: "Drake")
├─ KEY: Tonalidad musical (Ej: "Fm")
└─ BPM: Tempo (Ej: "90")

EJEMPLO VÁLIDO:
"Tropical Vibes - Drake Type Beat - Drake - Fm - 90.mp3"
                 ↑                      ↑      ↑   ↑   ↑
            NOMBRE             TIPO  REFERENCIA KEY BPM

[ 🚀 CARGAR Y ANALIZAR ] ← PRESIONAR
```

---

### PASO 2: Modal Se Abre Automáticamente
```
┌──────────────────────────────────────────────────────────────┐
│ 🎼 Análisis de Beat                                  [X]     │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  ⏳ Analizando archivo... (Spinner rotando)                   │
│                                                                │
│  📊 Procesando:                                               │
│  ├─ Extrayendo metadata del nombre...                        │
│  ├─ Analizando características de audio...                   │
│  └─ Generando tags sugeridos...                              │
│                                                                │
│  ⏱️  Tiempo estimado: 3-5 segundos                            │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

---

### PASO 3: Modal Muestra Resultados + TABLA DE CONFIANZA

```
┌──────────────────────────────────────────────────────────────┐
│ 🎼 Análisis de Beat                                  [X]     │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  📋 Flujo de Análisis:                                        │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ ✅ OBLIGATORIO: Este análisis se ejecuta automáticamente│  │
│  │ ✏️ OPCIONAL: Puedes editar Key, BPM y Mood             │  │
│  │ 🏷️ OPCIONAL: Puedes remover tags                       │  │
│  │ ✓ Después de aceptar, la plantilla se completará        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃ 📊 RESUMEN DE CONFIANZA                               ┃  │
│  ┣━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━┫  │
│  ┃ Parámetro         ┃ Confza. ┃ Estado              ┃  │
│  ┣━━━━━━━━━━━━━━━━━━━╋━━━━━━━━━╋━━━━━━━━━━━━━━━━━━━━━┫  │
│  ┃ Nombre del Beat   ┃  95%    ┃ ✅ Alta confianza  ┃  │
│  ┃ Tipo de Beat      ┃  90%    ┃ ✅ Alta confianza  ┃  │
│  ┃ Referencia/Artist ┃  80%    ┃ ✅ Alta confianza  ┃  │
│  ┃ Key               ┃  85%    ┃ ✅ Alta confianza  ┃  │
│  ┃ BPM               ┃  85%    ┃ ✅ Alta confianza  ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━┻━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━━━┛  │
│                                                                │
│  📝 METADATOS DEL NOMBRE (Solo lectura - Extractado)        │
│                                                                │
│  Nombre del Beat:                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Tropical Vibes                   ✅ 95% Alta confza.│  │
│  └──────────────────────────────────────────────────────┘  │
│                                                                │
│  Tipo de Beat:                                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Drake Type Beat                  ✅ 90% Alta confza.│  │
│  └──────────────────────────────────────────────────────┘  │
│                                                                │
│  Referencia/Artista:                                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Drake                            ✅ 80% Alta confza.│  │
│  └──────────────────────────────────────────────────────┘  │
│                                                                │
│  🎵 ANÁLISIS DE AUDIO (Editable - Del archivo)              │
│                                                                │
│  Key (Tonalidad):                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ [Fm                              │ ✅ 85% A.confza.│  │
│  └──────────────────────────────────────────────────────┘  │
│   Formato: C, Cm, C#, Db, Cmaj, Cmin                         │
│                                                                │
│  BPM (Tempo):                                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ [90                              │ ✅ 85% A.confza.│  │
│  └──────────────────────────────────────────────────────┘  │
│   Rango válido: 50 - 220 BPM                                 │
│                                                                │
│  Mood (Atmósfera):                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ [Dark & Atmospheric              │ ⚡ 70% Med.confza│  │
│  └──────────────────────────────────────────────────────┘  │
│   Descripción del vibe del beat                              │
│                                                                │
│  🏷️ TAGS SUGERIDOS (Removible - Generados por IA)            │
│                                                                │
│  [Drake] [Hip-Hop] [Dark] [Atmospheric] [Type Beat]          │
│  [Trap] [2024] [Production] [Beats] [Travis Scott]           │
│  [Urban] [Street] [Vibe] [Smooth] [Melodic]                  │
│  [Energetic] [Wavy] [Ambient] ... (18-30 tags totales)       │
│                                                                │
│  Cada tag tiene una X para removerlo: [Drake] ✕               │
│                                                                │
├──────────────────────────────────────────────────────────────┤
│ ❌ Rechazar y Re-analizar    ✅ Aceptar y Continuar          │
└──────────────────────────────────────────────────────────────┘

LEYENDA DE COLORES:
┌─────────────────────────────────────────────────────┐
│ 🟢 Verde:   >80%   ✅ Alta confianza                │
│ 🟡 Amarillo: 60-80% ⚡ Confianza media              │
│ 🔴 Rojo:    <60%   ⚠️ Baja confianza               │
│ ⚪ Gris:    0%     ❓ No detectado                  │
└─────────────────────────────────────────────────────┘
```

---

### PASO 4: Usuario Edita (OPCIONAL)

```
✏️ USUARIO PUEDE EDITAR:
├─ Key: Cambiar de "Fm" a "Bb" si prefiere
├─ BPM: Cambiar de "90" a "100" si es más preciso
├─ Mood: Cambiar descripción de la atmósfera
└─ Tags: Remover tags que no correspondan

✅ USUARIO NO PUEDE EDITAR (readonly):
├─ Nombre del Beat (extraído del archivo)
├─ Tipo de Beat (extraído del archivo)
└─ Referencia/Artista (extraído del archivo)

⚠️ VALIDACIONES AL EDITAR:
├─ BPM: Debe estar entre 50 y 220
├─ Key: Debe ser válida (C, Cm, C#, Db, etc)
└─ Campos requeridos: Key debe tener valor
```

---

### PASO 5: Usuario Acepta

```
✅ USUARIO PRESIONA "Aceptar y Continuar"
   ↓
🔍 Sistema valida datos editados:
   ├─ BPM entre 50-220 ✅
   ├─ Key válida ✅
   └─ Campos requeridos completos ✅
   ↓
💾 Se guardan en la base de datos:
   ├─ beat_name: "Tropical Vibes"
   ├─ beat_type: "Drake Type Beat"
   ├─ reference: "Drake"
   ├─ key: "Fm"
   ├─ bpm: 90
   ├─ mood: "Dark & Atmospheric"
   ├─ tags: "Drake,Hip-Hop,Dark,..."
   ├─ price: 250
   └─ audio_file: [archivo guardado]
   ↓
✅ Mensaje de éxito: "¡Beat guardado exitosamente!"
   ↓
📋 Modal se cierra
   ↓
🔄 Formulario se resetea para nuevo beat
```

---

## 📊 Tabla de Confianza Expandida

### Ejemplo 1: Beat con Alta Confianza General
```
┏━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━┓
┃ Parámetro         ┃ Confza. ┃ Estado              ┃
┡━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━┩
│ Nombre del Beat   │ 95%     │ ✅ Alta confianza   │
│ Tipo de Beat      │ 90%     │ ✅ Alta confianza   │
│ Referencia/Artist │ 85%     │ ✅ Alta confianza   │
│ Key               │ 88%     │ ✅ Alta confianza   │
│ BPM               │ 92%     │ ✅ Alta confianza   │
└───────────────────┴─────────┴─────────────────────┘

SCORE GENERAL: 90% (Muy bueno - Analizar con confianza)
```

### Ejemplo 2: Beat Parcialmente Detectado
```
┏━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━┓
┃ Parámetro         ┃ Confza. ┃ Estado              ┃
┡━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━┩
│ Nombre del Beat   │ 80%     │ ✅ Alta confianza   │
│ Tipo de Beat      │ 70%     │ ⚡ Confianza media   │
│ Referencia/Artist │ 0%      │ ❓ No detectado      │
│ Key               │ 75%     │ ⚡ Confianza media   │
│ BPM               │ 88%     │ ✅ Alta confianza   │
└───────────────────┴─────────┴─────────────────────┘

SCORE GENERAL: 62% (Puedes editar manualmente)
→ Usuario puede agregar Referencia/Artista manualmente
```

### Ejemplo 3: Beat Mal Nombrado
```
┏━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━┓
┃ Parámetro         ┃ Confza. ┃ Estado              ┃
┡━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━┩
│ Nombre del Beat   │ 45%     │ ⚠️ Baja confianza    │
│ Tipo de Beat      │ 30%     │ ⚠️ Baja confianza    │
│ Referencia/Artist │ 0%      │ ❓ No detectado      │
│ Key               │ 0%      │ ❓ No detectado      │
│ BPM               │ 0%      │ ❓ No detectado      │
└───────────────────┴─────────┴─────────────────────┘

SCORE GENERAL: 15% (Recomendado: "Rechazar y Re-analizar")
→ Usuario debería renombrar el archivo correctamente
→ Estructura esperada: "NOMBRE - TIPO - REFERENCIA - KEY - BPM"
```

---

## 🎨 Estados Visuales de la Tabla

### Antes del Análisis
```
┏━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━┓
┃ Parámetro         ┃ Confza. ┃ Estado              ┃
┡━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━┩
│ (vacío - cargando)                                 │
└───────────────────┴─────────┴─────────────────────┘

Estado: Spinner rotando, texto "Analizando..."
```

### Durante el Análisis
```
Estado: Modal muestra "Procesando..." con indicador de carga
- Spinner ⟳ animado
- Texto: "Extrayendo metadata..."
- Texto: "Analizando características de audio..."
- Texto: "Generando tags sugeridos..."
```

### Después del Análisis
```
┏━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━┓
┃ Parámetro         ┃ Confza. ┃ Estado              ┃
┡━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━┩
│ Nombre del Beat   │ 95%     │ ✅ Alta confianza   │
│ Tipo de Beat      │ 90%     │ ✅ Alta confianza   │
│ Referencia/Artist │ 80%     │ ✅ Alta confianza   │
│ Key               │ 85%     │ ✅ Alta confianza   │
│ BPM               │ 85%     │ ✅ Alta confianza   │
└───────────────────┴─────────┴─────────────────────┘

Todos los campos pobladoscon datos y confianza
Colores: Verde para alta, Amarillo para media, Rojo para baja
```

---

## 🖱️ Interacciones del Usuario

### Click en X de un Tag
```
ANTES: [Drake] [Hip-Hop] [Dark] [Atmospheric]
       (Usuario hace click en X de "Dark")
DESPUÉS: [Drake] [Hip-Hop] [Atmospheric]
```

### Editar Campo de BPM
```
ANTES: [90]
       (Usuario selecciona y cambia)
DESPUÉS: [100]
       (Sistema valida: 100 está entre 50-220 ✅)
```

### Editar Campo de Key Inválido
```
USUARIO INTENTA: "Hello" (inválido)
SISTEMA RECHAZA: ❌ "Key no válida. Ej: C, Cm, C#, Db"
USUARIO INTENTA: "F#min"
SISTEMA ACEPTA: ✅ "Key válida"
```

---

## 📱 Responsive Design

### Desktop (>992px)
```
┌─────────────────────────────────────────────────────────┐
│ Modal centrado - 800px de ancho                         │
│ Tabla con 3 columnas claramente distribuidas           │
│ Todo el contenido visible sin scroll                   │
└─────────────────────────────────────────────────────────┘
```

### Tablet (768px - 991px)
```
┌─────────────────────────────────────────────────────────┐
│ Modal 90% del ancho                                     │
│ Tabla con columns ligeramente apretadas                │
│ Scroll mínimo si es necesario                          │
└─────────────────────────────────────────────────────────┘
```

### Mobile (<768px)
```
┌──────────────────────────────────┐
│ Modal 100% - 20px de margen      │
│ Tabla responsiva:                │
│ - Columnas empiladas o scroll    │
│ - Font más pequeño pero legible  │
│ - Botones full-width             │
└──────────────────────────────────┘
```

---

## ✅ Checklist de Testing

```
FORMULARIO INICIAL:
☐ Carga correctamente
☐ Permite arrastrar archivos
☐ Click abre file picker
☐ Muestra nombre del archivo seleccionado
☐ Valida precio > 0
☐ Botón "Cargar y Analizar" funciona

MODAL DE ANÁLISIS:
☐ Se abre automáticamente
☐ Muestra spinner durante carga
☐ Tabla de confianza se llena correctamente
☐ Colores correctos (verde/amarillo/rojo)
☐ Campos readonly no son editables (gris)
☐ Campos editables aceptan input (blanco)

EDICIÓN DE CAMPOS:
☐ Key: Valida rango musical
☐ BPM: Valida 50-220
☐ Mood: Acepta texto libre
☐ Tags: X button remueve tags

ACEPTACIÓN:
☐ Botón "Aceptar" recolecta datos finales
☐ Validaciones pasan
☐ Se guarda en BD correctamente
☐ Mensaje de éxito aparece
☐ Modal se cierra
```

---

**Estado:** ✅ LISTO PARA PRODUCCIÓN
**Última Revisión:** 2024
**Testing:** Recomendado en navegador real
