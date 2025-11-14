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

Este README fue movido a la raíz del proyecto como `README.E2E.md`.
Para ver la guía completa de cómo se generan e interpretan los reportes E2E abre el archivo en la raíz:

	- `README.E2E.md`

Mantengo este archivo en la carpeta como referencia breve.
Contacto / autor
- Cambios hechos por: test runner / scripts añadidos en la rama `test-2`.
