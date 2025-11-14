# Resumen de pruebas de carga y comandos ejecutados

Este documento resume los cambios realizados en el proyecto, los scripts añadidos y los comandos útiles para reproducir las pruebas de carga y generar reportes. Está pensado para ser agregado a una rama de pruebas (`test-2`).

## Estructura añadida

- `tests/load_test.js` — script k6 (alternativa) para 50 VUs durante 2 minutos.
- `tests/load_test.yml` — script Artillery que simula ramp-up y 50 usuarios.
- `scripts/run-load2.js` — script Node que ejecuta `autocannon` (50 conexiones, 120s) y genera reportes:
  - `reports/load-report-<timestamp>.md`
  - `reports/load-report-<timestamp>.json`
  - Actualiza `reports/README.md` con índice de reportes.
- `playwright.config.js` — configuración Playwright para LambdaTest (archivo añadido previamente).

## Comandos de instalación y preparación

- Instalar dependencias Node (raíz):
```bash
npm install
```

- (Si usas k6/Artillery o herramientas del sistema) instalar paquetes del sistema:
```bash
sudo apt update -y
sudo apt install -y ffmpeg
# k6 no está disponible directamente en apt en este contenedor; opciones:
# - instalar k6 manualmente desde su repositorio o usar npx/artillery/autocannon
```

## Comandos para arrancar el servidor local

- Ejecutar el servidor Node (desde la raíz del repo):
```bash
node WAVAULT/backend/server.js
```

El servidor escucha en `http://localhost:3000`.

## Ejecutar pruebas funcionales / E2E (Playwright)

- Archivo de configuración: `playwright.config.js`.
- Ejecutar pruebas Playwright (si las tienes):
```bash
npx playwright test
```

## Ejecutar pruebas de carga (varias opciones)

- k6 (si instalado):
```bash
npm run load:test
# (usa el script definido en package.json que apunta a tests/load_test.js)
```

- Artillery (si prefieres):
```bash
npm run load:test:artillery
# o sin instalar: npx artillery run tests/load_test.yml
```

- Autocannon (script Node automático — recomendado para reproducibilidad local):
```bash
npm run load:report
# Esto ejecuta node scripts/run-load2.js y genera:
# - reports/load-report-<timestamp>.md
# - reports/load-report-<timestamp>.json
# - updates reports/README.md
```

## Ver reportes generados

- Ver índice de reportes:
```bash
less reports/README.md
```

- Ver último reporte Markdown:
```bash
ls -t reports/load-report-*.md | head -n1
less $(ls -t reports/load-report-*.md | head -n1)
```

- Ver JSON completo:
```bash
ls -t reports/load-report-*.json | head -n1
cat $(ls -t reports/load-report-*.json | head -n1) | jq .
```

## Comandos Git para crear la rama de prueba y subirla

- Crear y cambiar a la rama `test-2`:
```bash
git checkout -b test-2
```

- Añadir y commitear todos los cambios locales:
```bash
git add -A
git commit -m "feat: add load testing scripts, reports and documentation"
```

- Subir la rama al remoto (origen):
```bash
git push -u origin test-2
```

> Nota: Si `git push` falla por credenciales, configura `git remote` o las credenciales en tu entorno.

## Recomendaciones siguientes (para robustecer la cobertura de rendimiento)

1. Añadir escenarios reales que cubran flujos: login (POST), subida de archivos (multipart), compra (POST), generación de demo (trigger Python).  
2. Integrar monitoreo de recursos (Prometheus + Grafana) durante las pruebas.  
3. Añadir validaciones/umbrales que hagan fallar el job en CI si p95 o errores superan límites.  
4. Ejecutar pruebas distribuidas en cloud (k6 cloud, LambdaTest, etc.) para simular tráfico desde varias regiones.

---

Este README se creó automáticamente por cambios realizados en el repo. Si quieres, puedo crear la rama `test-2` y subir estos cambios ahora.
