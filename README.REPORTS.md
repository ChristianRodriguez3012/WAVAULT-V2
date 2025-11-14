# Índice de reportes

Resumen de las carpetas de reportes:
- `reports/e2e/` — reportes E2E por caso (MD + JSON)
- `reports/load/` — reportes de carga (Autocannon/k6/Artillery)

Para ver detalles sobre cada tipo de reporte, abre los archivos específicos:
- `README.E2E.md` — guía para reportes E2E.
- `README.LOAD.md` — guía para reportes de carga.

Los reportes se generan desde los scripts en `scripts/`:
- `scripts/run-e2e-cases.js` → E2E (genera `reports/e2e/`)
- `scripts/run-load2.js` → carga (genera `reports/load/`)
