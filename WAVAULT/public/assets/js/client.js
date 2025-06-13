// Recuperar sesión
const usuario = JSON.parse(localStorage.getItem("usuarioActivo"));
if (!usuario || usuario.rol !== "cliente") {
  alert("Acceso denegado. Inicia sesión como cliente.");
  window.location.href = "../login.html";
}

let beats = [];
let carrito = JSON.parse(localStorage.getItem(`carrito_${usuario.email}`)) || [];
let historial = JSON.parse(localStorage.getItem(`compras_${usuario.email}`)) || [];

// Mostrar sección activa
function mostrarSeccion(seccion) {
  document.querySelectorAll(".cliente-section").forEach(s => s.style.display = "none");
  const sectionElem = document.getElementById(seccion + "Section");
  if (sectionElem) sectionElem.style.display = "block";

  if (seccion === "carrito") renderizarCarrito();
  if (seccion === "perfil") renderizarHistorial();
}

// Renderizar beats
function renderizarBeats(lista = beats) {
  const contenedor = document.getElementById("beatsCliente");
  contenedor.innerHTML = "";

  if (lista.length === 0) {
    contenedor.innerHTML = "<p>No hay beats disponibles.</p>";
    return;
  }

  lista.forEach(beat => {
    const div = document.createElement("div");
    div.className = "beat-card";
    div.innerHTML = `
      <img src="${beat.cover}" alt="${beat.title}" />
      <div class="beat-info">
        <h3>${beat.title}</h3>
        <p>${beat.producer}</p>
        <p>$${beat.price}</p>
        <button onclick="agregarAlCarrito('${beat.id}')">Agregar al carrito</button>
      </div>
    `;
    contenedor.appendChild(div);
  });
}

// Cargar beats desde servidor
async function cargarBeats() {
  try {
    const res = await fetch("/beats");
    if (!res.ok) throw new Error("Error al obtener beats del servidor.");
    beats = await res.json();
    renderizarBeats();
  } catch (err) {
    console.error("❌ Error al cargar beats:", err);
    alert("No se pudieron cargar los beats.");
  }
}

// Agregar beat al carrito
function agregarAlCarrito(id) {
  const beat = beats.find(b => b.id == id);
  if (!beat) return alert("Beat no encontrado.");
  if (!carrito.find(b => b.id == id)) {
    carrito.push(beat);
    localStorage.setItem(`carrito_${usuario.email}`, JSON.stringify(carrito));
    alert(`"${beat.title}" agregado al carrito.`);
  } else {
    alert("Este beat ya está en tu carrito.");
  }
}

// Renderizar carrito
function renderizarCarrito() {
  const container = document.getElementById("carritoItems");
  const totalSpan = document.getElementById("carritoTotal");
  container.innerHTML = "";
  let total = 0;

  carrito.forEach(item => {
    total += item.price;
    container.innerHTML += `<p>${item.title} - $${item.price}</p>`;
  });

  totalSpan.textContent = total.toFixed(2);
}

// Pagar carrito
function pagar() {
  if (carrito.length === 0) return alert("Tu carrito está vacío.");

  historial.push(...carrito);
  localStorage.setItem(`compras_${usuario.email}`, JSON.stringify(historial));

  carrito = [];
  localStorage.setItem(`carrito_${usuario.email}`, JSON.stringify(carrito));

  alert("¡Pago exitoso!");
  mostrarSeccion("perfil");
}

// Renderizar historial
function renderizarHistorial() {
  const ul = document.getElementById("historialCompras");
  ul.innerHTML = "";
  if (historial.length === 0) {
    ul.innerHTML = "<li>No hay compras registradas.</li>";
    return;
  }
  historial.forEach(item => {
    ul.innerHTML += `<li>${item.title} - $${item.price}</li>`;
  });
}

// Inicializar
document.addEventListener("DOMContentLoaded", () => {
  cargarBeats();

  document.getElementById("buscarBeatsCliente").addEventListener("input", e => {
    const val = e.target.value.toLowerCase();
    const filtrados = beats.filter(b =>
      b.title.toLowerCase().includes(val) || b.producer.toLowerCase().includes(val)
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
