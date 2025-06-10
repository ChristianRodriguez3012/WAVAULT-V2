const beats = [
  { id: 1, title: "Dark Trap Vibes", producer: "BeatMasterX", price: 25, cover: "../assets/img/beat1.jpg" },
  { id: 2, title: "LoFi Dreams", producer: "ChillGuy", price: 20, cover: "../assets/img/beat2.jpg" },
  { id: 3, title: "Hard Drill Beat", producer: "808King", price: 30, cover: "../assets/img/beat3.jpg" }
];

// Recuperar sesión
const usuario = JSON.parse(localStorage.getItem("usuarioActivo"));
if (!usuario || usuario.rol !== "cliente") {
  alert("Acceso denegado. Inicia sesión como cliente.");
  window.location.href = "../login.html";
}

let carrito = JSON.parse(localStorage.getItem(`carrito_${usuario.email}`)) || [];
let historial = JSON.parse(localStorage.getItem(`compras_${usuario.email}`)) || [];

function mostrarSeccion(seccion) {
  document.querySelectorAll(".cliente-section").forEach(s => s.style.display = "none");
  document.getElementById(seccion + "Section").style.display = "block";
  if (seccion === "carrito") renderizarCarrito();
  if (seccion === "perfil") renderizarHistorial();
}

function renderizarBeats(lista = beats) {
  const contenedor = document.getElementById("beatsCliente");
  contenedor.innerHTML = "";
  lista.forEach(beat => {
    const div = document.createElement("div");
    div.className = "beat-card";
    div.innerHTML = `
      <img src="${beat.cover}" alt="${beat.title}" />
      <div class="beat-info">
        <h3>${beat.title}</h3>
        <p>${beat.producer}</p>
        <p>$${beat.price}</p>
        <button onclick="agregarAlCarrito(${beat.id})">Agregar al carrito</button>
      </div>
    `;
    contenedor.appendChild(div);
  });
}

function agregarAlCarrito(id) {
  const beat = beats.find(b => b.id === id);
  if (!carrito.find(b => b.id === id)) {
    carrito.push(beat);
    localStorage.setItem(`carrito_${usuario.email}`, JSON.stringify(carrito));
    alert(`"${beat.title}" agregado al carrito.`);
  } else {
    alert("Este beat ya está en tu carrito.");
  }
}

function renderizarCarrito() {
  const container = document.getElementById("carritoItems");
  const totalSpan = document.getElementById("carritoTotal");
  container.innerHTML = "";
  let total = 0;

  carrito.forEach(item => {
    total += item.price;
    container.innerHTML += `<p>${item.title} - $${item.price}</p>`;
  });

  totalSpan.textContent = total;
}

function pagar() {
  if (carrito.length === 0) return alert("Tu carrito está vacío.");

  historial.push(...carrito);
  localStorage.setItem(`compras_${usuario.email}`, JSON.stringify(historial));

  carrito = [];
  localStorage.setItem(`carrito_${usuario.email}`, JSON.stringify(carrito));

  alert("¡Pago exitoso!");
  mostrarSeccion("perfil");
}

function renderizarHistorial() {
  const ul = document.getElementById("historialCompras");
  ul.innerHTML = "";
  historial.forEach(item => {
    ul.innerHTML += `<li>${item.title} - $${item.price}</li>`;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("buscarBeatsCliente").addEventListener("input", e => {
    const val = e.target.value.toLowerCase();
    const filtrados = beats.filter(b =>
      b.title.toLowerCase().includes(val) || b.producer.toLowerCase().includes(val)
    );
    renderizarBeats(filtrados);
  });

  renderizarBeats();
});
