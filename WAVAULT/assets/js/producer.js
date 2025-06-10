// Validación de acceso
const usuario = JSON.parse(localStorage.getItem("usuarioActivo"));
if (!usuario || usuario.rol !== "productor") {
  alert("Acceso denegado. Inicia sesión como productor.");
  window.location.href = "../login.html";
}

// Beats iniciales del sistema (visibles para todos)
const beats = [
  { title: "Dark Trap Vibes", producer: "BeatMasterX", price: 25, cover: "../assets/img/beat1.jpg" },
  { title: "LoFi Dreams", producer: "ChillGuy", price: 20, cover: "../assets/img/beat2.jpg" },
  { title: "Hard Drill Beat", producer: "808King", price: 30, cover: "../assets/img/beat3.jpg" }
];

// Cargar beats y ventas del productor desde localStorage
let beatsSubidos = JSON.parse(localStorage.getItem(`beats_${usuario.email}`)) || [];
let ventas = parseInt(localStorage.getItem(`ventas_${usuario.email}`)) || 0;

// Al cargar, incluir también los beats subidos al arreglo general
beats.push(...beatsSubidos);

// Mostrar sección
function mostrarSeccion(seccion) {
  document.querySelectorAll('.productor-section').forEach(s => s.style.display = 'none');
  document.getElementById(seccion + 'Section').style.display = 'block';
  if (seccion === 'misBeats') renderizarMisBeats();
  if (seccion === 'perfil') document.getElementById('ventasTotales').textContent = ventas;
}

// Renderizar feed general
function renderizarFeed() {
  const contenedor = document.getElementById('beatsProductor');
  contenedor.innerHTML = '';
  beats.forEach(beat => {
    const div = document.createElement('div');
    div.className = 'beat-card';
    div.innerHTML = `
      <img src="${beat.cover}" alt="${beat.title}" />
      <div class="beat-info">
        <h3>${beat.title}</h3>
        <p>${beat.producer}</p>
        <p>$${beat.price}</p>
      </div>
    `;
    contenedor.appendChild(div);
  });
}

// Renderizar beats subidos por el productor
function renderizarMisBeats() {
  const contenedor = document.getElementById('misBeatsList');
  contenedor.innerHTML = '';
  if (beatsSubidos.length === 0) {
    contenedor.innerHTML = "<p>No has subido ningún beat aún.</p>";
    return;
  }

  beatsSubidos.forEach(b => {
    contenedor.innerHTML += `
      <div class="beat-card">
        <img src="../assets/img/placeholder.jpg" alt="Beat Cover" />
        <div class="beat-info">
          <h3>${b.title}</h3>
          <p>$${b.price}</p>
        </div>
      </div>
    `;
  });
}

// Subida de beats
document.getElementById('formSubirBeat').addEventListener('submit', function (e) {
  e.preventDefault();
  const titulo = document.getElementById('tituloBeat').value;
  const precio = parseFloat(document.getElementById('precioBeat').value);

  if (!titulo || isNaN(precio)) {
    return alert("Completa los campos correctamente.");
  }

  const nuevoBeat = {
    title: titulo,
    price: precio,
    producer: usuario.email,
    cover: "../assets/img/placeholder.jpg"
  };

  beatsSubidos.push(nuevoBeat);
  beats.push(nuevoBeat); // También agregar al arreglo global
  localStorage.setItem(`beats_${usuario.email}`, JSON.stringify(beatsSubidos));

  alert("Beat subido exitosamente.");
  this.reset();

  renderizarFeed(); // actualizar feed con el nuevo beat
  mostrarSeccion('misBeats'); // redirige a Mis Beats
});

// Buscador en el feed
document.addEventListener("DOMContentLoaded", () => {
  renderizarFeed();

  const input = document.getElementById('buscarBeatsProductor');
  input.addEventListener('input', () => {
    const val = input.value.toLowerCase();
    const filtrados = beats.filter(b =>
      b.title.toLowerCase().includes(val) ||
      b.producer.toLowerCase().includes(val)
    );

    const contenedor = document.getElementById('beatsProductor');
    contenedor.innerHTML = '';
    filtrados.forEach(beat => {
      const div = document.createElement('div');
      div.className = 'beat-card';
      div.innerHTML = `
        <img src="${beat.cover}" alt="${beat.title}" />
        <div class="beat-info">
          <h3>${beat.title}</h3>
          <p>${beat.producer}</p>
          <p>$${beat.price}</p>
        </div>
      `;
      contenedor.appendChild(div);
    });
  });
});
