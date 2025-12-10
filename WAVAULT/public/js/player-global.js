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
    this.loopMode = 0; // 0: no loop, 1: loop all, 2: loop one

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
    this.elements = {
      wrapper: document.querySelector('.player-wrapper'),
      playPauseBtn: document.getElementById('playPauseBtn'),
      prevBtn: document.getElementById('prevBtn'),
      nextBtn: document.getElementById('nextBtn'),
      loopBtn: document.getElementById('loopBtn'),
      progressSlider: document.getElementById('progressSlider'),
      currentTime: document.getElementById('currentTime'),
      duration: document.getElementById('duration'),
      volumeSlider: document.getElementById('volumeSlider'),
      volumeBtn: document.getElementById('volumeBtn'),
      playerTitle: document.getElementById('playerTitle'),
      playerArtist: document.getElementById('playerArtist'),
      playerMeta: document.getElementById('playerMeta'),
      playerCover: document.getElementById('playerCover'),
      progressFill: document.getElementById('progressFill')
    };
  }

  loadSavedBeat() {
    const saved = localStorage.getItem('wavaultCurrentBeat');
    if (saved) {
      try {
        const beat = JSON.parse(saved);
        this.setBeat(beat);
      } catch (e) {
        console.error('Error loading saved beat:', e);
      }
    }
  }

  setBeat(beat, addToPlaylist = true) {
    this.currentBeat = beat;
    localStorage.setItem('wavaultCurrentBeat', JSON.stringify(beat));

    // Añadir a playlist
    if (addToPlaylist && !this.playlist.find(b => b.id === beat.id)) {
      this.playlist.push(beat);
      this.currentIndex = this.playlist.length - 1;
    }

    // Actualizar interfaz
    if (this.elements.playerTitle) this.elements.playerTitle.textContent = beat.nombre || 'Sin título';
    if (this.elements.playerArtist) this.elements.playerArtist.textContent = beat.productor || 'Productor desconocido';
    if (this.elements.playerMeta) {
      const bpm = beat.bpm || '-';
      const key = beat.key || '-';
      this.elements.playerMeta.textContent = `${bpm} BPM • ${key} KEY`;
    }
    if (this.elements.playerCover) {
      this.elements.playerCover.src = beat.portada || '/assets/img/placeholder.jpg';
    }

    // Configurar audio
    if (this.audioElement) {
      this.audioElement.src = beat.archivo || '';
      this.resetProgress();
    }

    // Reproducir automáticamente
    this.play();
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  updateProgress() {
    if (!this.audioElement) return;

    const percent = (this.audioElement.currentTime / this.audioElement.duration) * 100 || 0;
    
    if (this.elements.progressFill) {
      this.elements.progressFill.style.width = percent + '%';
    }
    if (this.elements.progressSlider) {
      this.elements.progressSlider.value = percent;
    }
    if (this.elements.currentTime) {
      this.elements.currentTime.textContent = this.formatTime(this.audioElement.currentTime);
    }
  }

  resetProgress() {
    if (this.elements.progressFill) this.elements.progressFill.style.width = '0%';
    if (this.elements.progressSlider) this.elements.progressSlider.value = 0;
    if (this.elements.currentTime) this.elements.currentTime.textContent = '0:00';
    if (this.elements.duration) this.elements.duration.textContent = '0:00';
  }

  play() {
    if (!this.audioElement || !this.audioElement.src) return;
    
    this.audioElement.play().catch(e => console.error('Error playing audio:', e));
    this.isPlaying = true;
    this.updatePlayButton();
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
    if (!this.elements.playPauseBtn) return;
    
    const icon = this.elements.playPauseBtn.querySelector('i');
    if (icon) {
      icon.className = this.isPlaying ? 'fas fa-pause' : 'fas fa-play';
    }
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
    this.loopMode = (this.loopMode + 1) % 3;
    this.updateLoopButton();
    return this.loopMode;
  }

  updateLoopButton() {
    if (!this.elements.loopBtn) return;
    
    const icon = this.elements.loopBtn.querySelector('i');
    if (!icon) return;

    this.elements.loopBtn.classList.remove('active');
    
    switch (this.loopMode) {
      case 1: // Loop all
        this.elements.loopBtn.classList.add('active');
        break;
      case 2: // Loop one
        if (icon.parentElement) {
          icon.parentElement.textContent = '';
          const span = document.createElement('span');
          span.innerHTML = '<i class="fas fa-redo"></i><span style="font-size: 0.7rem; margin-left: -0.4rem;">1</span>';
          icon.parentElement.innerHTML = span.innerHTML;
        }
        this.elements.loopBtn.classList.add('active');
        break;
      default: // No loop
        icon.className = 'fas fa-redo';
        break;
    }
  }

  setupEventListeners() {
    if (!this.audioElement) return;

    // Audio events
    this.audioElement.addEventListener('loadedmetadata', () => {
      if (this.elements.duration) {
        this.elements.duration.textContent = this.formatTime(this.audioElement.duration);
      }
    });

    this.audioElement.addEventListener('timeupdate', () => {
      this.updateProgress();
    });

    this.audioElement.addEventListener('ended', () => {
      if (this.loopMode === 2) {
        // Loop one
        this.audioElement.currentTime = 0;
        this.play();
      } else if (this.loopMode === 1) {
        // Loop all
        this.nextTrack();
      } else {
        // No loop
        this.isPlaying = false;
        this.updatePlayButton();
        this.resetProgress();
      }
    });

    // Player controls
    if (this.elements.playPauseBtn) {
      this.elements.playPauseBtn.addEventListener('click', () => this.togglePlay());
    }

    if (this.elements.prevBtn) {
      this.elements.prevBtn.addEventListener('click', () => this.prevTrack());
    }

    if (this.elements.nextBtn) {
      this.elements.nextBtn.addEventListener('click', () => this.nextTrack());
    }

    if (this.elements.loopBtn) {
      this.elements.loopBtn.addEventListener('click', () => this.toggleLoop());
    }

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
    if (!window.wavaultPlayer.playlist.find(b => b.id === beat.id)) {
      window.wavaultPlayer.playlist.push(beat);
    }
  }
}

// Inicializar player global
window.wavaultPlayer = new WavaultPlayer();
