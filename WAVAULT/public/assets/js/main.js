let allBeats = [];
let currentAudio = null;
let currentUser = null;
let currentBeat = null;

async function loadBeatsFromAPI() {
  try {
    const response = await fetch('/beats');
    const beats = await response.json();
    allBeats = beats;
    return beats;
  } catch (error) {
    console.error('Error cargando beats:', error);
    return [];
  }
}

function createBeatCard(beat) {
  const coverUrl = beat.cover ? `/${beat.cover}` : 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop';
  
  const isProducer = currentUser && currentUser.rol === 'productor';
  const isOwnBeat = currentUser && beat.producer === currentUser.email;
  
  let actionButtons = '';
  if (!isProducer || !isOwnBeat) {
    if (currentUser && currentUser.rol === 'cliente') {
      actionButtons = `
        <button class="add-to-cart-btn" onclick="addToCart(${beat.id}, event)" style="width: 100%; padding: 0.75rem; background: linear-gradient(135deg, #6366f1, #ec4899); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; margin-top: 1rem; transition: all 0.3s ease;">
          <i class="fas fa-shopping-cart"></i> Agregar al Carrito
        </button>
      `;
    }
  }
  
  return `
    <div class="beat-card">
      <div class="beat-card-image" style="background-image: url('${coverUrl}'); background-size: cover; background-position: center;">
        <div class="beat-card-overlay">
          <button class="play-btn" data-beat-id="${beat.id}">
            <i class="fas fa-play"></i>
          </button>
        </div>
      </div>
      <div class="beat-info">
        <div class="beat-header">
          <h3>${beat.title}</h3>
          <div class="beat-price">$${beat.price || 0}</div>
        </div>
        <p style="color: var(--gray); font-size: 0.9rem; margin-bottom: 0.5rem;">
          <i class="fas fa-user"></i> ${beat.producer || beat.artist || 'Unknown'}
        </p>
        <div class="beat-meta">
          <span title="Beats Per Minute">
            <i class="fas fa-tachometer-alt"></i> ${beat.bpm || 0} BPM
          </span>
          <span title="Tonalidad">
            <i class="fas fa-music"></i> ${beat.key || '-'}
          </span>
        </div>
        <div class="beat-tags">
          ${beat.tags ? beat.tags.split(',').map(tag => `<span class="tag">${tag.trim()}</span>`).join('') : `<span class="tag">${beat.type || 'Beat'}</span>`}
        </div>
        ${actionButtons}
      </div>
    </div>
  `;
}

function loadBeats(beatsToShow) {
  const feed = document.getElementById("beatFeed");
  feed.innerHTML = "";

  if (beatsToShow.length === 0) {
    feed.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--gray);">
        <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; display: block; opacity: 0.5;"></i>
        <p style="font-size: 1.1rem;">No se encontraron beats disponibles</p>
      </div>
    `;
    return;
  }

  beatsToShow.forEach(beat => {
    feed.innerHTML += createBeatCard(beat);
  });
}

function playBeat(beat, event) {
  if (event) event.stopPropagation();
  
  console.log('🎵 playBeat called:', beat);
  
  currentBeat = beat;
  
  // Usar demo si existe, si no usar el audio original
  const audioPath = beat.demo || beat.audio;
  console.log('🎵 Audio path:', audioPath);
  
  if (!audioPath) {
    console.error('❌ No audio path found');
    alert('Este beat no tiene audio disponible');
    return;
  }
  
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  
  const cleanPath = audioPath.startsWith('/') ? audioPath : `/${audioPath}`;
  console.log('🎵 Clean audio path:', cleanPath);
  
  currentAudio = new Audio(cleanPath);
  currentAudio.volume = 0.8;
  
  // Actualizar UI del reproductor
  const player = document.getElementById('globalPlayer');
  const coverImg = document.getElementById('playerCover');
  const title = document.getElementById('playerTitle');
  const artist = document.getElementById('playerArtist');
  const playPauseBtn = document.getElementById('playPauseBtn');
  
  if (!player) {
    console.error('❌ Global player not found');
    return;
  }
  
  console.log('✅ Player found, updating UI...');
  
  coverImg.src = beat.cover ? `/${beat.cover}` : 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop';
  title.textContent = beat.title;
  artist.textContent = beat.producer || beat.artist || 'Unknown';
  
  player.style.display = 'block';
  console.log('✅ Player visible');
  
  currentAudio.play()
    .then(() => {
      console.log('✅ Audio playing');
      playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    })
    .catch(error => {
      console.error('❌ Error playing audio:', error);
      alert('Error al reproducir: ' + error.message);
    });
  
  // Event listeners para el audio
  currentAudio.addEventListener('timeupdate', updateProgress);
  currentAudio.addEventListener('ended', () => {
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  });
  currentAudio.addEventListener('loadedmetadata', () => {
    document.getElementById('duration').textContent = formatTime(currentAudio.duration);
  });
  currentAudio.addEventListener('error', (e) => {
    console.error('❌ Audio error:', e, currentAudio.error);
    alert('Error cargando el audio');
  });
  
  console.log(`🎵 Reproduciendo: ${beat.title} - ${beat.artist || beat.producer}`);
}

function togglePlayPause() {
  if (!currentAudio) return;
  
  const playPauseBtn = document.getElementById('playPauseBtn');
  
  if (currentAudio.paused) {
    currentAudio.play();
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
  } else {
    currentAudio.pause();
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  }
}

function updateProgress() {
  if (!currentAudio) return;
  
  const progress = (currentAudio.currentTime / currentAudio.duration) * 100;
  document.getElementById('progressFill').style.width = progress + '%';
  document.getElementById('progressSlider').value = progress;
  document.getElementById('currentTime').textContent = formatTime(currentAudio.currentTime);
}

function seekAudio(value) {
  if (!currentAudio) return;
  const time = (value / 100) * currentAudio.duration;
  currentAudio.currentTime = time;
}

function changeVolume(value) {
  if (!currentAudio) return;
  currentAudio.volume = value / 100;
  
  const volumeBtn = document.getElementById('volumeBtn');
  if (value == 0) {
    volumeBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
  } else if (value < 50) {
    volumeBtn.innerHTML = '<i class="fas fa-volume-down"></i>';
  } else {
    volumeBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
  }
}

function toggleMute() {
  const volumeSlider = document.getElementById('volumeSlider');
  if (volumeSlider.value > 0) {
    volumeSlider.dataset.previousVolume = volumeSlider.value;
    volumeSlider.value = 0;
  } else {
    volumeSlider.value = volumeSlider.dataset.previousVolume || 80;
  }
  changeVolume(volumeSlider.value);
}

function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function addToCart(beatId, event) {
  if (event) event.stopPropagation();
  
  const beat = allBeats.find(b => b.id === beatId);
  if (!beat) return;
  
  let cart = JSON.parse(localStorage.getItem('carrito')) || [];
  
  if (cart.find(item => item.id === beatId)) {
    alert('Este beat ya está en tu carrito');
    return;
  }
  
  cart.push(beat);
  localStorage.setItem('carrito', JSON.stringify(cart));
  
  alert('✅ Beat agregado al carrito');
}

function checkUserSession() {
  const usuario = JSON.parse(localStorage.getItem('usuarioActivo'));
  currentUser = usuario;
  
  if (usuario) {
    const nav = document.getElementById('mainNav');
    if (usuario.rol === 'productor') {
      nav.innerHTML = `
        <a href="#" class="nav-link">Explorar</a>
        <a href="/dashboard/producer.html" class="nav-link">Mi Panel</a>
        <a href="#" onclick="logout()" class="nav-link btn-register">Cerrar Sesión</a>
      `;
    } else if (usuario.rol === 'cliente') {
      nav.innerHTML = `
        <a href="#" class="nav-link">Explorar</a>
        <a href="/dashboard/client.html" class="nav-link">Mi Carrito</a>
        <a href="#" onclick="logout()" class="nav-link btn-register">Cerrar Sesión</a>
      `;
    }
  }
}

function logout() {
  localStorage.removeItem('usuarioActivo');
  window.location.reload();
}

document.addEventListener("DOMContentLoaded", async () => {
  console.log('🎵 WAVAULT Feed - Iniciando...');
  
  checkUserSession();
  console.log('👤 Usuario actual:', currentUser);
  
  console.log('📡 Cargando beats desde API...');
  const beats = await loadBeatsFromAPI();
  console.log('✅ Beats cargados:', beats.length);
  loadBeats(beats);

  // Event delegation para botones play
  document.addEventListener('click', (e) => {
    const playBtn = e.target.closest('.play-btn');
    if (playBtn) {
      e.stopPropagation();
      const beatId = parseInt(playBtn.getAttribute('data-beat-id'));
      const beat = allBeats.find(b => b.id === beatId);
      if (beat) {
        console.log('🎵 Click on play button, beat:', beat);
        playBeat(beat, e);
      }
    }
  });

  // Event listeners del reproductor con verificación
  const playPauseBtn = document.getElementById('playPauseBtn');
  const progressSlider = document.getElementById('progressSlider');
  const volumeSlider = document.getElementById('volumeSlider');
  const volumeBtn = document.getElementById('volumeBtn');
  
  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', togglePlayPause);
  }
  
  if (progressSlider) {
    progressSlider.addEventListener('input', (e) => {
      seekAudio(e.target.value);
    });
  }
  
  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      changeVolume(e.target.value);
    });
  }
  
  if (volumeBtn) {
    volumeBtn.addEventListener('click', toggleMute);
  }

  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const keyword = e.target.value.toLowerCase();
      const filtered = allBeats.filter(beat =>
        beat.title.toLowerCase().includes(keyword) ||
        (beat.producer && beat.producer.toLowerCase().includes(keyword)) ||
        (beat.artist && beat.artist.toLowerCase().includes(keyword)) ||
        (beat.tags && beat.tags.toLowerCase().includes(keyword))
      );
      loadBeats(filtered);
    });
  }

  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.getAttribute("data-filter");
      let filtered = allBeats;

      if (filter !== "all") {
        filtered = allBeats.filter(beat => 
          beat.type && beat.type.toLowerCase() === filter.toLowerCase()
        );
      }

      loadBeats(filtered);
    });
  });
});

