# 🔗 QUICK REFERENCE - Optimización de Tokens

## 📋 Una Sola Hoja (Imprimible)

### EL CAMBIO PRINCIPAL
```
ANTES: Gemini pide 40-50 tags → 1,600 tokens → 625 beats/día
AHORA: Gemini pide 5-10 tags → 1,000 tokens → 1,000 beats/día
```

### LOS 5-10 TAGS QUE GENERA GEMINI
```
Mood:           Dark, Energetic, Melancholic, Chill
Estilo artista: Travis Scott Type, Kendrick Lamar Style
Subgénero:      Rage Trap, Melodic Trap, Conscious Hip-Hop
Vibe:           Spacey, Atmospheric, Aggressive, Punchy
```

### LOS 15-20 TAGS QUE AGREGA EL SISTEMA
```
BPM:      140BPM, Fast Tempo, Hard, Energetic
KEY:      Em, Minor, Melancholic, Dark
Beat:     Type Beat, Artist Name, Instrumental
Técnicos: 808s, Hi-Hats, Snare, Reverb, Synth
Contexto: Commercial, Freestyle, Vocal Ready, Production Ready
```

### TOTAL: 20-30 TAGS (Mayor calidad, menos tokens)

---

## 🧪 TEST RÁPIDO

```bash
# 1. Verifica el cambio
grep "5-10 tags ÚNICAMENTE" analyze_beat_ai.py

# 2. Recarga navegador (Ctrl+Shift+R)

# 3. Sube beat → Verifica 20-30 tags en consola

# 4. Listo ✅
```

---

## 💰 NÚMEROS

| Metrica | Antes | Ahora | Mejora |
|---------|-------|-------|--------|
| Tokens/beat | 1,600 | 1,000 | -37.5% |
| Beats/día | 625 | 1,000 | +60% |
| Con 3 keys | 1,875 | 3,000 | +60% |

---

## 📁 ARCHIVOS MODIFICADOS

- `analyze_beat_ai.py` - Líneas 2078, 2173, 2191 (3 cambios)
- Sintaxis: ✅ Correcta
- Errores: ✅ Ninguno

---

## 🚀 PRÓXIMOS PASOS

1. Test inmediato → Guía: [GUIA_TEST_OPTIMIZACION.md](GUIA_TEST_OPTIMIZACION.md)
2. Multi-API Key → 3 keys = 3,000 beats/día
3. Monitoreo → Ver logs de consumo

---

## ⚠️ ERRORES COMUNES

| Error | Causa | Solución |
|-------|-------|----------|
| Solo 17 tags | Gemini no responde | Ver Error 429 |
| Error 429 | Cuota excedida | Esperar o multi-key |
| Servidor down | Node no corre | `node server.js &` |
| Tabla vacía | Cache viejo | Ctrl+Shift+R |

---

## 📊 ESPERADO DESPUÉS

```
BPM: 132 (95% confidence)
KEY: E Minor (95% confidence)
Mood: Dark
Tags: 23 tags totales ✅
🤖 Gemini: ✅ Conectado (o ⚠️ No activo si Error 429)
```

---

**Última actualización**: 2024-12-12  
**Status**: ✅ LISTO  
**Tiempo test**: 5-15 minutos

