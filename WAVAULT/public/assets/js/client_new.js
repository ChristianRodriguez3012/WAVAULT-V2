// Validar sesión activa
window.usuario = JSON.parse(localStorage.getItem("usuarioActivo"));
if (!usuario || usuario.rol !== "cliente") {
  alert("Acceso denegado. Inicia sesión como cliente.");
  window.location.href = "/login.html";
}

// Estado global
let allBeats = [];
let carrito = JSON.parse(localStorage.getItem(`carrito_${usuario.email}`)) || [];
let currentAudio = null;
let currentBeat = null;

// Cargar beats desde API
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

// Crear tarjeta de beat
function createBeatCard(beat) {
  const coverUrl = beat.cover ? `/${beat.cover}` : 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop';
  
  return `
    <div class="beat-card">
      <div class="beat-card-image" style="background-image: url('${coverUrl}'); background-size: cover; background-position: center;">
        <div class="beat-card-overlay">
          <button class="play-btn" onclick='playBeat(${JSON.stringify(beat)}, event)'>
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
            <i class="fas fa-tachometer-alt"></i> ${beat.bpm} BPM
          </span>
          <span title="Tonalidad">
            <i class="fas fa-music"></i> ${beat.key}
          </span>
        </div>
        <div class="beat-tags">
          ${beat.tags ? beat.tags.split(',').map(tag => `<span class="tag">${tag.trim()}</span>`).join('') : `<span class="tag">${beat.type || 'Beat'}</span>`}
        </div>
        <button class="add-to-cart-btn" onclick="agregarAlCarrito(${beat.id}, event)" style="width: 100%; padding: 0.75rem; background: linear-gradient(135deg, #6366f1, #ec4899); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; margin-top: 1rem; transition: all 0.3s ease;">
          <i class="fas fa-shopping-cart"></i> Agregar al Carrito
        </button>
      </div>
    </div>
  `;
}

// Renderizar beats
function renderizarBeats(beatsToShow = allBeats) {
  const contenedor = document.getElementById("beatsCliente");
  contenedor.innerHTML = "";

  if (beatsToShow.length === 0) {
    contenedor.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--gray);">
        <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; display: block; opacity: 0.5;"></i>
        <p style="font-size: 1.1rem;">No se encontraron beats disponibles</p>
      </div>
    `;
    return;
  }

  beatsToShow.forEach(beat => {
    contenedor.innerHTML += createBeatCard(beat);
  });
  
  actualizarContadorCarrito();
}

// Reproducir beat
function playBeat(beat, event) {
  if (event) event.stopPropagation();
  
  currentBeat = beat;
  const audioPath = beat.demo || beat.audio;
  
  if (currentAudio) {
    currentAudio.pause();
  }
  
  currentAudio = new Audio(`/${audioPath}`);
  currentAudio.volume = 0.8;
  
  const player = document.getElementById('globalPlayer');
  const coverImg = document.getElementById('playerCover');
  const title = document.getElementById('playerTitle');
  const artist = document.getElementById('playerArtist');
  const playPauseBtn = document.getElementById('playPauseBtn');
  
  coverImg.src = beat.cover ? `/${beat.cover}` : 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop';
  title.textContent = beat.title;
  artist.textContent = beat.producer || beat.artist || 'Unknown';
  
  player.style.display = 'block';
  currentAudio.play();
  playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
  
  currentAudio.addEventListener('timeupdate', updateProgress);
  currentAudio.addEventListener('ended', () => {
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  });
  currentAudio.addEventListener('loadedmetadata', () => {
    document.getElementById('duration').textContent = formatTime(currentAudio.duration);
  });
  
  console.log(`🎵 Reproduciendo: ${beat.title}`);
}

// Controles del reproductor
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

// Agregar al carrito
function agregarAlCarrito(beatId, event) {
  if (event) event.stopPropagation();
  
  const beat = allBeats.find(b => b.id === beatId);
  if (!beat) return;
  
  if (carrito.find(item => item.id === beatId)) {
    alert('Este beat ya está en tu carrito');
    return;
  }
  
  carrito.push(beat);
  localStorage.setItem(`carrito_${usuario.email}`, JSON.stringify(carrito));
  actualizarContadorCarrito();
  
  alert('✅ Beat agregado al carrito');
}

// Actualizar contador del carrito
function actualizarContadorCarrito() {
  const contador = document.getElementById('carritoContador');
  if (contador) {
    contador.textContent = carrito.length;
  }
}

// Renderizar carrito
function renderizarCarrito() {
  const contenedor = document.getElementById('carritoItems');
  const totalElem = document.getElementById('carritoTotal');
  
  if (carrito.length === 0) {
    contenedor.innerHTML = '<p style="text-align: center; color: #64748b; padding: 2rem;">Tu carrito está vacío</p>';
    totalElem.textContent = '0';
    return;
  }
  
  let total = 0;
  contenedor.innerHTML = '';
  
  carrito.forEach((beat, index) => {
    total += parseFloat(beat.price) || 0;
    
    const div = document.createElement('div');
    div.style.cssText = 'background: white; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; display: flex; gap: 1rem; align-items: center;';
    div.innerHTML = `
      <img src="/${beat.cover}" style="width: 60px; height: 60px; border-radius: 4px; object-fit: cover;">
      <div style="flex: 1;">
        <h4 style="margin: 0; color: #1e293b;">${beat.title}</h4>
        <p style="margin: 0; color: #64748b; font-size: 0.9rem;">${beat.producer}</p>
      </div>
      <div style="text-align: right;">
        <p style="margin: 0; font-size: 1.2rem; font-weight: 700; color: #6366f1;">$${beat.price}</p>
        <button onclick="eliminarDelCarrito(${index})" style="margin-top: 0.5rem; padding: 0.25rem 0.75rem; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">
          <i class="fas fa-trash"></i> Eliminar
        </button>
      </div>
    `;
    contenedor.appendChild(div);
  });
  
  totalElem.textContent = total.toFixed(2);
}

// Eliminar del carrito
function eliminarDelCarrito(index) {
  carrito.splice(index, 1);
  localStorage.setItem(`carrito_${usuario.email}`, JSON.stringify(carrito));
  renderizarCarrito();
  actualizarContadorCarrito();
}

// Vaciar carrito
function vaciarCarrito() {
  if (confirm('¿Estás seguro de vaciar tu carrito?')) {
    carrito = [];
    localStorage.setItem(`carrito_${usuario.email}`, JSON.stringify(carrito));
    renderizarCarrito();
    actualizarContadorCarrito();
  }
}

// Pagar
function pagar() {
  if (carrito.length === 0) {
    alert('Tu carrito está vacío');
    return;
  }
  
  const total = carrito.reduce((sum, beat) => sum + (parseFloat(beat.price) || 0), 0);
  
  if (confirm(`¿Proceder al pago de $${total.toFixed(2)}?`)) {
    // Registrar venta en el servidor
    fetch('/registrar-venta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        comprador: usuario.email,
        beats: carrito
      })
    })
    .then(res => res.json())
    .then(data => {
      // Guardar en historial
      const compra = {
        fecha: new Date().toISOString(),
        beats: [...carrito],
        total: total
      };
      
      let historial = JSON.parse(localStorage.getItem(`compras_${usuario.email}`)) || [];
      historial.push(compra);
      localStorage.setItem(`compras_${usuario.email}`, JSON.stringify(historial));
      
      // Vaciar carrito
      carrito = [];
      localStorage.setItem(`carrito_${usuario.email}`, JSON.stringify(carrito));
      
      alert('✅ ¡Compra realizada con éxito!');
      renderizarCarrito();
      actualizarContadorCarrito();
    })
    .catch(error => {
      console.error('Error:', error);
      alert('❌ Error al procesar el pago');
    });
  }
}

// Renderizar historial
function renderizarHistorial() {
  const contenedor = document.getElementById('historialCompras');
  const historial = JSON.parse(localStorage.getItem(`compras_${usuario.email}`)) || [];
  
  if (historial.length === 0) {
    contenedor.innerHTML = '<p style="color: #64748b;">No tienes compras registradas</p>';
    return;
  }
  
  contenedor.innerHTML = '';
  
  historial.reverse().forEach((compra, index) => {
    const fecha = new Date(compra.fecha).toLocaleDateString();
    const div = document.createElement('div');
    div.style.cssText = 'background: white; padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem;';
    div.innerHTML = `
      <h4 style="margin: 0 0 1rem 0; color: #1e293b;">Compra del ${fecha}</h4>
      <p style="margin: 0 0 0.5rem 0; font-weight: 600; color: #6366f1;">Total: $${compra.total.toFixed(2)}</p>
      <div style="color: #64748b;">
        ${compra.beats.map(b => `<p style="margin: 0.25rem 0;">• ${b.title} - ${b.producer}</p>`).join('')}
      </div>
    `;
    contenedor.appendChild(div);
  });
}

// Inicialización
document.addEventListener("DOMContentLoaded", async () => {
  console.log('🎧 Cliente WAVAULT iniciado');
  
  // Cargar beats
  const beats = await loadBeatsFromAPI();
  renderizarBeats(beats);
  actualizarContadorCarrito();
  
  // Búsqueda
  const searchInput = document.getElementById("buscarBeatsCliente");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const keyword = e.target.value.toLowerCase();
      const filtered = allBeats.filter(beat =>
        beat.title.toLowerCase().includes(keyword) ||
        (beat.producer && beat.producer.toLowerCase().includes(keyword)) ||
        (beat.tags && beat.tags.toLowerCase().includes(keyword))
      );
      renderizarBeats(filtered);
    });
  }
});
