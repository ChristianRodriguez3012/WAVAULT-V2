// ✅ Validar sesión activa
const usuario = JSON.parse(localStorage.getItem("usuarioActivo"));
if (!usuario || usuario.rol !== "cliente") {
  alert("Acceso denegado. Inicia sesión como cliente.");
  window.location.href = "../login.html";
}

// 🧠 Estado del cliente
let beats = [];
let carrito = JSON.parse(localStorage.getItem(`carrito_${usuario.email}`)) || [];
let historial = JSON.parse(localStorage.getItem(`compras_${usuario.email}`)) || [];
let playlist = [];
let historialReproduccion = [];
let currentIndex = -1;

// ✅ Mostrar secciones
function mostrarSeccion(seccion) {
  document.querySelectorAll(".cliente-section").forEach(s => s.style.display = "none");
  const sectionElem = document.getElementById(`${seccion}Section`);
  if (sectionElem) sectionElem.style.display = "block";

  if (seccion === "carrito") renderizarCarrito();
  if (seccion === "perfil") renderizarHistorial();
}

// ✅ Renderizar el feed de beats
function renderizarBeats(lista = beats) {
  const contenedor = document.getElementById("beatsCliente");
  contenedor.innerHTML = "";

  if (!lista.length) {
    contenedor.innerHTML = "<p>No hay beats disponibles.</p>";
    return;
  }

  playlist = lista.filter(b => b.audio?.startsWith("uploads/") || b.demo?.startsWith("uploads/"));

  lista.forEach((beat, i) => {
    const cover = beat.cover?.startsWith("uploads/") ? `/${beat.cover}` : "assets/img/placeholder.jpg";
    const audio = beat.demo?.startsWith("uploads/") ? `/${beat.demo}` :
                  beat.audio?.startsWith("uploads/") ? `/${beat.audio}` : null;
    const title = beat.title ?? "Sin título";
    const price = isNaN(beat.price) ? 0 : Number(beat.price).toFixed(2);
    const producer = beat.producer ?? "Desconocido";
    const tags = beat.tags ? beat.tags.split(',').map(t => `#${t.trim()}`).join(' ') : "Sin tags";
    const bpm = beat.bpm ? `${beat.bpm} BPM` : "BPM desconocido";
    const key = beat.key ?? "Key desconocida";

    const div = document.createElement("div");
    div.className = "beat-card";
    div.innerHTML = `
      <img src="${cover}" alt="${title}" />
      <div class="beat-info">
        <h3 class="titulo-beat" data-id="${beat.id}" style="cursor:pointer; color:#1a73e8;">${title}</h3>
        <p>👤 <span class="nombre-prod" data-prod="${producer}" style="cursor:pointer; color:#1a73e8;">${producer}</span></p>
        <p>💰 $${price}</p>
        <p>🏷️ ${tags}</p>
        <p>🎼 ${bpm} • ${key}</p>
        ${audio ? `
          <button class="play-btn" data-index="${i}">▶️ Reproducir</button>
          <button onclick="agregarAlCarrito(${beat.id})" style="margin-top: 8px;">🛒 Agregar al carrito</button>
        ` : `<p><em>Sin archivo de audio.</em></p>`}
      </div>
    `;
    contenedor.appendChild(div);
  });

  // 🎧 Eventos de reproducción
  document.querySelectorAll('.play-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      reproducirBeat(index);
    });
  });

  // 🔗 Título redirige al beat
  document.querySelectorAll('.titulo-beat').forEach(h3 => {
    h3.addEventListener('click', () => {
      const id = h3.dataset.id;
      window.location.href = `/beat.html?id=${id}`;
    });
  });

  // 🔗 Nombre del productor redirige al perfil
  document.querySelectorAll('.nombre-prod').forEach(span => {
    span.addEventListener('click', () => {
      const prod = span.dataset.prod;
      window.location.href = `/perfil.html?productor=${encodeURIComponent(prod)}`;
    });
  });
}


// ✅ Reproductor
const audioPlayer = document.getElementById("audioPlayer");
const playerCover = document.getElementById("playerCover");
const playerTitle = document.getElementById("playerTitle");
const playerProducer = document.getElementById("playerProducer");
const playerBar = document.getElementById("reproductorGlobal");
const playPauseBtn = document.getElementById("playPauseBtn");
const btnPrev = document.getElementById("btnPrev");
const btnNext = document.getElementById("btnNext");
const progressBar = document.getElementById("progressBar");
const volumeControl = document.getElementById("volumeControl");
const currentTimeSpan = document.getElementById("currentTime");

function reproducirBeat(index) {
  const beat = playlist[index];
  if (!beat) return;

  const audio = `/${beat.demo || beat.audio}`;
  audioPlayer.src = audio;
  playerCover.src = `/${beat.cover}`;
  playerTitle.innerHTML = `<a href="/beat.html?id=${beat.id}" style="color:#fff; text-decoration:underline;">${beat.title}</a>`;
  playerProducer.innerHTML = `<a href="/perfil.html?productor=${encodeURIComponent(beat.producer)}" style="color:#ccc; text-decoration:underline;">${beat.producer}</a>`;
  audioPlayer.play();
  playPauseBtn.textContent = "⏸";
  playerBar.style.display = "flex";

  currentIndex = index;
  historialReproduccion.push(index);
}

playPauseBtn.addEventListener("click", () => {
  if (audioPlayer.paused) {
    audioPlayer.play();
    playPauseBtn.textContent = "⏸";
  } else {
    audioPlayer.pause();
    playPauseBtn.textContent = "⏵";
  }
});

btnPrev.addEventListener("click", () => {
  if (historialReproduccion.length > 1) {
    historialReproduccion.pop();
    const prevIndex = historialReproduccion.pop();
    if (typeof prevIndex === 'number') {
      reproducirBeat(prevIndex);
    }
  }
});

btnNext.addEventListener("click", () => {
  if (playlist.length === 0) return;
  let nuevoIndex;
  do {
    nuevoIndex = Math.floor(Math.random() * playlist.length);
  } while (historialReproduccion.length > 1 && nuevoIndex === historialReproduccion[historialReproduccion.length - 1]);
  reproducirBeat(nuevoIndex);
});

progressBar.addEventListener("input", () => {
  audioPlayer.currentTime = progressBar.value;
});

volumeControl.addEventListener("input", () => {
  audioPlayer.volume = volumeControl.value;
});

audioPlayer.addEventListener("timeupdate", () => {
  progressBar.max = audioPlayer.duration || 0;
  progressBar.value = audioPlayer.currentTime;

  const minutes = Math.floor(audioPlayer.currentTime / 60);
  const seconds = Math.floor(audioPlayer.currentTime % 60).toString().padStart(2, '0');
  currentTimeSpan.textContent = `${minutes}:${seconds}`;
});

audioPlayer.addEventListener("ended", () => {
  btnNext.click();
});

// ✅ Cargar beats desde el servidor
async function cargarBeats() {
  try {
    const res = await fetch("/beats");
    if (!res.ok) throw new Error("Error al obtener beats del servidor.");
    const data = await res.json();

    beats = data.map(b => ({
  ...b,
  cover: b.cover?.startsWith("uploads/") ? `/${b.cover}` : "assets/img/placeholder.jpg",
  audio: b.audio?.startsWith("uploads/") ? b.audio : null,
  demo: b.demo?.startsWith("uploads/") ? b.demo : null
}));


    renderizarBeats();
    actualizarBurbujaCarrito();
  } catch (err) {
    console.error("❌ Error al cargar beats:", err);
    alert("No se pudieron cargar los beats.");
  }
}

// ✅ Agregar beat al carrito
function agregarAlCarrito(id) {
  const beat = beats.find(b => Number(b.id) === Number(id));
  if (!beat) return alert("❌ Beat no encontrado.");

  const yaEnCarrito = carrito.some(item => Number(item.id) === Number(id));
  if (yaEnCarrito) {
    alert("Este beat ya está en tu carrito.");
    return;
  }

  carrito.push(beat);
  localStorage.setItem(`carrito_${usuario.email}`, JSON.stringify(carrito));
  alert(`🎵 "${beat.title}" agregado al carrito.`);
  actualizarBurbujaCarrito();
}

// ✅ Vaciar carrito
function vaciarCarrito() {
  if (!carrito.length) return alert("Tu carrito ya está vacío.");
  if (!confirm("¿Estás seguro de vaciar el carrito?")) return;
  carrito = [];
  localStorage.setItem(`carrito_${usuario.email}`, JSON.stringify(carrito));
  renderizarCarrito();
  actualizarBurbujaCarrito();
}

// ✅ Renderizar carrito
function renderizarCarrito() {
  const container = document.getElementById("carritoItems");
  const totalSpan = document.getElementById("carritoTotal");
  container.innerHTML = "";
  let total = 0;

  carrito.forEach(item => {
    const title = item.title || "Beat sin título";
    const price = isNaN(item.price) ? 0 : Number(item.price);
    total += price;
    container.innerHTML += `<p>${title} - $${price.toFixed(2)}</p>`;
  });

  totalSpan.textContent = total.toFixed(2);
  actualizarBurbujaCarrito();
}

// ✅ Simular pago y registrar venta real
async function pagar() {
  if (!carrito.length) return alert("Tu carrito está vacío.");

  try {
    const res = await fetch("/registrar-venta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        comprador: usuario.email,
        beats: carrito
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al registrar compra.");

    historial.push(...carrito);
    localStorage.setItem(`compras_${usuario.email}`, JSON.stringify(historial));

    carrito = [];
    localStorage.setItem(`carrito_${usuario.email}`, JSON.stringify(carrito));

    alert("✅ ¡Pago exitoso y ventas registradas!");
    mostrarSeccion("perfil");
    actualizarBurbujaCarrito();
  } catch (err) {
    console.error("❌ Error al registrar venta:", err);
    alert("Hubo un problema al registrar la compra.");
  }
}

// ✅ Renderizar historial de compras
function renderizarHistorial() {
  const container = document.getElementById("historialCompras");
  container.innerHTML = "";

  if (!historial.length) {
    container.innerHTML = "<p>No hay compras registradas.</p>";
    return;
  }

  historial.forEach(item => {
    const {
      title = "Sin título",
      producer = "Desconocido",
      price = 0,
      cover = "assets/img/placeholder.jpg",
      audio
    } = item;

    const audioPath = audio?.startsWith("/") ? audio : `/${audio}`;

    const div = document.createElement("div");
    div.className = "beat-card";
    div.innerHTML = `
      <img src="${cover}" alt="${title}" />
      <div class="beat-info">
        <h3>${title}</h3>
        <p><strong>Producer:</strong> ${producer}</p>
        <p><strong>Precio:</strong> $${Number(price).toFixed(2)}</p>
        ${audioPath ? `
          <audio controls src="${audioPath}" style="width: 100%; margin-top: 5px;"></audio>
          <button onclick="descargarArchivo('${audioPath}')" style="margin-top: 5px;">⬇️ Descargar</button>
        ` : `<p><em>Audio no disponible</em></p>`}
      </div>
    `;
    container.appendChild(div);
  });
}

// ✅ Descargar archivo
function descargarArchivo(url) {
  const a = document.createElement("a");
  a.href = url;
  a.download = url.split("/").pop();
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ✅ Actualizar burbuja de carrito
function actualizarBurbujaCarrito() {
  const span = document.getElementById("carritoContador");
  if (span) {
    span.textContent = carrito.length;
  }
}

// ✅ Inicialización
document.addEventListener("DOMContentLoaded", () => {
  cargarBeats();

  document.getElementById("buscarBeatsCliente").addEventListener("input", e => {
    const val = e.target.value.toLowerCase();
    const filtrados = beats.filter(b =>
      (b.title || "").toLowerCase().includes(val) ||
      (b.producer || "").toLowerCase().includes(val) ||
      (b.tags || "").toLowerCase().includes(val)
    );
    renderizarBeats(filtrados);
  });

  document.querySelectorAll("a[data-seccion]").forEach(link => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      mostrarSeccion(this.dataset.seccion);
    });
  });
});