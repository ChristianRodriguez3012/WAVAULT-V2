// Validación de acceso
const usuario = JSON.parse(localStorage.getItem("usuarioActivo"));
if (!usuario || usuario.rol !== "productor") {
  alert("Acceso denegado. Inicia sesión como productor.");
  window.location.href = "../login.html";
}

let beats = []; // Arreglo general de beats

// Mostrar sección activa
function mostrarSeccion(seccion) {
  document.querySelectorAll('.productor-section').forEach(s => s.style.display = 'none');
  document.getElementById(`${seccion}Section`).style.display = 'block';

  switch (seccion) {
    case 'misBeats':
      renderizarMisBeats();
      break;
    case 'perfil':
      contarVentas();
      break;
  }
}

// Renderizar beats en una sección dada
function renderizarBeats(lista, contenedorId) {
  const contenedor = document.getElementById(contenedorId);
  contenedor.innerHTML = '';

  if (lista.length === 0) {
    contenedor.innerHTML = "<p>No hay beats para mostrar.</p>";
    return;
  }

  lista.forEach(beat => {
    const div = document.createElement('div');
    div.className = 'beat-card';
    div.innerHTML = `
      <img src="assets/img/placeholder.jpg" alt="${beat.titulo}" />
      <div class="beat-info">
        <h3>${beat.titulo}</h3>
        <p>${beat.productor_email}</p>
        <p>$${beat.precio}</p>
      </div>
    `;
    contenedor.appendChild(div);
  });
}

// Renderizar feed general
function renderizarFeed() {
  renderizarBeats(beats, 'beatsProductor');
}

// Renderizar beats del productor actual
function renderizarMisBeats() {
  const propios = beats.filter(b => b.productor_email === usuario.email);
  renderizarBeats(propios, 'misBeatsList');
}

// Contador de ventas (simulado)
function contarVentas() {
  document.getElementById('ventasTotales').textContent = "0"; // Simulado
}

// Subida de nuevo beat
document.getElementById('formSubirBeat').addEventListener('submit', async function (e) {
  e.preventDefault();

  const titulo = document.getElementById('tituloBeat').value.trim();
  const precio = parseFloat(document.getElementById('precioBeat').value);
  const archivo = "assets/img/placeholder.jpg"; // Temporal (usado como 'archivo' en BD)

  if (!titulo || isNaN(precio)) {
    return alert("Completa los campos correctamente.");
  }

  const nuevoBeat = {
    titulo,
    precio,
    archivo,
    productor_email: usuario.email
  };

  try {
    const res = await fetch('/subir-beat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoBeat)
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("❌ Error al subir:", data);
      return alert(data.error || "Error al subir el beat.");
    }

    alert("✅ Beat subido exitosamente.");
    this.reset();
    await cargarBeats();
    mostrarSeccion('misBeats');

  } catch (err) {
    console.error("❌ Error de red:", err);
    alert("Error de conexión con el servidor.");
  }
});

// Cargar todos los beats desde la base de datos
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

// Buscador en el feed
function configurarBuscador() {
  const input = document.getElementById('buscarBeatsProductor');
  input.addEventListener('input', () => {
    const val = input.value.toLowerCase();
    const filtrados = beats.filter(b =>
      b.titulo.toLowerCase().includes(val) ||
      b.productor_email.toLowerCase().includes(val)
    );
    renderizarBeats(filtrados, 'beatsProductor');
  });
}

// Inicializar al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  cargarBeats();
  configurarBuscador();

  document.querySelectorAll("a[data-seccion]").forEach(link => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      mostrarSeccion(this.getAttribute("data-seccion"));
    });
  });
});
