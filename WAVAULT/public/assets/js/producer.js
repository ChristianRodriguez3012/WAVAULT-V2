// ✅ Validar acceso
const usuario = JSON.parse(localStorage.getItem("usuarioActivo"));
if (!usuario || usuario.rol !== "productor") {
  if (window.location.pathname.includes("producer")) {
    alert("Acceso denegado. Inicia sesión como productor.");
    window.location.href = "../login.html";
  }
}

document.addEventListener("DOMContentLoaded", () => {
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

  const barraContainer = document.createElement("div");
  barraContainer.style.display = "none";
  barraContainer.style.marginTop = "1em";
  const barraProgreso = document.createElement("progress");
  barraProgreso.id = "barraSubida";
  barraProgreso.max = 100;
  barraProgreso.value = 0;
  barraContainer.appendChild(barraProgreso);
  document.getElementById("formSubirBeat").appendChild(barraContainer);

  let beats = [];
  let playlist = [];
  let historial = [];
  let currentIndex = -1;

  window.mostrarSeccion = function (seccion) {
    document.querySelectorAll('.productor-section').forEach(s => s.style.display = 'none');
    document.getElementById(`${seccion}Section`).style.display = 'block';
    if (seccion === 'misBeats') renderizarMisBeats();
    if (seccion === 'perfil') contarVentas();
  };

  function renderizarBeats(lista, contenedorId, esMisBeats = false) {
    const contenedor = document.getElementById(contenedorId);
    contenedor.innerHTML = '';

    if (!lista.length) {
      contenedor.innerHTML = "<p>No hay beats para mostrar.</p>";
      return;
    }

    playlist = lista.filter(b => (b.demo || b.audio)?.startsWith("uploads/"));

    lista.forEach((beat, i) => {
      const cover = beat.cover?.startsWith("uploads/") ? `/${beat.cover}` : "assets/img/placeholder.jpg";
      const audio = beat.audio?.startsWith("uploads/") ? `/${beat.audio}` : null;
      const demo = beat.demo?.startsWith("uploads/") ? `/${beat.demo}` : null;
      const title = beat.title ?? "Sin título";
      const price = isNaN(beat.price) ? 0 : Number(beat.price).toFixed(2);
      const producer = beat.producer ?? "Desconocido";
      const tags = beat.tags ? beat.tags.split(',').map(t => `#${t.trim()}`).join(' ') : "Sin tags";
      const bpm = beat.bpm ? `${beat.bpm} BPM` : "BPM desconocido";
      const key = beat.key ?? "Key desconocida";

      const div = document.createElement('div');
      div.className = 'beat-card';
      div.innerHTML = `
        <img src="${cover}" alt="${title}" />
        <div class="beat-info">
          <h3 class="titulo-beat" data-id="${beat.id}" style="cursor:pointer; color:#1a73e8;">${title}</h3>
          <p>👤 <span class="nombre-prod" data-prod="${producer}" style="cursor:pointer; color:#1a73e8;">${producer}</span></p>
          <p>💰 $${price}</p>
          <p>🏷️ ${tags}</p>
          <p>🎼 ${bpm} • ${key}</p>
          ${demo || audio ? `
            <button class="play-btn" data-index="${i}">▶️ Reproducir</button>
            ${usuario.email === beat.producer && audio
              ? `<a href="${audio}" download class="descargar-btn">⬇️ Descargar</a>`
              : `<button class="comprar-btn disabled" disabled style="background:#ccc; color:#666; cursor:not-allowed;">🚫 Solo para clientes</button>`}
            ${esMisBeats && usuario.email === beat.producer
              ? `<button class="delete-btn" data-id="${beat.id}" style="margin-left:8px;color:red;">🗑️ Eliminar</button>`
              : ''}
          ` : `<p><em>Sin archivo de audio.</em></p>`}
        </div>
      `;
      contenedor.appendChild(div);
    });

    document.querySelectorAll('.play-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        reproducirBeat(index);
      });
    });

    document.querySelectorAll('.titulo-beat').forEach(h3 => {
      h3.addEventListener('click', () => {
        const id = h3.dataset.id;
        window.location.href = `/beat.html?id=${id}`;
      });
    });

    document.querySelectorAll('.nombre-prod').forEach(span => {
      span.addEventListener('click', () => {
        const prod = span.dataset.prod;
        window.location.href = `/perfil.html?productor=${encodeURIComponent(prod)}`;
      });
    });

    if (esMisBeats) {
      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => confirmarEliminar(btn.dataset.id));
      });
    }
  }

  function reproducirBeat(index) {
    const beat = playlist[index];
    if (!beat) return;

    const audio = beat.demo?.startsWith("uploads/") ? `/${beat.demo}` :
                  beat.audio?.startsWith("uploads/") ? `/${beat.audio}` : null;
    if (!audio) return;

    audioPlayer.src = audio;
    playerCover.src = `/${beat.cover}`;
    playerTitle.innerHTML = `<a href="/beat.html?id=${beat.id}" style="color:#fff; text-decoration:underline;">${beat.title}</a>`;
    playerProducer.innerHTML = `<a href="/perfil.html?productor=${encodeURIComponent(beat.producer)}" style="color:#ccc; text-decoration:underline;">${beat.producer}</a>`;
    audioPlayer.play();
    playPauseBtn.textContent = "⏸";
    playerBar.style.display = "flex";

    currentIndex = index;
    historial.push(index);
  }

  function reproducirAleatorio() {
    if (playlist.length === 0) return;
    let nuevoIndex;
    do {
      nuevoIndex = Math.floor(Math.random() * playlist.length);
    } while (historial.length > 1 && nuevoIndex === historial[historial.length - 1]);
    reproducirBeat(nuevoIndex);
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
    if (historial.length > 1) {
      historial.pop();
      const prevIndex = historial.pop();
      if (typeof prevIndex === 'number') {
        reproducirBeat(prevIndex);
      }
    }
  });

  btnNext.addEventListener("click", reproducirAleatorio);

  audioPlayer.addEventListener("ended", reproducirAleatorio);

  audioPlayer.addEventListener("loadedmetadata", () => {
    progressBar.max = audioPlayer.duration;
    totalDurationEl.textContent = formatTime(audioPlayer.duration);
  });

  audioPlayer.addEventListener("timeupdate", () => {
    progressBar.value = audioPlayer.currentTime;
    currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
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
  });

  async function contarVentas() {
    const totalSpan = document.getElementById("ventasTotales");
    const tablaBody = document.querySelector("#tablaVentasBeats tbody");

    totalSpan.textContent = "Cargando...";
    tablaBody.innerHTML = "";

    try {
      const res = await fetch(`/ventas?producer=${encodeURIComponent(usuario.email)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al obtener ventas.");

      totalSpan.textContent = data.length;

      const agrupadas = {};
      data.forEach(v => {
        if (!agrupadas[v.id]) {
          agrupadas[v.id] = {
            title: v.title,
            cover: v.cover,
            compradores: [v.comprador]
          };
        } else {
          agrupadas[v.id].compradores.push(v.comprador);
        }
      });

      for (const id in agrupadas) {
        const { title, cover, compradores } = agrupadas[id];
        const src = cover?.startsWith("uploads/") ? `/${cover}` : "assets/img/placeholder.jpg";
        const fila = document.createElement("tr");
        fila.innerHTML = `
          <td><img src="${src}" alt="cover" /></td>
          <td>${title}</td>
          <td>${compradores.length}</td>
          <td>${compradores.map(c => `<span>${c}</span>`).join('<br>')}</td>
        `;
        tablaBody.appendChild(fila);
      }
    } catch (err) {
      console.error("❌ Error al contar ventas:", err);
      totalSpan.textContent = "Error";
      tablaBody.innerHTML = `<tr><td colspan="4">No se pudo cargar el historial.</td></tr>`;
    }
  }

  async function cargarBeats() {
    try {
      const res = await fetch('/beats');
      if (!res.ok) throw new Error("Fallo al obtener beats");
      beats = await res.json();
      renderizarFeed();
    } catch (err) {
      console.error("❌ Error cargando beats:", err);
      alert("No se pudieron cargar los beats.");
    }
  }

  function renderizarFeed() {
    renderizarBeats(beats, 'beatsProductor');
  }

  function renderizarMisBeats() {
    const propios = beats.filter(b => b.producer === usuario.email);
    renderizarBeats(propios, 'misBeatsList', true);
  }

  function configurarBuscador() {
    const input = document.getElementById('buscarBeatsProductor');
    input.addEventListener('input', () => {
      const val = input.value.toLowerCase();
      const filtrados = beats.filter(b =>
        (b.title ?? "").toLowerCase().includes(val) ||
        (b.producer ?? "").toLowerCase().includes(val) ||
        (b.tags ?? "").toLowerCase().includes(val)
      );
      renderizarBeats(filtrados, 'beatsProductor');
    });
  }

  // 🧩 Subida del beat
  document.getElementById('formSubirBeat').addEventListener('submit', function (e) {
    e.preventDefault();

    const title = document.getElementById('tituloBeat').value.trim();
    const price = parseFloat(document.getElementById('precioBeat').value);
    const tag1 = document.getElementById('tag1').value.trim();
    const tag2 = document.getElementById('tag2').value.trim();
    const tag3 = document.getElementById('tag3').value.trim();
    const bpm = parseInt(document.getElementById('bpm').value);
    const key = document.getElementById('key').value;
    const audioFile = document.getElementById('archivoAudio').files[0];
    const coverFile = document.getElementById('archivoPortada').files[0];

    if (!title || isNaN(price) || !tag1 || !tag2 || !tag3 || isNaN(bpm) || !key || !audioFile || !coverFile) {
      return alert("Por favor, completa todos los campos.");
    }

    const tags = `${tag1},${tag2},${tag3}`;
    const formData = new FormData();
    formData.append("title", title);
    formData.append("price", price);
    formData.append("tags", tags);
    formData.append("bpm", bpm);
    formData.append("key", key);
    formData.append("producer", usuario.email);
    formData.append("audio", audioFile);
    formData.append("cover", coverFile);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/subir-beat", true);

    xhr.upload.onprogress = function (e) {
      if (e.lengthComputable) {
        barraContainer.style.display = "block";
        barraProgreso.value = (e.loaded / e.total) * 100;
      }
    };

    xhr.onload = async function () {
      barraContainer.style.display = "none";
      let res = null;
      try {
        res = JSON.parse(xhr.responseText);
      } catch (e) {
        console.warn("⚠️ Respuesta no válida:", xhr.responseText);
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        mostrarModal("✅ Beat subido exitosamente.");
        document.getElementById('formSubirBeat').reset();
        document.getElementById("labelAudio").textContent = "🎧 Archivo de Audio";
        document.getElementById("labelPortada").textContent = "🖼️ Portada del Beat";
        await cargarBeats();
        mostrarSeccion("misBeats");
      } else {
        mostrarModal((res && res.error) || "❌ Error al subir el beat.");
      }
    };

    xhr.onerror = function () {
      barraContainer.style.display = "none";
      mostrarModal("❌ Error de red al subir el beat.");
    };

    xhr.send(formData);
  });

  function mostrarModal(mensaje) {
    let modal = document.getElementById("modalMensaje");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "modalMensaje";
      modal.style.position = "fixed";
      modal.style.top = "50%";
      modal.style.left = "50%";
      modal.style.transform = "translate(-50%, -50%)";
      modal.style.background = "#fff";
      modal.style.padding = "20px";
      modal.style.borderRadius = "10px";
      modal.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";
      modal.style.zIndex = "9999";
      modal.style.textAlign = "center";
      document.body.appendChild(modal);
    }
    modal.innerHTML = `<p>${mensaje}</p>`;
    modal.style.display = "block";
    setTimeout(() => modal.style.display = "none", 3000);
  }

  function confirmarEliminar(id) {
    if (!confirm("¿Estás seguro de eliminar este beat? Esta acción no se puede deshacer.")) return;
    fetch(`/borrar-beat/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ producer: usuario.email })
    })
      .then(r => r.json().then(json => ({ ok: r.ok, json })))
      .then(({ ok, json }) => {
        if (ok) {
          mostrarModal("✅ Beat eliminado.");
          beats = beats.filter(b => b.id != id);
          renderizarMisBeats();
        } else {
          mostrarModal(`❌ ${json.error}`);
        }
      })
      .catch(() => mostrarModal("❌ Error al eliminar el beat."));
  }

  // Inicial
  cargarBeats();
  configurarBuscador();
  mostrarSeccion("feed");
});
