# Reportes de carga

Directorio: `reports/load/`

Descripción:
- Aquí se almacenan los reportes generados por pruebas de carga (Autocannon, k6, Artillery, etc.).

Formato de nombre de archivo recomendado:
- `<TOOL> - REPORTE - <YYYY-MM-DDTHH-MM-SS>.md|json`
- Ejemplo: `autocannon - REPORTE - 2025-11-14T11-50-41.md`

Cómo ejecutar (local con script actual):
1. `npm run load:report` (si tienes el script configurado en `package.json`) o
2. `node scripts/run-load2.js`

Los reportes generados se almacenan en `reports/load/`.
