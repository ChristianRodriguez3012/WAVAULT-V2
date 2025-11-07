# INFORME PRUEBAS CAJA BLANCA

Resumen
- Tipo: Pruebas de Caja Blanca (API e Integración)  
- Herramientas: Jest + Supertest  
- Entorno: Terminal de GitHub Codespaces / Devcontainer Ubuntu 24.04.2 LTS  
- Carpeta de informes: INFORMES_PRUEBAS/HISTORIAL  
- Ubicación de generación automática de informes: /workspaces/WAVAULT-V2/INFORMES_PRUEBAS/HISTORIAL/  
- Nombre archivo: <timestamp ISO> con ":" reemplazados por "-" (ej. `2025-11-07T12-34-56.789Z.md`)

Cómo ejecutar las pruebas (consola)
```bash
cd /workspaces/WAVAULT-V2
npm install        # si es la primera vez o cambian dependencias
npm test           # ejecuta todas las suites y genera un informe en INFORMES_PRUEBAS/HISTORIAL
# Ejecutar solo la suite funcional:
npx jest backend/tests/api.functional.test.js --runInBand --testTimeout=20000
```

Cómo ver el último informe generado
```bash
ls -t INFORMES_PRUEBAS/HISTORIAL | head -n 1            # muestra el nombre del último informe
cat INFORMES_PRUEBAS/HISTORIAL/$(ls -t INFORMES_PRUEBAS/HISTORIAL | head -n1)   # muestra su contenido en consola
```

Estructura del informe (contenido generado automáticamente)
- Encabezado: fecha/hora de ejecución, archivo de pruebas y entorno.  
- Resumen ejecutivo: lista de casos con resultado PASÓ / FALLÓ.  
- Detalle por caso: para cada ID (p. ej. CP-API-001, CP-API-002) incluye:
  1. ID y título del caso.
  2. Descripción breve del objetivo de la prueba.
  3. Resultado esperado.
  4. Pasos de ejecución (pasos efectivamente ejecutados, en orden).  
     - Cada paso incluye la acción, detalles (endpoints, payload, archivos adjuntos) y códigos HTTP recibidos.
  5. Resultado observado (código HTTP, cuerpo de respuesta, rutas de archivos creados).
  6. Notas o errores (en caso de fallo).
  7. Sección de detalles en JSON con todos los campos registrados.

Ejemplo de sección para un caso (CP-API-001)
- ID: CP-API-001  
- Título: Bloqueo de middleware de autorización  
- Descripción: Verifica que un usuario con rol "cliente" no pueda acceder a /subir-beat (ruta de productor).  
- Resultado esperado: 401 Unauthorized o 403 Forbidden.  
- Pasos ejecutados:
  1. POST /auth/login { email: cliente@test.local } -> token obtenido: `client-token`  
  2. POST /subir-beat con header Authorization: Bearer client-token (sin archivo) -> código HTTP: 403  
- Resultado observado: Respuesta HTTP 403, body: { error: "Forbidden" }  
- Estado: PASÓ

Ejemplo de sección para un caso (CP-API-002)
- ID: CP-API-002  
- Título: Validación de procesamiento de archivos (demo con tag)  
- Descripción: Subir un beat (archivo) como productor y verificar que se genere un demo con tag sonoro.  
- Resultado esperado: Se crea `beat-demo.mp3` y contiene el tag sonoro.  
- Pasos ejecutados:
  1. POST /auth/login { email: productor@test.local } -> token obtenido: `producer-token`  
  2. POST /subir-beat (attach: backend/tests/fixtures/beat.mp3) con Authorization Bearer producer-token -> código HTTP: 201  
  3. Esperar procesamiento; verificar existencia en `/tmp/wavault-demos/beat-demo.mp3` y leer contenido para detectar `--TAG--`.  
- Resultado observado: Demo encontrado, tag presente -> PASÓ

Notas y recomendaciones
- El informe se genera por la suite funcional implementada en `backend/tests/api.functional.test.js`.  
- Para integrar resultados de todas las suites en un único informe sería necesario un reporter Jest personalizado o un script que agregue todas las salidas; puedo añadirlo si lo deseas.  
- Aumenta `--testTimeout` si el procesamiento real con ffmpeg tarda más que el mock.

Fin del documento.