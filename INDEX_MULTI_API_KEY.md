# 📚 ÍNDICE: SISTEMA MULTI-API KEY

## 🎯 INICIO RÁPIDO

**¿Qué quieres hacer?**

0. **Ver resumen ejecutivo de la sesión completa** → [RESUMEN_EJECUTIVO_SESION.md](RESUMEN_EJECUTIVO_SESION.md) ⭐
1. **Ver cálculos de cuántas keys necesito** → [CALCULO_API_KEYS.md](CALCULO_API_KEYS.md)
2. **Entender cómo funciona el sistema** → [SISTEMA_MULTI_API_KEY.md](SISTEMA_MULTI_API_KEY.md)
3. **Ver resumen ejecutivo rápido** → [RESUMEN_MULTI_API_KEY.md](RESUMEN_MULTI_API_KEY.md)
4. **Integrar en frontend** → [FRONTEND_INTEGRACION_GEMINI.md](FRONTEND_INTEGRACION_GEMINI.md)
5. **Testear el sistema** → `./test_api_key_fallback.sh`

---

## 📊 RESPUESTA RÁPIDA

### "¿Cuántas API keys necesito para 20 beats/día?"

```
✅ MÍNIMO: 1 API Key (suficiente)
✅ ÓPTIMO: 2 API Keys (redundancia)

Capacidad con 2 keys + caché:
- 6,000 beats/día
- Tu uso: 20 beats (0.33%)
- Sobra: 99.67% de capacidad
```

### "¿Cómo configuro el fallback?"

```bash
# 1. Crea API keys en: https://aistudio.google.com/app/apikey

# 2. Edita .env:
GEMINI_API_KEY=KEY_1_AQUI
GEMINI_API_KEY_2=KEY_2_AQUI
GEMINI_API_KEY_3=KEY_3_AQUI  # Opcional

# 3. Reinicia servidor:
./start-server.sh
```

### "¿Funciona el sistema?"

```bash
# Test automático:
./test_api_key_fallback.sh

# Resultado esperado:
✅ Test 1: Inicialización - COMPLETADO
✅ Test 2: KEY válida - COMPLETADO
✅ Test 3: Fallback automático - COMPLETADO
✅ Test 4: Todas inválidas - COMPLETADO
```

---

## 📁 ARCHIVOS

### Documentación

| Archivo | Descripción | Tamaño |
|---------|-------------|--------|
| [RESUMEN_EJECUTIVO_SESION.md](RESUMEN_EJECUTIVO_SESION.md) | ⭐ Resumen ejecutivo completo de todo lo implementado | 11 KB |
| [GUIA_RAPIDA_30_SEGUNDOS.md](GUIA_RAPIDA_30_SEGUNDOS.md) | ⚡ Start aquí: 30 segundos de lectura | 2.9 KB |
| [BUSQUEDA_WEB_SELECTIVA.md](BUSQUEDA_WEB_SELECTIVA.md) | 🌐 Optimización de búsqueda web (60-70% ahorro cuota) | 8.5 KB |
| [OPTIMIZACION_MODELOS_GEMINI.md](OPTIMIZACION_MODELOS_GEMINI.md) | 🚀 Análisis Flash vs Pro y estrategias | 7.2 KB |
| [CALCULO_API_KEYS.md](CALCULO_API_KEYS.md) | Cálculos detallados de capacidad y consumo | 4.6 KB |
| [SISTEMA_MULTI_API_KEY.md](SISTEMA_MULTI_API_KEY.md) | Guía completa: configuración, uso, casos | 9.4 KB |
| [RESUMEN_MULTI_API_KEY.md](RESUMEN_MULTI_API_KEY.md) | Resumen ejecutivo y estadísticas | 5.6 KB |
| [HEALTH_CHECK_SYSTEM.md](HEALTH_CHECK_SYSTEM.md) | Sistema de Health Check y Pre-Flight | 3.2 KB |
| [INDICADORES_UX_GEMINI.md](INDICADORES_UX_GEMINI.md) | Indicadores de fuente de tags y estado Gemini (UX) | 6.3 KB |
| [RESUMEN_INDICADORES_UX.md](RESUMEN_INDICADORES_UX.md) | Resumen rápido de indicadores para frontend | 2.8 KB |
| [FRONTEND_INTEGRACION_GEMINI.md](FRONTEND_INTEGRACION_GEMINI.md) | Guía paso a paso para desarrolladores frontend | 8.1 KB |
| [RESUMEN_VISUAL_SISTEMA_COMPLETO.md](RESUMEN_VISUAL_SISTEMA_COMPLETO.md) | Flowchart y diagrama visual completo | 14 KB |
| [INDEX_MULTI_API_KEY.md](INDEX_MULTI_API_KEY.md) | Este índice | - |

### Scripts

| Archivo | Descripción | Uso |
|---------|-------------|-----|
| [test_api_key_fallback.sh](test_api_key_fallback.sh) | Test automático del sistema | `./test_api_key_fallback.sh` |
| [health_check_keys.py](WAVAULT/backend/health_check_keys.py) | Health check de todas las API keys | `cd WAVAULT/backend && python3 health_check_keys.py` |

### Ejemplos JSON
| Archivo | Descripción | Tamaño |
|---------|-------------|--------|
| [EJEMPLO_RESPUESTA_JSON_CON_GEMINI.json](EJEMPLO_RESPUESTA_JSON_CON_GEMINI.json) | Respuesta con IA activa (gemini_access: true) | 3.4 KB |
| [EJEMPLO_RESPUESTA_JSON_SIN_GEMINI.json](EJEMPLO_RESPUESTA_JSON_SIN_GEMINI.json) | Respuesta sin IA (gemini_access: false) | 2.7 KB |

### Código

| Archivo | Líneas | Descripción |
|---------|--------|-------------|
| [analyze_beat_ai.py](WAVAULT/backend/analyze_beat_ai.py) | 41-59 | Inicialización multi-key |
| [analyze_beat_ai.py](WAVAULT/backend/analyze_beat_ai.py) | 75-145 | Función `call_gemini_with_fallback()` |
| [.env](WAVAULT/backend/.env) | 1-25 | Configuración de API keys |

---

## 🔍 BUSCAR POR TEMA

### Capacidad y Límites

- **20 beats/día**: [CALCULO_API_KEYS.md](CALCULO_API_KEYS.md#tu-caso-20-beats-día) → Mínimo 1, Óptimo 2
- **50 beats/día**: [CALCULO_API_KEYS.md](CALCULO_API_KEYS.md#escalado-50-beats-día) → Mínimo 1, Óptimo 2
- **100 beats/día**: [CALCULO_API_KEYS.md](CALCULO_API_KEYS.md#escalado-100-beats-día) → Mínimo 2, Óptimo 3
- **Tabla comparativa**: [RESUMEN_MULTI_API_KEY.md](RESUMEN_MULTI_API_KEY.md#tabla-comparativa)

### Configuración

- **Crear API keys**: [SISTEMA_MULTI_API_KEY.md](SISTEMA_MULTI_API_KEY.md#paso-1-crear-api-keys)
- **Agregar al .env**: [SISTEMA_MULTI_API_KEY.md](SISTEMA_MULTI_API_KEY.md#paso-2-agregar-al-env)
- **Reiniciar servidor**: [SISTEMA_MULTI_API_KEY.md](SISTEMA_MULTI_API_KEY.md#paso-3-reiniciar-servidor)

### Tests

- **Test automático**: [SISTEMA_MULTI_API_KEY.md](SISTEMA_MULTI_API_KEY.md#test-automático-recomendado)
- **Test manual**: [SISTEMA_MULTI_API_KEY.md](SISTEMA_MULTI_API_KEY.md#test-manual-en-producción)
- **Logs esperados**: [SISTEMA_MULTI_API_KEY.md](SISTEMA_MULTI_API_KEY.md#logs-del-sistema)

### Casos de Uso

- **Producer casual**: [SISTEMA_MULTI_API_KEY.md](SISTEMA_MULTI_API_KEY.md#caso-1-producer-casual-20-beats-día)
- **Producer activo**: [SISTEMA_MULTI_API_KEY.md](SISTEMA_MULTI_API_KEY.md#caso-2-producer-activo-50-beats-día)
- **Operación seria**: [SISTEMA_MULTI_API_KEY.md](SISTEMA_MULTI_API_KEY.md#caso-3-operación-seria-100-beats-día)

### Código Técnico

- **Función de fallback**: [SISTEMA_MULTI_API_KEY.md](SISTEMA_MULTI_API_KEY.md#función-de-fallback-analyze_beat_aipy-líneas-75-145)
- **Inicialización**: [SISTEMA_MULTI_API_KEY.md](SISTEMA_MULTI_API_KEY.md#inicialización-analyze_beat_aipy-líneas-41-59)
- **Health check pre-flight**: [HEALTH_CHECK_SYSTEM.md](HEALTH_CHECK_SYSTEM.md)
- **Indicadores UX**: [INDICADORES_UX_GEMINI.md](INDICADORES_UX_GEMINI.md)
- **Ejemplos JSON con/sin Gemini**: [EJEMPLO_RESPUESTA_JSON_CON_GEMINI.json](EJEMPLO_RESPUESTA_JSON_CON_GEMINI.json), [EJEMPLO_RESPUESTA_JSON_SIN_GEMINI.json](EJEMPLO_RESPUESTA_JSON_SIN_GEMINI.json)

### UX e Indicadores (Nuevo ✨)

- **Resumen rápido de indicadores**: [RESUMEN_INDICADORES_UX.md](RESUMEN_INDICADORES_UX.md)
- **Guía completa para frontend**: [INDICADORES_UX_GEMINI.md](INDICADORES_UX_GEMINI.md)
- **Badge verde/rojo Gemini**: Ver ejemplos en INDICADORES_UX_GEMINI.md
- **Tags source dinámico**: "IA + Parser" vs "Solo Parser" en tabla de confianza

---

## 🎯 FLUJO RECOMENDADO

### Para Empezar (5 minutos)

```
1. Lee: RESUMEN_MULTI_API_KEY.md (2 min)
2. Crea: 1 API key adicional (2 min)
3. Configura: .env con GEMINI_API_KEY_2 (30 seg)
4. Reinicia: ./start-server.sh (30 seg)
5. Verifica: tail -f logs/server.log
```

### Para Entender a Fondo (15 minutos)

```
1. Lee: CALCULO_API_KEYS.md (5 min)
2. Lee: SISTEMA_MULTI_API_KEY.md (8 min)
3. Ejecuta: ./test_api_key_fallback.sh (2 min)
```

### Para Producción (3 minutos)

```
1. Crea: 2-3 API keys
2. Configura: .env con todas las keys
3. Reinicia: servidor
4. Monitorea: logs durante primera hora
```

---

## 📊 ESTADÍSTICAS CLAVE

### Consumo Optimizado V2.0

```
Por beat (con caché 50%):
├─ Input tokens: 250
├─ Output tokens: 400
├─ Total: 650 tokens
└─ Requests: 0.5 promedio

Capacidad con 2 API keys:
├─ 3,000 requests/día
├─ 2M tokens/día
└─ 6,000 beats/día con caché
```

### Beneficios del Sistema

```
✅ Redundancia automática (0 downtime)
✅ Fallback inteligente (detecta tipo de error)
✅ Escalabilidad sin código (solo .env)
✅ Costo $0 (Gemini Free Tier)
✅ Testeado y funcionando
```

---

## 🚀 PRÓXIMO PASO

**Lee el resumen ejecutivo:**

```bash
cat RESUMEN_MULTI_API_KEY.md
```

**O crea tu segunda API key ahora:**

1. https://aistudio.google.com/app/apikey
2. Click "Create API key"
3. Copia en `.env`: `GEMINI_API_KEY_2=TU_KEY`
4. Reinicia: `./start-server.sh`

---

## 📞 SOPORTE

Si tienes dudas:

1. **Configuración**: Ver [SISTEMA_MULTI_API_KEY.md](SISTEMA_MULTI_API_KEY.md)
2. **Capacidad**: Ver [CALCULO_API_KEYS.md](CALCULO_API_KEYS.md)
3. **Tests**: Ejecutar `./test_api_key_fallback.sh`
4. **Logs**: `tail -f WAVAULT/backend/logs/server.log | grep "🔑"`

---

**Última actualización**: 12 de enero de 2025  
**Versión**: 3.0 (Multi-key + Health Check + Indicadores UX)  
**Versión**: Multi-API Key System V1.0  
**Estado**: ✅ Producción Ready
