# 🎵 GUÍA RÁPIDA - PLAYER MEJORADO WAVAULT

## Características Implementadas

### Visual
- ✅ Diseño tipo Spotify con gradientes
- ✅ Efecto glass-morphism (backdrop-filter)
- ✅ Responsive (desktop, tablet, mobile)
- ✅ Dark theme profesional
- ✅ Animaciones suaves

### Funcionalidad
- ✅ Play/Pause
- ✅ Anterior/Siguiente (navegación playlist)
- ✅ Loop (Off → All → One)
- ✅ Volumen (0-100%)
- ✅ Barra progreso (click/drag)
- ✅ Tiempos (MM:SS)

### Información
- ✅ Nombre del beat
- ✅ Nombre del productor
- ✅ BPM - KEY
- ✅ Portada miniatura (70x70px)
- ✅ Persistencia en localStorage

---

## Estructura HTML

```html
<div class="player-wrapper">          <!-- Contenedor fijo -->
  <div class="player-container">      <!-- Grid 3 filas -->
    
    <!-- Fila 1: Información -->
    <div class="player-info-row">
      <div class="player-info-content">
        <img id="playerCover" />
        <div class="player-track-details">
          <h3 id="playerTitle">Nombre Beat</h3>
          <p id="playerArtist">Productor</p>
          <p id="playerMeta">120 BPM • A KEY</p>
        </div>
      </div>
    </div>

    <!-- Fila 2: Progreso -->
    <div class="player-progress-row">
      <span id="currentTime">0:00</span>
      <div class="progress-bar">
        <div id="progressFill"></div>
        <input id="progressSlider" type="range" />
      </div>
      <span id="duration">3:45</span>
    </div>

    <!-- Fila 3: Controles -->
    <div class="player-controls-row">
      <button id="prevBtn"><i class="fas fa-step-backward"></i></button>
      <button id="playPauseBtn"><i class="fas fa-play"></i></button>
      <button id="nextBtn"><i class="fas fa-step-forward"></i></button>
      <div class="spacer"></div>
      <button id="loopBtn"><i class="fas fa-redo"></i></button>
      <button id="volumeBtn"><i class="fas fa-volume-up"></i></button>
      <input id="volumeSlider" type="range" />
    </div>
  </div>
</div>
```

---

## Métodos JavaScript

### Reproducción
```javascript
window.wavaultPlayer.play()           // Reproducir
window.wavaultPlayer.pause()          // Pausar
window.wavaultPlayer.togglePlay()     // Alternar play/pause
window.wavaultPlayer.setBeat(beat)    // Cargar beat
```

### Navegación
```javascript
window.wavaultPlayer.nextTrack()      // Siguiente beat
window.wavaultPlayer.prevTrack()      // Beat anterior
```

### Control
```javascript
window.wavaultPlayer.setVolume(50)    // 0-100
window.wavaultPlayer.seekTo(50)       // Buscar al 50%
window.wavaultPlayer.toggleLoop()     // Cambiar modo loop
```

---

## Estructura de datos Beat

```javascript
const beat = {
  id: "123",                          // ID único
  nombre: "Summer Vibes",             // Nombre del beat
  productor: "DJ Cool",               // Artista/productor
  portada: "/uploads/covers/beat.jpg",// Imagen
  archivo: "/uploads/audio/beat.mp3", // Audio
  precio: "29.99",                    // Precio
  bpm: "120",                         // Tempo
  key: "A"                            // Tonalidad
};

// Reproducir
window.wavaultPlayer.setBeat(beat);
```

---

## Integración con Feed

### En cards de beats
```html
<!-- El card necesita atributos data: -->
<div class="beat-card" 
     data-beatId="123"
     data-bpm="120"
     data-key="A"
     data-precio="29.99"
     data-audioUrl="/uploads/audio/beat.mp3">
  
  <img class="beat-cover" src="/uploads/covers/beat.jpg" />
  <h3 class="beat-title">Beat Name</h3>
  <p class="beat-producer">Producer Name</p>
</div>
```

### En JavaScript (playBeat)
```javascript
function playBeat(beat, event) {
  const beatData = {
    id: beat.id,
    nombre: beat.title,
    productor: beat.producer,
    portada: beat.cover,
    archivo: beat.audio,
    precio: beat.price,
    bpm: beat.bpm,
    key: beat.key
  };

  window.wavaultPlayer.setBeat(beatData);
}
```

---

## Modos de Loop

| Modo | Icono | Acción |
|------|-------|--------|
| **Off** | 🔁 (gris) | Se detiene al terminar |
| **All** | 🔁 (azul) | Pasa al siguiente beat |
| **One** | 🔁¹ (azul) | Repite el mismo beat |

Click en botón loop para ciclar: Off → All → One → Off

---

## CSS Classes

```css
.player-wrapper           /* Contenedor fijo */
.player-container         /* Grid principal */
.player-info-row         /* Fila de información */
.player-info-content     /* Contenedor info */
.player-cover            /* Imagen 70x70 */
.player-track-details    /* Título + meta */
.player-title            /* Nombre beat */
.player-artist           /* Productor */
.player-meta             /* BPM • KEY */

.player-progress-row     /* Fila de progreso */
.progress-bar-container  /* Contenedor barra */
.progress-bar            /* Barra con fill */
.progress-fill           /* Relleno animado */
.progress-slider         /* Slider input */
.time-display            /* Tiempos MM:SS */

.player-controls-row     /* Fila controles */
.player-buttons-group    /* Botones play/nav */
.play-pause-btn          /* Botón play grande */
.player-btn              /* Botones genéricos */
.secondary-btn           /* Botones secundarios */
.spacer                  /* Espaciador flex */
.player-secondary-controls /* Grupo loop+vol */
.volume-slider           /* Slider volumen */
```

---

## Responsividad

### Desktop (>1024px)
- 3 filas visibles
- Información expandida
- Volumen slider 110px

### Tablet (768px-1024px)
- 3 filas compactas
- Volumen slider 80px

### Mobile (<768px)
- 3 filas apiladas
- Botones en grid
- Volumen slider 60px

### Extra Small (<480px)
- Layout minimal
- Volumen slider 50px

---

## URLs Importantes

- **Feed**: `http://localhost:3000/dashboard/client.html`
- **Perfil**: `http://localhost:3000/perfil.html?productor=name`
- **Detalle Beat**: `http://localhost:3000/beat.html?id=123`
- **Dashboard Productor**: `http://localhost:3000/dashboard/producer.html`

---

## Archivos Clave

```
/js/
  ├── player-global.js           # Clase WavaultPlayer (320 líneas)
  └── beat-player-integration.js  # Integración con cards (40 líneas)

/assets/css/
  └── style.css                   # Estilos +300 líneas

/components/
  └── player-footer-template.html # Template reutilizable

/public/
  ├── index.html                  # ✅ Actualizado
  ├── perfil.html                 # ✅ Actualizado
  ├── beat.html                   # ✅ Actualizado
  ├── analyzer.html               # ✅ Actualizado
  └── dashboard/
      ├── client.html             # ✅ Actualizado
      └── producer.html           # ✅ Actualizado
```

---

## Troubleshooting

### Player no aparece
- ✓ Verificar que Font Awesome CDN está cargado
- ✓ Revisar DevTools → Console por errores
- ✓ Asegurar que z-index: 1001 no es sobrescrito

### No se reproduce audio
- ✓ Verificar que la ruta del archivo es correcta
- ✓ Revisar que CORS no bloquea
- ✓ Comprobar formato del audio (MP3)

### Loop no funciona
- ✓ Click en botón 🔁 cicla: Off → All → One
- ✓ Botón activo cuando no está en Off
- ✓ Revisar console por errores

### Barra progreso no responde
- ✓ Comprobar que input type="range" existe
- ✓ Verificar que seekTo() se ejecuta
- ✓ Revisar duración del audio con loadedmetadata

---

## Performance

- Clase singleton: `window.wavaultPlayer`
- Un elemento `<audio>` global
- localStorage para persistencia
- Event delegation para cards dinámicos
- CSS transitions en GPU
- Backdrop-filter optimizado

---

## Próximas Mejoras Opcionales

- [ ] Añadir queue/playlist
- [ ] Shuffle mode
- [ ] Visualizador de audio
- [ ] Sincronización entre tabs
- [ ] Historial de reproducción
- [ ] Sistema de favoritos
- [ ] Miniplayer flotante
- [ ] Tema claro/oscuro toggle

---

**Última actualización:** Diciembre 2025
**Versión:** 2.0 - Spotify-like Player
**Estado:** ✅ Producción
