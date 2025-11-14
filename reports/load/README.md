Este README fue movido a la raíz del proyecto como `README.LOAD.md`.
Para ver la guía completa sobre reportes de carga, abre el archivo en la raíz del repositorio:

- `README.LOAD.md`

Mantengo este archivo en la carpeta como referencia mínima.
# Reportes de carga

Carpeta: `reports/load/`

Descripción:
- Aquí se deben almacenar los reportes generados por pruebas de carga (Autocannon, k6, Artillery, etc.).

Formato de nombre de archivo recomendado:
- `<TOOL> - REPORTE - <YYYY-MM-DDTHH-MM-SS>.md|json`
- Ejemplo: `autocannon - REPORTE - 2025-11-14T11-50-41.md`

Cómo ejecutar (local con script actual):
1. `npm run load:report` (si tienes el script configurado en `package.json`) o
2. `node scripts/run-load2.js`

Los reportes generados se almacenan en `reports/` por compatibilidad con los scripts existentes.
