# Reportes E2E (Blackbox)

Carpeta: `reports/e2e/`

Descripción:
- Aquí se almacenan los reportes generados por las pruebas E2E de caja negra.
- Cada ejecución genera un JSON y un Markdown por cada caso/escenario ejecutado.

Formato de nombre de archivo:
- `<NOMBRE DEL TEST> - REPORTE - <YYYY-MM-DDTHH-MM-SS>`
- Ejemplo: `CP-E2E-001 - REPORTE - 2025-11-14T14-37-22.md`

Contenido de cada reporte:
- Markdown: resumen, estado (PASS/FAIL), duración, errores, enlace al JSON completo.
- JSON: objeto con metadatos, resultados detallados y logs mínimos.

Cómo ejecutar (local):
1. Asegúrate de que el servidor esté corriendo en `http://localhost:3000`.
2. Ejecuta:
```
node scripts/run-e2e-cases.js
```
3. Los archivos se crearán en `reports/e2e/`.

Integración en npm:
- Puedes añadir en `package.json` un script `"e2e:local": "node scripts/run-e2e-cases.js"`.

# Reportes E2E (Blackbox)

Directorio: `reports/e2e/`

Resumen
- Esta carpeta contiene los reportes generados por el runner E2E (`scripts/run-e2e-cases.js`).
- Por cada caso de prueba se crean dos archivos:
	- Markdown: resúmen legible con estado y detalles (`.md`).
	- JSON: datos estructurados con metadatos y resultado (`.json`).

Formato de nombres
- Convención: `<ID_TEST> - REPORTE - <YYYY-MM-DDTHH-MM-SS-msZ>`
- Ejemplo: `CP-E2E-001 - REPORTE - 2025-11-14T14-43-38-848Z.md`

Contenido de los archivos
- Markdown (`.md`): título, estado (PASS/FAIL), duración, detalles relevantes (p. ej. título del beat), y enlace al JSON.
- JSON (`.json`): metadata (runId, tipo, timestamp, host) y el objeto `result` con campos `id`, `title`, `status`, `duration_ms`, `details` o `error`.

Cómo ejecutar (local)
1. Asegúrate de que el servidor esté corriendo en `http://localhost:3000`:
```bash
node WAVAULT/backend/server.js
```
2. Ejecuta el runner E2E (genera reportes por test en `reports/e2e/`):
```bash
node scripts/run-e2e-cases.js
# o via npm
npm run e2e:local
```

Interpretación rápida
- Abre el `.md` correspondiente para ver un resumen legible.
- Si necesitas procesar automáticamente los resultados, usa los `.json` (machine-readable).

Buenas prácticas / notas
- Usa ambientes limpios al ejecutar tests en CI (puedes usar la opción de crear users temporales que el runner ya usa).
- Si quieres capturas / trazas extendidas, lo añadimos en el runner (screenshots en `reports/e2e/assets/` y enlace en el `.md`).

Contacto / autor
- Cambios hechos por: test runner / scripts añadidos en la rama `test-2`.
