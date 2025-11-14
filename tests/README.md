# Tests (E2E / Load / Unit)

Ubicación de los tests:
- E2E (Playwright): `tests/*.spec.js` (ej. `tests/e2e_productor_cliente.spec.js`)
- Runner programático E2E: `scripts/run-e2e-cases.js` (ejecución local Chromium)
- Load tests: `tests/load_test.js` (k6) y `tests/load_test.yml` (Artillery example)

Cómo ejecutar E2E (rápido):
1. Arranca el servidor:
```bash
node WAVAULT/backend/server.js
```
2. Ejecuta el runner programático (genera reportes en `reports/e2e/`):
```bash
node scripts/run-e2e-cases.js
```

Cómo ejecutar tests Playwright nativos:
1. Instala navegadores: `npx playwright install --with-deps`
2. Ejecuta: `npx playwright test` (por defecto buscará `tests/*.spec.js`)

Notas:
- Los tests E2E usan usuarios temporales con emails únicos para evitar colisiones.
- El runner crea archivos `MD` y `JSON` por cada test en `reports/e2e/` con el nombre: `NOMBRE DEL TEST - REPORTE - FECHA`.
