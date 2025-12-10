#!/bin/bash
# 📋 DOCUMENTO: INSTRUCCIONES DE TESTING Y VALIDACIÓN

cat << 'EOF'

╔════════════════════════════════════════════════════════════════════════════════╗
║                   🎵 WAVAULT V2 - GUÍA COMPLETA DE TESTING                   ║
╚════════════════════════════════════════════════════════════════════════════════╝

## 🎯 OBJETIVO
Validar que el sistema de carga de beats funciona con:
✅ Estructura exacta: NOMBRE - TYPE - REFERENCIA - KEY - BPM
✅ Validación de BPM (50-220)
✅ Análisis obligatorio e inmediato
✅ Modal con progreso y confianza por fuente
✅ Tags 18-30 por Gemini

═════════════════════════════════════════════════════════════════════════════════

## 📋 CHECKLIST DE TESTING

### FASE 1: SETUP ✅
═════════════════════════════════════════════════════════════════════════════════

[ ] 1. Verificar Python 3 instalado
        $ python3 --version
        Requerido: 3.8+

[ ] 2. Verificar Node.js instalado
        $ node --version
        Requerido: 14+

[ ] 3. Instalar dependencias Python
        $ pip install librosa scipy numpy google-generativeai

[ ] 4. Configurar API Key de Gemini
        $ export GEMINI_API_KEY="tu_clave_aqui"

[ ] 5. Crear/resetear base de datos
        $ cd /workspaces/WAVAULT-V2/WAVAULT/backend
        $ node reset-db.js

[ ] 6. Verificar estructura de directorios
        $ ls -la /workspaces/WAVAULT-V2/WAVAULT/backend/
        Debe existir:
        ├─ parse_filename_ai.py ✓
        ├─ analyze_beat_ai.py ✓
        ├─ server.js ✓
        ├─ ai-analysis-integration.js ✓

═════════════════════════════════════════════════════════════════════════════════

### FASE 2: PRUEBAS UNITARIAS ✅
═════════════════════════════════════════════════════════════════════════════════

#### TEST 2.1: parse_filename_ai.py - Estructura Exacta
[ ] Ejecutar:
    $ python3 /workspaces/WAVAULT-V2/WAVAULT/backend/parse_filename_ai.py \
      "Tropical Vibes - Drake Type Beat - Drake - Fm - 90.mp3"

[ ] Validar salida JSON contiene:
    {
      "beat_name": "Tropical Vibes",
      "beat_type": "Drake Type Beat",
      "reference": "Drake",
      "key": "Fm",
      "bpm": 90,
      "beat_name_confidence": 95,
      "beat_type_confidence": 90,
      "reference_confidence": 80,
      "key_confidence": 85,
      "bpm_confidence": 85
    }

[ ] RESULTADO: ✅ / ❌

#### TEST 2.2: parse_filename_ai.py - BPM Válido (90)
[ ] Ejecutar:
    $ python3 /workspaces/WAVAULT-V2/WAVAULT/backend/parse_filename_ai.py \
      "Beat Name - Drake Type Beat - Drake - Am - 90.mp3"

[ ] Validar:
    ✓ "bpm": 90
    ✓ "bpm_confidence": 85

[ ] RESULTADO: ✅ / ❌

#### TEST 2.3: parse_filename_ai.py - BPM Inválido (250)
[ ] Ejecutar:
    $ python3 /workspaces/WAVAULT-V2/WAVAULT/backend/parse_filename_ai.py \
      "Beat Name - Drake Type Beat - Drake - Am - 250.mp3"

[ ] Validar:
    ✓ "bpm": null
    ✓ "bpm_confidence": 0

[ ] RESULTADO: ✅ / ❌

#### TEST 2.4: parse_filename_ai.py - BPM Mínimo (50)
[ ] Ejecutar:
    $ python3 /workspaces/WAVAULT-V2/WAVAULT/backend/parse_filename_ai.py \
      "Ballad - Jazz Type Beat - Miles Davis - Cm - 50.mp3"

[ ] Validar:
    ✓ "bpm": 50
    ✓ "bpm_confidence": 85

[ ] RESULTADO: ✅ / ❌

#### TEST 2.5: parse_filename_ai.py - BPM Máximo (220)
[ ] Ejecutar:
    $ python3 /workspaces/WAVAULT-V2/WAVAULT/backend/parse_filename_ai.py \
      "Fast Trap - Drum & Bass Type Beat - Logistics - Gm - 220.mp3"

[ ] Validar:
    ✓ "bpm": 220
    ✓ "bpm_confidence": 85

[ ] RESULTADO: ✅ / ❌

#### TEST 2.6: parse_filename_ai.py - Limpieza de Parentheses
[ ] Ejecutar:
    $ python3 /workspaces/WAVAULT-V2/WAVAULT/backend/parse_filename_ai.py \
      "[Remix] Beat Name (Master) - Drake Type Beat - Drake - Dm - 95.mp3"

[ ] Validar:
    ✓ "beat_name": "Beat Name"
    ✓ Sin brackets, sin parentheses

[ ] RESULTADO: ✅ / ❌

#### TEST 2.7: parse_filename_ai.py - Sin Referencia
[ ] Ejecutar:
    $ python3 /workspaces/WAVAULT-V2/WAVAULT/backend/parse_filename_ai.py \
      "Cool Vibes - Trap Type Beat - Em - 110.mp3"

[ ] Validar:
    ✓ "reference": null
    ✓ "reference_confidence": 0

[ ] RESULTADO: ✅ / ❌

═════════════════════════════════════════════════════════════════════════════════

### FASE 3: PRUEBAS DE ENDPOINTS ✅
═════════════════════════════════════════════════════════════════════════════════

#### Preparación
[ ] Iniciar servidor:
    $ cd /workspaces/WAVAULT-V2/WAVAULT/backend
    $ node server.js
    
[ ] Verificar en logs:
    ✓ "✅ Server running on port 3000"

#### TEST 3.1: GET /upload-beat
[ ] Ejecutar:
    $ curl http://localhost:3000/upload-beat

[ ] Validar:
    ✓ Retorna HTML de upload-beat-final.html
    ✓ Contiene: "🎵 Subir Beat a WAVAULT"
    ✓ Contiene: "Estructura de nombre recomendada"

[ ] RESULTADO: ✅ / ❌

#### TEST 3.2: POST /api/parse-filename
[ ] Ejecutar:
    $ curl -X POST http://localhost:3000/api/parse-filename \
      -H 'Content-Type: application/json' \
      -d '{"filename": "Tropical Vibes - Drake Type Beat - Drake - Fm - 90.mp3"}'

[ ] Validar:
    ✓ Retorna JSON con estructura correcta
    ✓ "beat_name": "Tropical Vibes"
    ✓ "reference": "Drake"
    ✓ "bpm": 90

[ ] RESULTADO: ✅ / ❌

#### TEST 3.3: POST /api/analyze-beat
[ ] Preparar archivo de prueba:
    $ touch /tmp/test-beat.mp3
    # (O usar un beat real)

[ ] Ejecutar:
    $ curl -X POST http://localhost:3000/api/analyze-beat \
      -F "audio=@/tmp/test-beat.mp3"

[ ] Validar:
    ✓ Retorna JSON con "success": true
    ✓ Contiene "analysis.technical_data.bpm"
    ✓ Contiene "analysis.ai_inference.tags"

[ ] RESULTADO: ✅ / ❌

═════════════════════════════════════════════════════════════════════════════════

### FASE 4: PRUEBAS DE INTERFAZ (MANUAL) ✅
═════════════════════════════════════════════════════════════════════════════════

#### Setup Navegador
[ ] Abrir: http://localhost:3000/upload-beat
[ ] Verificar:
    ✓ Página carga correctamente
    ✓ Área de carga visible
    ✓ Información de estructura visible

#### TEST 4.1: Seleccionar Archivo
[ ] Acción:
    1. Click en área de carga o drag-drop
    2. Seleccionar archivo MP3 con nombre:
       "Tropical Vibes - Drake Type Beat - Drake - Fm - 90.mp3"

[ ] Validar:
    ✓ Nombre aparece en "Archivo seleccionado"
    ✓ Sección de precio y descripción aparece
    ✓ Botón "Cargar y Analizar Beat" está visible

[ ] RESULTADO: ✅ / ❌

#### TEST 4.2: Modal Abre (Análisis Obligatorio)
[ ] Acción:
    1. Hacer click en "Cargar y Analizar Beat"
    2. Modal debe abrir INMEDIATAMENTE

[ ] Validar:
    ✓ Modal abre con animación
    ✓ Muestra spinner giratorio
    ✓ Texto: "Analizando beat..."
    ✓ Subtítulo: "Procesando: Nombre → Audio → Tags"

[ ] RESULTADO: ✅ / ❌

#### TEST 4.3: Modal Muestra Resultados
[ ] Esperar:
    - Análisis complete (30-60 segundos)

[ ] Validar:
    ✓ Spinner desaparece
    ✓ Sección de resultados aparece
    ✓ Muestra 3 secciones:
      1. Metadatos del Nombre (beat_name, beat_type, reference)
      2. Análisis de Audio (key, bpm, mood)
      3. Tags Sugeridos (18-30 tags)

[ ] RESULTADO: ✅ / ❌

#### TEST 4.4: Confianza Visual
[ ] Validar indicadores de confianza:
    ✓ beat_name: Verde (✅ >80%)
    ✓ beat_type: Verde (✅ >80%)
    ✓ reference: Amarillo o Verde (⚡ 60-80% o ✅ >80%)
    ✓ key: Verde (✅ >80%)
    ✓ bpm: Verde (✅ >80%)

[ ] RESULTADO: ✅ / ❌

#### TEST 4.5: Botones Modal
[ ] Validar:
    ✓ Botón "❌ Rechazar y Re-analizar" visible
    ✓ Botón "✅ Aceptar y Continuar" visible
    ✓ Ambos funcionan

[ ] RESULTADO: ✅ / ❌

#### TEST 4.6: Edición de Campos
[ ] Acción:
    1. Click en campo Key o BPM
    2. Cambiar valor

[ ] Validar:
    ✓ Campos editables
    ✓ Cambios reflejados

[ ] RESULTADO: ✅ / ❌

#### TEST 4.7: Remover Tags
[ ] Acción:
    1. Click en "X" de un tag
    2. Tag debe desaparecer

[ ] Validar:
    ✓ Tag removido
    ✓ Lista de tags actualiza

[ ] RESULTADO: ✅ / ❌

#### TEST 4.8: Aceptar y Guardar
[ ] Acción:
    1. Click "✅ Aceptar y Continuar"
    2. Modal cierra

[ ] Validar:
    ✓ Modal cierra con animación
    ✓ Mensaje: "✅ ¡Beat guardado exitosamente!"
    ✓ Redirige a dashboard en 2 segundos

[ ] RESULTADO: ✅ / ❌

═════════════════════════════════════════════════════════════════════════════════

### FASE 5: VALIDACIÓN EN BD ✅
═════════════════════════════════════════════════════════════════════════════════

[ ] Verificar que beat se guardó:
    $ sqlite3 /workspaces/WAVAULT-V2/WAVAULT/backend/wavault.db \
      "SELECT beat_name, beat_type, reference, key, bpm, mood, tags FROM beats LIMIT 1;"

[ ] Validar campos:
    ✓ beat_name: "Tropical Vibes"
    ✓ beat_type: "Drake Type Beat"
    ✓ reference: "Drake"
    ✓ key: "Fm"
    ✓ bpm: 90
    ✓ mood: [Algo descriptivo]
    ✓ tags: [Contiene 18-30 tags]

[ ] RESULTADO: ✅ / ❌

═════════════════════════════════════════════════════════════════════════════════

### FASE 6: CASOS EXTREMOS ✅
═════════════════════════════════════════════════════════════════════════════════

#### TEST 6.1: BPM Muy Bajo (40 - debe rechazarse)
[ ] Archivo: "Beat - Type - Ref - Am - 40.mp3"
[ ] Resultado esperado:
    ✓ "bpm": null
    ✓ "bpm_confidence": 0

[ ] RESULTADO: ✅ / ❌

#### TEST 6.2: BPM Muy Alto (300 - debe rechazarse)
[ ] Archivo: "Beat - Type - Ref - Em - 300.mp3"
[ ] Resultado esperado:
    ✓ "bpm": null
    ✓ "bpm_confidence": 0

[ ] RESULTADO: ✅ / ❌

#### TEST 6.3: Nombre con Muchos Caracteres Especiales
[ ] Archivo: "[[[[Beat (((Name)))) {Remix}]] - Type - Ref - Dm - 95.mp3"
[ ] Resultado esperado:
    ✓ "beat_name": "Beat Name"
    ✓ Sin caracteres especiales

[ ] RESULTADO: ✅ / ❌

#### TEST 6.4: Sin Key
[ ] Archivo: "Beat - Type - Ref - 95.mp3"
[ ] Resultado esperado:
    ✓ "key": null
    ✓ "key_confidence": 0

[ ] RESULTADO: ✅ / ❌

═════════════════════════════════════════════════════════════════════════════════

## 📊 RESUMEN DE TESTING

Total de tests: 25
Esperado: 25/25 ✅

Por fases:
- Fase 1 (Setup): __/1
- Fase 2 (Unitarias): __/7
- Fase 3 (Endpoints): __/3
- Fase 4 (Interfaz): __/8
- Fase 5 (BD): __/1
- Fase 6 (Extremos): __/4

═════════════════════════════════════════════════════════════════════════════════

## ✅ CRITERIOS DE ÉXITO

✅ COMPLETADO cuando:
[✓] Todos los tests unitarios pasan (Fase 2)
[✓] Todos los endpoints responden correctamente (Fase 3)
[✓] Interfaz funciona y muestra análisis (Fase 4)
[✓] Datos se guardan en BD correctamente (Fase 5)
[✓] Casos extremos manejados gracefully (Fase 6)

═════════════════════════════════════════════════════════════════════════════════

## 🔍 TROUBLESHOOTING

### Problema: parse_filename_ai.py retorna solo nulls
Solución:
- Verificar formato de filename
- Debe contener: NOMBRE - TYPE - REFERENCIA - KEY - BPM
- Ejemplo: "Beat - Type Beat - Artist - Am - 90.mp3"

### Problema: Módulos Python no encontrados
Solución:
- $ pip install librosa scipy numpy google-generativeai

### Problema: GEMINI_API_KEY no funciona
Solución:
- Verificar: $ echo $GEMINI_API_KEY
- Debe tener valor válido
- Si no, tags no se generarán con búsqueda web

### Problema: Modal no abre al seleccionar archivo
Solución:
- Verificar console del navegador (F12)
- Buscar errores JavaScript
- Verificar que upload-beat-final.html se sirvió correctamente

### Problema: BPM no se valida correctamente
Solución:
- Verificar que parse_filename_ai.py tiene validación 50-220
- Verificar que archivo actualizado se ejecuta
- Verificar: python3 parse_filename_ai.py "test - test - test - Am - 250.mp3"

═════════════════════════════════════════════════════════════════════════════════

EOF

# Mostrar el resumen
echo "✅ Guía de testing completada"
echo ""
echo "Próximos pasos:"
echo "1. Revisar REFACTOR-SUMMARY.md"
echo "2. Ejecutar tests unitarios (Fase 2)"
echo "3. Ejecutar start-server.sh"
echo "4. Probar interfaz (Fase 4)"
echo ""
