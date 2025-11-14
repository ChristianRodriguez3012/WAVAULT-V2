# WAVAULT-V2 — Guía de ejecución y pruebas

Este repositorio contiene la aplicación WAVAULT y scripts para pruebas E2E (Playwright) y de carga (Autocannon/k6/Artillery).

Resumen rápido
- Backend: `WAVAULT/backend/server.js` (Expone `http://localhost:3000`).
- E2E (headless, runner programático): `scripts/run-e2e-cases.js` → genera reportes en `reports/e2e/`.
- Load tests: `scripts/run-load2.js` (Autocannon) → genera reportes en `reports/load/`.

Preparación del entorno
1. Instala dependencias Node desde la raíz:
```bash
npm install
```
2. Instala navegadores para Playwright (si vas a ejecutar tests con Playwright):
```bash
npx playwright install --with-deps
```
3. Asegúrate de tener `python3` y `ffmpeg` si vas a generar demos de audio (usado por `WAVAULT/backend/generar_demo.py`).

Cómo ejecutar la aplicación
1. Desde la raíz, arranca el backend:
```bash
node WAVAULT/backend/server.js
```
2. Abre la app en el navegador: `http://localhost:3000` o usa las páginas directamente (`/login.html`, `/dashboard/producer.html`, `/dashboard/client.html`).

Ejecución de pruebas E2E (runner programático)
1. Asegúrate de que el servidor esté en ejecución (ver arriba).
2. Ejecuta el runner que crea reportes por caso:
```bash
node scripts/run-e2e-cases.js
# o via npm
npm run e2e:local
```
3. Resultados:
  - `reports/e2e/` — contiene archivos `.md` y `.json` por cada test ejecutado.
  - Nombre de archivo: `CP-E2E-XXX - REPORTE - <YYYY-MM-DDTHH-MM-SS-msZ>.md` (estandarizado).

Ejecución de pruebas de carga
1. Ejecuta el script (Autocannon runner):
```bash
npm run load:report
```
2. Resultados en `reports/load/` (MD y JSON).

Estructura de reportes
- `reports/e2e/` — E2E blackbox (MD + JSON por test).
- `reports/load/` — pruebas de carga.

Commits y push (convención sugerida para estos cambios)
- Commit message sugerido: `chore(reports): organizar reportes, mejorar READMEs y agregar README raíz`
- Push: `git push origin test-2`
- Mensaje que se muestra tras el push: describe brevemente los cambios, por ejemplo:
```
Push realizado a 'test-2': reorganizados reportes (reports/e2e, reports/load), README raíz añadido, runner E2E actualizado para generar MD/JSON por test.
```

Si quieres, hago el commit y push ahora con ese mensaje.
# WAVAULT-V2