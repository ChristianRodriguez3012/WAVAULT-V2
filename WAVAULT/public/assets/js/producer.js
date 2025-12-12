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
  const currentTimeEl = document.getElementById("currentTime");
  const totalDurationEl = document.getElementById("totalDuration");
  const emailSpan = document.getElementById('productorEmail');
  if (usuario && emailSpan) emailSpan.textContent = usuario.email;

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

  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  audioPlayer.addEventListener("loadedmetadata", () => {
    progressBar.max = audioPlayer.duration;
    if (totalDurationEl) totalDurationEl.textContent = formatTime(audioPlayer.duration);
  });

  audioPlayer.addEventListener("timeupdate", () => {
    progressBar.value = audioPlayer.currentTime;
    if (currentTimeEl) currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
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

  // 🧭 Navegación por secciones
  document.querySelectorAll("a[data-seccion]").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      mostrarSeccion(link.dataset.seccion);
    });
  });

  // 🧩 Wizard de subida
  function initWizard() {
    const wizardRoot = document.getElementById('wizardSubidaBeat');
    if (!wizardRoot) return;

    const stepAudio = document.getElementById('step-audio');
    const stepPortada = document.getElementById('step-portada');
    const stepIA = document.getElementById('step-ia');
    const stepConfirm = document.getElementById('step-confirmar');

    const audioInput = document.getElementById('audioFileWizard');
    const coverInput = document.getElementById('coverFileWizard');
    const audioFileName = document.getElementById('audioFileName');
    const coverFileName = document.getElementById('coverFileName');

    const btnNextAudio = document.getElementById('btnNextAudio');
    const btnBackPortada = document.getElementById('btnBackPortada');
    const btnNextPortada = document.getElementById('btnNextPortada');
    const btnBackIA = document.getElementById('btnBackIA');
    const btnNextIA = document.getElementById('btnNextIA');
    const btnBackConfirmar = document.getElementById('btnBackConfirmar');
    const btnGuardarBeat = document.getElementById('btnGuardarBeat');

    const iaStatus = document.getElementById('iaAnalysisStatus');
    const iaResults = document.getElementById('iaAnalysisResults');
    const iaInfo = document.getElementById('iaAnalysisInfo');
    const iaTable = document.getElementById('iaConfidenceTable');

    const confirmData = document.getElementById('confirmData');
    const titleInput = document.getElementById('titleWizard');
    const bpmInput = document.getElementById('bpmWizard');
    const keySelect = document.getElementById('keyWizard');
    const priceInput = document.getElementById('priceWizard');
    const descInput = document.getElementById('descriptionWizard');
    const uploadProgress = document.getElementById('uploadProgress');
    const uploadStatus = document.getElementById('uploadStatus');

    // Tags UI
    let tagsList = [];
    const tagInput = document.getElementById('tagInputWizard');
    const tagsListEl = document.getElementById('tagsListWizard');
    const tagCountEl = document.getElementById('tagCountWizard');
    const tagErrorEl = document.getElementById('tagErrorWizard');

    let audioFile = null;
    let coverFile = null;
    let analysis = null;

    const steps = [stepAudio, stepPortada, stepIA, stepConfirm];
    function showStep(step) {
      steps.forEach(s => s.style.display = s === step ? 'block' : 'none');
    }

    function resetWizard() {
      audioFile = null;
      coverFile = null;
      analysis = null;
      tagsList = [];
      audioInput.value = '';
      coverInput.value = '';
      titleInput.value = '';
      bpmInput.value = '';
      keySelect.value = '';
      priceInput.value = '';
      descInput.value = '';
      uploadProgress.style.display = 'none';
      uploadProgress.value = 0;
      uploadStatus.textContent = '';
      audioFileName.textContent = '';
      coverFileName.textContent = '';
      iaStatus.textContent = 'Procesando análisis...';
      iaResults.style.display = 'none';
      iaResults.innerHTML = '';
      btnNextAudio.disabled = true;
      btnNextPortada.disabled = true;
      btnNextIA.disabled = true;
      renderTags();
      confirmData.innerHTML = '';
      showStep(stepAudio);
    }

    function renderTags() {
      tagsListEl.innerHTML = '';
      tagCountEl.textContent = tagsList.length;
      tagsList.forEach((tag, idx) => {
        const chip = document.createElement('div');
        chip.className = 'tag-item';
        chip.innerHTML = `${tag} <button type="button" data-idx="${idx}">×</button>`;
        tagsListEl.appendChild(chip);
      });
      tagErrorEl.style.display = 'none';
    }

    tagsListEl.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') {
        const idx = parseInt(e.target.dataset.idx, 10);
        tagsList.splice(idx, 1);
        renderTags();
      }
    });

    tagInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const tag = tagInput.value.trim().toLowerCase().replace(/^#+/, '').slice(0, 30);
        if (!tag) {
          tagErrorEl.textContent = 'El tag no puede estar vacío.';
          tagErrorEl.style.display = 'block';
          return;
        }
        if (tagsList.includes(tag)) {
          tagErrorEl.textContent = 'Este tag ya fue agregado.';
          tagErrorEl.style.display = 'block';
          return;
        }
        if (tagsList.length >= 30) {
          tagErrorEl.textContent = 'Máximo 30 tags permitidos.';
          tagErrorEl.style.display = 'block';
          return;
        }
        tagsList.push(tag);
        tagInput.value = '';
        renderTags();
      }
    });

    audioInput.addEventListener('change', () => {
      audioFile = audioInput.files[0] || null;
      audioFileName.textContent = audioFile ? audioFile.name : '';
      btnNextAudio.disabled = !audioFile;
    });

    coverInput.addEventListener('change', () => {
      coverFile = coverInput.files[0] || null;
      coverFileName.textContent = coverFile ? coverFile.name : '';
      btnNextPortada.disabled = !coverFile;
    });

    btnNextAudio.addEventListener('click', () => {
      showStep(stepPortada);
    });

    btnBackPortada.addEventListener('click', () => showStep(stepAudio));
    btnNextPortada.addEventListener('click', () => {
      showStep(stepIA);
      runAnalysis();
    });
    btnBackIA.addEventListener('click', () => showStep(stepPortada));
    btnNextIA.addEventListener('click', () => {
      renderConfirm();
      showStep(stepConfirm);
    });
    btnBackConfirmar.addEventListener('click', () => showStep(stepIA));

    function extraerPistasDesdeNombre(filename) {
      const base = filename.replace(/\.[^/.]+$/, '');
      const limpio = base.replace(/[\._]+/g, ' ').trim();
      const bpmMatch = limpio.match(/(\d{2,3})\s*bpm/i);
      const keyMatch = limpio.match(/\b([A-G](?:#|b)?\s*(?:maj|major|min|minor|m))\b/i);
      const partes = limpio.split(/[-|]/).map(p => p.trim()).filter(Boolean);
      const tags = partes.slice(1, 4);
      return {
        tituloSugerido: partes[0] || limpio,
        bpmSugerido: bpmMatch ? bpmMatch[1] : '',
        keySugerida: keyMatch ? keyMatch[1].replace(/major/i, 'Maj').replace(/minor|m/i, 'Min').toUpperCase() : '',
        tagsSugeridas: tags,
      };
    }

    async function runAnalysis() {
      if (!audioFile) {
        iaStatus.textContent = 'Selecciona un audio antes de analizar.';
        btnNextIA.disabled = true;
        return;
      }

      iaStatus.textContent = 'Analizando audio con IA...';
      iaResults.style.display = 'none';
      iaResults.innerHTML = '';
      btnNextIA.disabled = true;

      const pistas = extraerPistasDesdeNombre(audioFile.name);
      if (pistas.tituloSugerido && !titleInput.value) titleInput.value = pistas.tituloSugerido;
      if (pistas.bpmSugerido && !bpmInput.value) bpmInput.value = pistas.bpmSugerido;
      if (pistas.keySugerida && !keySelect.value) {
        const option = Array.from(keySelect.options).find(opt => opt.value.toLowerCase().includes(pistas.keySugerida.toLowerCase().split(' ')[0]));
        if (option) keySelect.value = option.value;
      }
      pistas.tagsSugeridas.forEach(tag => {
        const clean = tag.trim().toLowerCase();
        if (clean && !tagsList.includes(clean) && tagsList.length < 30) tagsList.push(clean);
      });
      renderTags();

      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('filename', audioFile.name);
      formData.append('hints', JSON.stringify(pistas));

      try {
        const res = await fetch('/api/analyze-beat', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok || !data.success || data.analysis.status !== 'success') {
          throw new Error(data.error || 'No se pudo completar el análisis.');
        }
        analysis = data.analysis;
        applyAnalysis(analysis);
        iaStatus.textContent = '✅ Análisis completado.';
        btnNextIA.disabled = false;
      } catch (err) {
        console.error('❌ Error de análisis:', err);
        iaStatus.textContent = '❌ Error: ' + (err.message || 'No se pudo analizar.');
        btnNextIA.disabled = false; // permitir continuar manual
      }
    }

    function applyAnalysis(analysisData) {
      const tech = analysisData.technical_data || {};
      const ai = analysisData.ai_inference || {};
      const report = analysisData.confidence_report || {};

      const parts = [];
      if (tech.bpm) parts.push(`BPM: ${tech.bpm}`);
      if (tech.key) parts.push(`Key: ${tech.key}`);
      if (ai.mood) parts.push(`Mood: ${ai.mood}`);

      iaResults.innerHTML = `<p>${parts.join(' • ')}</p>`;
      iaResults.style.display = 'block';

      const summary = report.summary || 'Parseo del filename → análisis de audio (BPM/Key) → IA para mood y tags.';
      const method = report.method || 'Fuentes: filename (si existe) + audio + IA.';
      iaInfo.style.display = 'block';
      iaInfo.innerHTML = `<strong>Cómo se generó:</strong> ${summary}<br><small>${method}</small>`;
      
      // Indicador de IA activa
      const aiEngine = ai.gemini_status || 'unknown';
      const aiActive = ai.gemini_access === true;
      let aiLabel = '⚠️ IA Local';
      let aiColor = '#f59e0b';
      if (aiActive) {
        if (aiEngine === 'groq') {
          aiLabel = '✅ IA Activa (Groq)';
          aiColor = '#10b981';
        } else if (aiEngine === 'ok') {
          aiLabel = '✅ IA Activa (Gemini)';
          aiColor = '#6366f1';
        }
      }
      const aiBadge = `<span style="display:inline-block;margin-left:0.5rem;padding:0.25rem 0.5rem;background:${aiColor};color:white;border-radius:4px;font-size:0.75rem;font-weight:600;">${aiLabel}</span>`;
      iaInfo.innerHTML += aiBadge;

      const fallbackRows = [
        { parameter: 'Nombre/Referencia', value: analysisData.filename || audioFile?.name || '-', confidence: 85, source: 'filename', rationale: 'Parseo directo del archivo' },
        { parameter: 'Key', value: tech.key || '-', confidence: tech.key_confidence ?? 80, source: tech.detection_source?.key_from_filename ? 'filename' : 'audio', rationale: 'Filename o detección cromática' },
        { parameter: 'BPM', value: tech.bpm || '-', confidence: tech.bpm_confidence ?? 80, source: tech.detection_source?.bpm_from_filename ? 'filename' : 'audio', rationale: 'Filename o análisis de tempo' },
        { parameter: 'Mood', value: ai.mood || '-', confidence: 78, source: ai.gemini_status === 'groq' ? 'ia-groq' : (ai.gemini_access ? 'ia-gemini' : 'local'), rationale: ai.gemini_status === 'groq' ? 'IA (Groq) usando BPM/Key y hints' : (ai.gemini_access ? 'IA (Gemini) usando BPM/Key y hints' : 'Heurística local') },
        { parameter: 'Tags (IA)', value: (ai.tags || []).slice(0,5).join(', ') || '-', confidence: 80, source: ai.gemini_status === 'groq' ? 'ia-groq' : (ai.gemini_access ? 'ia-gemini' : 'parser'), rationale: ai.gemini_status === 'groq' ? 'IA (Groq) priorizando tags obligatorios' : (ai.gemini_access ? 'IA (Gemini) priorizando tags obligatorios' : 'Parser local') }
      ];

      const rows = Array.isArray(report.items) && report.items.length ? report.items : fallbackRows;

      const badge = (c) => {
        if (c >= 80) return `<span class="badge-good">${c}%</span>`;
        if (c >= 60) return `<span class="badge-mid">${c}%</span>`;
        return `<span class="badge-low">${c}%</span>`;
      };

      iaTable.style.display = 'block';
      iaTable.innerHTML = `
        <table>
          <thead><tr><th>Parámetro</th><th>Valor</th><th>Confianza</th><th>Fuente</th></tr></thead>
          <tbody>
            ${rows.map(r => `<tr title="${(r.rationale || '').replace(/"/g, '')}"><td>${r.parameter || r.label}</td><td>${r.value || r.val}</td><td>${badge(r.confidence ?? r.conf ?? 0)}</td><td>${r.source || '-'}</td></tr>`).join('')}
          </tbody>
        </table>
      `;

      if (tech.bpm) bpmInput.value = tech.bpm;
      if (tech.key) {
        const normalized = normalizeKey(tech.key);
        const opt = Array.from(keySelect.options).find(o => o.value.toLowerCase() === normalized.toLowerCase());
        if (opt) {
          keySelect.value = opt.value;
        }
      }

      if (ai.tags && Array.isArray(ai.tags)) {
        tagsList = ai.tags.slice(0, 30).map(t => t.trim().toLowerCase()).filter(Boolean);
        renderTags();
      }
    }

    function normalizeKey(raw) {
      if (!raw) return '';
      const cleaned = raw.trim().replace(/\s+/g, ' ');
      const lower = cleaned.toLowerCase();
      // Detect note (with #/b) and quality
      const match = lower.match(/^([a-g][#b]?)[\s-]*(maj|major|min|minor|m)?/);
      if (!match) return cleaned;
      const note = match[1].toUpperCase();
      const quality = match[2] ? match[2] : '';
      let q = '';
      if (quality.includes('maj')) q = 'Maj';
      else if (quality.includes('min') || quality === 'm') q = 'Min';
      else q = 'Maj';
      return `${note} ${q}`.trim();
    }

    function renderConfirm() {
      const audioName = audioFile ? audioFile.name : 'Sin archivo';
      const coverName = coverFile ? coverFile.name : 'Sin portada';
      const bpmVal = bpmInput.value || '-';
      const keyVal = keySelect.value || '-';
      confirmData.innerHTML = `
        <p>🎧 Audio: <strong>${audioName}</strong></p>
        <p>🖼️ Portada: <strong>${coverName}</strong></p>
        <p>🎵 BPM: <strong>${bpmVal}</strong> • Key: <strong>${keyVal}</strong></p>
        <p>🏷️ Tags: <strong>${tagsList.map(t => `#${t}`).join(' ') || 'Sin tags'}</strong></p>
      `;
    }

    btnGuardarBeat.addEventListener('click', () => {
      if (!audioFile || !coverFile) {
        alert('Debes seleccionar audio y portada.');
        return;
      }

      const title = titleInput.value.trim() || (audioFile?.name ?? '').split('.')[0];
      const price = parseFloat(priceInput.value);
      const bpm = parseInt(bpmInput.value, 10);
      const key = keySelect.value;

      if (!title || isNaN(price) || price <= 0 || isNaN(bpm) || bpm < 50 || bpm > 220 || !key) {
        alert('Completa título, precio (>0), BPM (50-220) y key.');
        return;
      }

      if (tagsList.length < 3) {
        tagErrorEl.textContent = 'Debes agregar mínimo 3 tags.';
        tagErrorEl.style.display = 'block';
        return;
      }

      const formData = new FormData();
      formData.append('title', title);
      formData.append('price', price);
      formData.append('tags', tagsList.join(','));
      formData.append('bpm', bpm);
      formData.append('key', key);
      formData.append('producer', usuario.email);
      formData.append('audio', audioFile);
      formData.append('cover', coverFile);
      if (descInput.value.trim()) formData.append('description', descInput.value.trim());

      uploadProgress.style.display = 'block';
      uploadStatus.textContent = 'Subiendo...';

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/subir-beat', true);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          uploadProgress.value = pct;
          uploadStatus.textContent = `Subiendo... ${pct}%`;
        }
      };

      xhr.onload = async () => {
        let res = null;
        try {
          res = JSON.parse(xhr.responseText);
        } catch (err) {
          console.warn('Respuesta no válida:', xhr.responseText);
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          uploadStatus.textContent = '✅ Beat subido';
          uploadProgress.value = 100;
          await cargarBeats();
          mostrarModal('✅ Beat subido exitosamente.');
          resetWizard();
          mostrarSeccion('misBeats');
        } else {
          uploadStatus.textContent = '❌ Error al subir';
          mostrarModal((res && res.error) || '❌ Error al subir el beat.');
        }
      };

      xhr.onerror = () => {
        uploadStatus.textContent = '❌ Error de red al subir';
        mostrarModal('❌ Error de red al subir el beat.');
      };

      xhr.send(formData);
    });

    resetWizard();
  }

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

  window.cerrarSesion = function () {
    localStorage.removeItem('usuarioActivo');
    window.location.href = '../login.html';
  };

  window.mostrarModal = mostrarModal;

  window.cerrarModal = function () {
    const modal = document.getElementById('modalConfirmacion');
    if (modal) modal.style.display = 'none';
  };

  // Inicial
  cargarBeats();
  configurarBuscador();
  initWizard();
  mostrarSeccion("feed");
});
