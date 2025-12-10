# DOCUMENTACIÓN WAVAULT V2 - v2.0

## Resumen de la versión
- **Versión:** 2.0
- **Fecha:** Diciembre 2025
- **Autor:** Christian Rodriguez
- **Tag:** v2.0

## Características principales
- Tabla de confianza visual y explicable generada por Gemini (API) y fallback local
- Explicación del pipeline y fuentes en la UI
- Tags IA generados y priorizados por Gemini
- Validaciones BPM/Key/Mood mejoradas
- Documentación técnica y visual ampliada
- Versionado y mensajes claros en todos los archivos

## Documentos clave
- `README.md`: Guía rápida y resumen de cambios
- `CHANGELOG.md`: Historial de cambios
- `PROJECT_COMPLETION_REPORT.md`: Reporte final completo
- `IMPLEMENTATION_SUMMARY.md`: Resumen técnico
- `SYSTEM_OVERVIEW.md`: Arquitectura y validaciones
- `DEMO_VISUAL.md`: Ejemplos visuales
- `SETUP_AND_RUN.md`: Guía de instalación y testing

## Instalación y uso
1. `cd WAVAULT`
2. `npm install`
3. Configura tu clave Gemini: `echo "GEMINI_API_KEY=tu_clave" > backend/.env`
4. `npm start`
5. Abre [http://localhost:3000/upload-beat](http://localhost:3000/upload-beat)

## Pipeline de análisis
1. Parseo del filename
2. Extracción de características técnicas (BPM, Key, Mood)
3. Generación de tags y tabla de confianza con Gemini
4. Visualización y edición en el wizard
5. Guardado en SQLite

## Ejemplo de tabla de confianza
| Parámetro         | Valor      | Confianza | Fuente    | Rationale                       |
|------------------|------------|-----------|-----------|----------------------------------|
| Nombre/Archivo   | test.mp3   | 95%       | filename  | Parseo directo del archivo       |
| BPM              | 90         | 95%       | filename  | Prioridad filename, si existe    |
| Key              | Fm         | 90%       | audio     | Detección cromática avanzada     |
| Mood             | Dark Trap  | 80%       | gemini    | Gemini usando BPM/Key y hints    |
| Tags (IA)        | ...        | 80%       | gemini    | Gemini priorizando tags oblig.   |

## Notas
- El sistema es 100% automático y explicable
- Listo para producción
- Documentación ampliada y validada

---
Versión 2.0 - Diciembre 2025
Listo para producción
