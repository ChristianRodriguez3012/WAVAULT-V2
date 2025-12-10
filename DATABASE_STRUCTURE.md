# Estructura de Base de Datos - WAVAULT

## Tabla: `beats`

### Columnas (15 campos):

| # | Nombre | Tipo | NOT NULL | Default | Descripción |
|---|--------|------|----------|---------|-------------|
| 0 | `id` | INTEGER | ✓ | AUTO | ID único del beat |
| 1 | `title` | TEXT | ✓ | - | Nombre del beat |
| 2 | `price` | REAL | ✓ | - | Precio en USD |
| 3 | `cover` | TEXT | ✓ | - | Ruta imagen portada |
| 4 | `audio` | TEXT | ✓ | - | Ruta archivo audio |
| 5 | `demo` | TEXT | - | NULL | Ruta demo con watermark |
| 6 | `producer` | TEXT | ✓ | - | Email del productor |
| 7 | `tags` | TEXT | - | NULL | Tags separados por comas |
| 8 | `bpm` | INTEGER | - | NULL | Beats por minuto |
| 9 | `key` | TEXT | - | NULL | Tonalidad musical |
| 10 | `artist` | TEXT | - | 'Unknown Artist' | Artista/Referencia |
| 11 | `type` | TEXT | - | NULL | Género/Tipo de beat |
| 12 | `mood` | TEXT | - | NULL | Estado de ánimo |
| 13 | `description` | TEXT | - | NULL | Descripción del beat |
| 14 | `created_at` | DATETIME | - | NULL | Fecha de creación |

## Tabla: `usuarios`

| # | Nombre | Tipo | Restricciones |
|---|--------|------|---------------|
| 0 | `id` | INTEGER | PRIMARY KEY |
| 1 | `email` | TEXT | UNIQUE NOT NULL |
| 2 | `password` | TEXT | NOT NULL |
| 3 | `rol` | TEXT | CHECK (cliente/productor) |

## Tabla: `ventas`

| # | Nombre | Tipo | Restricciones |
|---|--------|------|---------------|
| 0 | `id` | INTEGER | PRIMARY KEY |
| 1 | `beat_id` | INTEGER | FK → beats(id) |
| 2 | `comprador_email` | TEXT | NOT NULL |
| 3 | `fecha` | DATETIME | DEFAULT CURRENT_TIMESTAMP |

---

## Mapeo Frontend → Backend → DB

### Upload Form (producer.html):
```
beat_name     → title
reference     → artist
beat_type     → type
keyField      → key
bpmField      → bpm
moodField     → mood
price         → price
tags          → tags
description   → description
audioFile     → audio (path)
coverImage    → cover (path)
producer      → producer (email)
ai_analysis   → (metadata only)
```

### Validaciones:

**Campos obligatorios en frontend:**
- ✅ beat_name
- ✅ beat_type
- ✅ key
- ✅ bpm
- ✅ price
- ✅ audio file
- ✅ cover image

**Campos obligatorios en DB:**
- title
- price
- cover (ahora obligatorio)
- audio
- producer

---

## Estado Actual: ✅

- [x] Tabla `beats` con todas las columnas necesarias
- [x] Columna `artist` agregada
- [x] Columna `type` agregada
- [x] Columna `mood` agregada
- [x] Columna `description` agregada
- [x] Columna `created_at` agregada
- [x] Cover image ahora obligatorio
- [x] Endpoint `/upload-beat` acepta múltiples archivos
- [x] Servidor corriendo sin errores

## Listo para producción ✓
