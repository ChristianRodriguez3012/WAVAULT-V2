/**
 * PLAYER GLOBAL - Reproductor persistente tipo Spotify
 * Funciona en todas las páginas de la aplicación
 */

class WavaultPlayer {
  constructor() {
    this.currentBeat = null;
    this.isPlaying = false;
    this.audioElement = null;
    this.playlist = [];
    this.currentIndex = 0;
    this.currentSources = [];
    this.currentSourceIndex = 0;
    this.autoPlayOnSet = true;
    this.loopMode = 0; // 0: no loop, 1: loop one
    this.shuffleMode = false;
    this.shuffleIndices = []; // Para mantener el orden aleatorio

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    // Crear elemento de audio global
    this.audioElement = document.createElement('audio');
    this.audioElement.id = 'wavaultGlobalAudio';
    document.body.appendChild(this.audioElement);

    // Obtener referencias a los elementos del player
    this.setupPlayerReferences();

    // Inicializar estado visual de los botones
    this.updatePlayButton();
    this.updateLoopButton();
    this.updateShuffleButton();

    // Cargar beat guardado en localStorage si existe
    this.loadSavedBeat();

    // Configurar event listeners
    this.setupEventListeners();

    // Sincronizar con cambios en localStorage
    window.addEventListener('storage', (e) => {
      if (e.key === 'wavaultCurrentBeat') {
        this.loadSavedBeat();
      }
    });
  }

  setupPlayerReferences() {
    // Obtener el wrapper y luego buscar elementos dentro de él
    const wrapper = document.querySelector('.player-wrapper');
    
    this.elements = {
      wrapper: wrapper,
      playPauseBtn: wrapper?.querySelector('#playPauseBtn'),
      prevBtn: wrapper?.querySelector('#prevBtn'),
      nextBtn: wrapper?.querySelector('#nextBtn'),
      loopBtn: wrapper?.querySelector('#loopBtn'),
      playlistBtn: wrapper?.querySelector('#playlistBtn'),
      shuffleBtn: wrapper?.querySelector('#shuffleBtn'),
      progressSlider: wrapper?.querySelector('#progressSlider'),
      currentTime: wrapper?.querySelector('#currentTime'),
      duration: wrapper?.querySelector('#duration'),
      volumeSlider: wrapper?.querySelector('#volumeSlider'),
      volumeBtn: wrapper?.querySelector('#volumeBtn'),
      playerTitle: wrapper?.querySelector('#playerTitle'),
      playerArtist: wrapper?.querySelector('#playerArtist'),
      playerMeta: wrapper?.querySelector('#playerMeta'),
      playerCover: wrapper?.querySelector('#playerCover'),
      progressFill: wrapper?.querySelector('#progressFill')
    };
    
    console.log('🔍 setupPlayerReferences - Elementos encontrados en .player-wrapper:');
    Object.keys(this.elements).forEach(key => {
      const found = this.elements[key] ? '✅' : '❌';
      console.log(`  ${found} ${key}:`, this.elements[key]);
    });
  }

  loadSavedBeat() {
    const saved = localStorage.getItem('wavaultCurrentBeat');
    if (saved) {
      try {
        const beat = JSON.parse(saved);
        // No autoplays al entrar: solo carga el beat guardado
        this.setBeat(beat, true, false);
      } catch (e) {
        console.error('Error loading saved beat:', e);
      }
    }
  }

  setBeat(beat, addToPlaylist = true, autoPlay = true) {
    console.log('🎯 setBeat() llamado con:', beat);
    
    this.currentBeat = beat;
    this.autoPlayOnSet = autoPlay;
    this.currentSources = [];
    this.currentSourceIndex = 0;
    
    // Construir lista de fuentes: principal + posibles fallbacks
    const sources = [];
    if (beat.archivo) sources.push(beat.archivo);
    if (Array.isArray(beat.fallbacks)) {
      sources.push(...beat.fallbacks.filter(Boolean));
    }
    // Filtrar duplicados manteniendo orden de prioridad
    this.currentSources = [...new Set(sources.filter(Boolean))];
    localStorage.setItem('wavaultCurrentBeat', JSON.stringify(beat));

    // Añadir a playlist
    if (addToPlaylist && !this.playlist.find(b => b.id === beat.id)) {
      this.playlist.push(beat);
      this.currentIndex = this.playlist.length - 1;
    }

    // Actualizar interfaz
    console.log('📝 Actualizando interfaz del player...');
    console.log('  playerTitle elemento:', this.elements.playerTitle);
    console.log('  beat.nombre:', beat.nombre);
    
    if (this.elements.playerTitle) {
      this.elements.playerTitle.textContent = beat.nombre || 'Sin título';
      console.log('✅ playerTitle actualizado a:', this.elements.playerTitle.textContent);
    } else {
      console.warn('⚠️ playerTitle no encontrado');
    }
    
    if (this.elements.playerArtist) {
      this.elements.playerArtist.textContent = beat.productor || 'Productor desconocido';
      console.log('✅ playerArtist actualizado a:', this.elements.playerArtist.textContent);
    } else {
      console.warn('⚠️ playerArtist no encontrado');
    }
    
    if (this.elements.playerMeta) {
      const bpm = beat.bpm || '-';
      const key = beat.key || '-';
      this.elements.playerMeta.textContent = `${bpm} BPM • ${key} KEY`;
      console.log('✅ playerMeta actualizado a:', this.elements.playerMeta.textContent);
    }
    
    if (this.elements.playerCover) {
      this.elements.playerCover.src = beat.portada || '/assets/img/placeholder.jpg';
      console.log('✅ playerCover actualizado a:', this.elements.playerCover.src);
    }

    // Configurar audio (URL segura: codifica espacios y '#')
    if (this.audioElement) {
      if (this.currentSources.length === 0) {
        console.warn('⚠️ setBeat: no hay fuentes de audio disponibles');
      } else {
        this.setAudioSource(this.currentSources[0]);
      }
    }

    // Reproducir automáticamente (con manejo de error para CORS/autoplay)
    if (autoPlay) {
      console.log('🎵 Intentando reproducir...');
      this.play().catch(error => {
        console.warn('⚠️ Autoplay bloqueado por navegador, requiere interacción:', error);
      });
    } else {
      this.isPlaying = false;
      this.updatePlayButton();
    }
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  updateProgress() {
    if (!this.audioElement) {
      console.warn('⚠️ updateProgress: audioElement no existe');
      return;
    }

    const percent = (this.audioElement.currentTime / this.audioElement.duration) * 100 || 0;
    
    console.log('📈 updateProgress:', {
      currentTime: this.audioElement.currentTime,
      duration: this.audioElement.duration,
      percent: percent,
      progressFill: this.elements.progressFill,
      progressSlider: this.elements.progressSlider
    });
    
    if (this.elements.progressFill) {
      this.elements.progressFill.style.width = percent + '%';
      console.log('  ✅ progressFill.width =', percent + '%');
    } else {
      console.warn('  ❌ progressFill no existe');
    }
    
    if (this.elements.progressSlider) {
      this.elements.progressSlider.value = percent;
      console.log('  ✅ progressSlider.value =', percent);
    } else {
      console.warn('  ❌ progressSlider no existe');
    }
    
    if (this.elements.currentTime) {
      this.elements.currentTime.textContent = this.formatTime(this.audioElement.currentTime);
      console.log('  ✅ currentTime.textContent =', this.elements.currentTime.textContent);
    } else {
      console.warn('  ❌ currentTime no existe');
    }
  }

  setAudioSource(rawSrc) {
    if (!this.audioElement) return;
    const escapedSrc = (rawSrc || '').replace(/#/g, '%23').replace(/ /g, '%20');
    const resolved = escapedSrc.startsWith('http')
      ? escapedSrc
      : `${window.location.origin}${escapedSrc.startsWith('/') ? '' : '/'}${escapedSrc}`;
    const urlObj = new URL(resolved);
    const safeSrc = urlObj.toString();
    this.audioElement.src = safeSrc;
    this.audioElement.load();
    console.log('✅ Audio configurado:', safeSrc);
    this.resetProgress();
  }

  resetProgress() {
    if (this.elements.progressFill) this.elements.progressFill.style.width = '0%';
    if (this.elements.progressSlider) this.elements.progressSlider.value = 0;
    if (this.elements.currentTime) this.elements.currentTime.textContent = '0:00';
    if (this.elements.duration) this.elements.duration.textContent = '0:00';
  }

  play() {
    if (!this.audioElement || !this.audioElement.src) {
      console.warn('⚠️ No audio element or src configured');
      return Promise.reject('No audio source');
    }
    
    console.log('🎵 Play called, audio src:', this.audioElement.src);
    const playPromise = this.audioElement.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('✅ Audio playing successfully');
          this.isPlaying = true;
          this.updatePlayButton();
        })
        .catch(error => {
          console.error('❌ Play error:', error);
          this.isPlaying = false;
          this.updatePlayButton();
        });
    } else {
      this.isPlaying = true;
      this.updatePlayButton();
    }
    
    return playPromise || Promise.resolve();
  }

  pause() {
    if (!this.audioElement) return;
    
    this.audioElement.pause();
    this.isPlaying = false;
    this.updatePlayButton();
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  updatePlayButton() {
    // Buscar específicamente dentro del player-wrapper para evitar duplicados
    const wrapper = document.querySelector('.player-wrapper');
    if (!wrapper) {
      console.warn('⚠️ updatePlayButton: .player-wrapper no encontrado');
      return;
    }
    
    const btn = wrapper.querySelector('.play-pause-btn');
    if (!btn) {
      console.warn('⚠️ updatePlayButton: .play-pause-btn no encontrado');
      return;
    }
    
    // Recrear el contenido del botón con el icono correcto
    const iconClass = this.isPlaying ? 'fas fa-pause' : 'fas fa-play';
    btn.innerHTML = `<i class="${iconClass}"></i>`;
    
    console.log(`🔘 Botón actualizado: ${this.isPlaying ? '⏸️ PAUSA' : '▶️ PLAY'}`);
  }

  seekTo(percent) {
    if (!this.audioElement || !this.audioElement.duration) return;
    
    const time = (percent / 100) * this.audioElement.duration;
    this.audioElement.currentTime = time;
  }

  setVolume(value) {
    if (!this.audioElement) return;
    this.audioElement.volume = value / 100;
  }

  nextTrack() {
    if (this.playlist.length === 0) return;
    
    this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
    this.setBeat(this.playlist[this.currentIndex], false);
  }

  prevTrack() {
    if (this.playlist.length === 0) return;
    
    this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
    this.setBeat(this.playlist[this.currentIndex], false);
  }

  toggleLoop() {
    const oldMode = this.loopMode;
    this.loopMode = this.loopMode === 0 ? 1 : 0; // Alternar entre OFF (0) y ONE (1)
    console.log(`🔄 toggleLoop: ${oldMode} → ${this.loopMode}`);
    this.updateLoopButton();
    return this.loopMode;
  }

  updateLoopButton() {
    console.log('🔄 updateLoopButton llamado, loopMode:', this.loopMode);
    
    const wrapper = document.querySelector('.player-wrapper');
    if (!wrapper) {
      console.warn('⚠️ updateLoopButton: wrapper no encontrado');
      return;
    }
    
    const loopBtn = wrapper.querySelector('#loopBtn');
    if (!loopBtn) {
      console.warn('⚠️ updateLoopButton: loopBtn no encontrado');
      return;
    }
    
    console.log('✅ loopBtn encontrado:', loopBtn);

    // Limpiar estilos previos
    loopBtn.classList.remove('active');
    loopBtn.style.opacity = '';
    loopBtn.style.color = '';
    
    if (this.loopMode === 0) {
      // OFF - apagado
      loopBtn.style.opacity = '0.5';
      loopBtn.innerHTML = '<i class="fas fa-redo"></i>';
      console.log('🔘 Loop: OFF (apagado)');
    } else {
      // REPEAT ONE - brillante rosa
      loopBtn.classList.add('active');
      loopBtn.style.opacity = '1';
      loopBtn.style.color = '#ec4899';
      loopBtn.innerHTML = '<i class="fas fa-redo"></i><span style="font-size: 0.7rem; margin-left: -0.4rem;">1</span>';
      console.log('🔘 Loop: REPEAT ONE (rosa, repite infinitamente)');
    }
  }

  // Shuffle deshabilitado
  toggleShuffle() {
    this.shuffleMode = false;
    return this.shuffleMode;
  }

  updateShuffleButton() {
    return;
  }

  nextTrackShuffled() {
    return this.nextTrack();
  }

  prevTrackShuffled() {
    return this.prevTrack();
  }

  togglePlaylist() { return; }

  closePlaylist() { return; }

  renderPlaylist() {
    const container = document.getElementById('playlistTracks');
    if (!container) return;
    
    if (this.playlist.length === 0) {
      container.innerHTML = `
        <div class="playlist-empty">
          <div class="playlist-empty-icon">
            <i class="fas fa-music"></i>
          </div>
          <p>Playlist vacía. Añade beats desde la página principal.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.playlist.map((beat, index) => {
      const isActive = index === this.currentIndex ? 'active' : '';
      return `
        <div class="playlist-track ${isActive}" data-index="${index}">
          <img src="${beat.portada || '/assets/img/placeholder.jpg'}" alt="Cover" class="playlist-track-cover">
          <div class="playlist-track-info">
            <p class="playlist-track-title">${beat.nombre || 'Sin título'}</p>
            <p class="playlist-track-artist">${beat.productor || 'Productor desconocido'}</p>
          </div>
          <button class="playlist-track-remove" data-index="${index}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
    }).join('');

    // Agregar listeners
    container.querySelectorAll('.playlist-track').forEach(el => {
      el.addEventListener('click', (e) => {
        if (!e.target.closest('.playlist-track-remove')) {
          const index = parseInt(el.dataset.index);
          this.currentIndex = index;
          this.setBeat(this.playlist[index], false);
          this.renderPlaylist();
        }
      });
    });

    container.querySelectorAll('.playlist-track-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.dataset.index);
        this.removeFromPlaylist(index);
      });
    });
  }

  removeFromPlaylist(index) {
    if (index < 0 || index >= this.playlist.length) return;
    
    this.playlist.splice(index, 1);
    
    // Ajustar índice actual si es necesario
    if (this.currentIndex >= this.playlist.length) {
      this.currentIndex = Math.max(0, this.playlist.length - 1);
    }
    
    this.renderPlaylist();
  }

  addToPlaylist(beat) {
    if (!this.playlist.find(b => b.id === beat.id)) {
      this.playlist.push(beat);
      console.log('✅ Beat añadido a la playlist:', beat.nombre);
    }
  }

  setupEventListeners() {
    if (!this.audioElement) return;
    
    console.log('🔧 setupEventListeners - Registrando event listeners...');

    // Audio events
    this.audioElement.addEventListener('loadedmetadata', () => {
      if (this.elements.duration) {
        this.elements.duration.textContent = this.formatTime(this.audioElement.duration);
      }
    });

    this.audioElement.addEventListener('timeupdate', () => {
      console.log('📊 timeupdate: currentTime =', this.audioElement.currentTime);
      this.updateProgress();
    });

    this.audioElement.addEventListener('ended', () => {
      if (this.loopMode === 1) {
        // Loop one - repetir infinitamente el mismo beat
        this.audioElement.currentTime = 0;
        this.play();
      } else {
        // No loop - detener
        this.isPlaying = false;
        this.updatePlayButton();
        this.resetProgress();
      }
    });

    // Eventos de play/pause del elemento audio
    this.audioElement.addEventListener('play', () => {
      this.isPlaying = true;
      this.updatePlayButton();
      console.log('🎵 Audio evento play - ícono actualizado a pausa');
    });

    this.audioElement.addEventListener('pause', () => {
      this.isPlaying = false;
      this.updatePlayButton();
      console.log('⏸️ Audio evento pause - ícono actualizado a play');
    });

    // Intentar siguiente fuente si hay error de carga (404, etc.)
    this.audioElement.addEventListener('error', () => {
      const nextIndex = this.currentSourceIndex + 1;
      if (nextIndex < this.currentSources.length) {
        const nextSrc = this.currentSources[nextIndex];
        console.warn('⚠️ Error de audio, probando fallback:', nextSrc);
        this.currentSourceIndex = nextIndex;
        this.setAudioSource(nextSrc);
        if (this.autoPlayOnSet) {
          this.play().catch(err => console.error('❌ Play error en fallback:', err));
        }
      } else {
        console.error('❌ Sin más fuentes disponibles para este beat');
      }
    });

    // Player controls
    if (this.elements.playPauseBtn) {
      this.elements.playPauseBtn.addEventListener('click', () => this.togglePlay());
    }

    if (this.elements.prevBtn) {
      this.elements.prevBtn.addEventListener('click', () => {
        this.prevTrack();
      });
    }

    if (this.elements.nextBtn) {
      this.elements.nextBtn.addEventListener('click', () => {
        this.nextTrack();
      });
    }

    if (this.elements.loopBtn) {
      this.elements.loopBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🖱️ Click en loopBtn detectado');
        this.toggleLoop();
      });
      console.log('✅ Event listener de loop registrado');
    } else {
      console.warn('⚠️ loopBtn no encontrado, no se puede registrar listener');
    }

    // Shuffle y playlist deshabilitados

    if (this.elements.progressSlider) {
      this.elements.progressSlider.addEventListener('input', (e) => {
        this.seekTo(e.target.value);
      });
    }

    if (this.elements.volumeSlider) {
      this.elements.volumeSlider.addEventListener('input', (e) => {
        this.setVolume(e.target.value);
      });
    }

    // Volumen inicial
    if (this.elements.volumeSlider) {
      this.setVolume(this.elements.volumeSlider.value);
    }

    // Playlist modal deshabilitada
  }

  /**
   * Método público para reproducir un beat desde cualquier página
   * Se llama desde los cards cuando hacen click
   */
  static playBeat(beat) {
    if (!window.wavaultPlayer) {
      window.wavaultPlayer = new WavaultPlayer();
    }
    window.wavaultPlayer.setBeat(beat);
  }

  static addToPlaylist(beat) {
    if (!window.wavaultPlayer) {
      window.wavaultPlayer = new WavaultPlayer();
    }
    window.wavaultPlayer.addToPlaylist(beat);
  }
}

// Inicializar player global
window.wavaultPlayer = new WavaultPlayer();
