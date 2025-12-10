const beats = [
  {
    id: 1,
    title: "Dark Trap Vibes",
    producer: "BeatMasterX",
    price: 25,
    cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
    bpm: 140,
    key: "C Minor",
    type: "trap",
    tags: ["Trap", "Dark", "Hip-Hop"]
  },
  {
    id: 2,
    title: "LoFi Dreams",
    producer: "ChillGuy",
    price: 20,
    cover: "https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=400&h=400&fit=crop",
    bpm: 90,
    key: "D Major",
    type: "lofi",
    tags: ["Lo-Fi", "Chill", "Hip-Hop"]
  },
  {
    id: 3,
    title: "Hard Drill Beat",
    producer: "808King",
    price: 30,
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
    bpm: 160,
    key: "A Minor",
    type: "trap",
    tags: ["Drill", "Hard", "Trap"]
  },
  {
    id: 4,
    title: "Reggaeton Fire",
    producer: "LatinBeat",
    price: 22,
    cover: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop",
    bpm: 92,
    key: "G Minor",
    type: "reggaeton",
    tags: ["Reggaeton", "Latin", "Urban"]
  },
  {
    id: 5,
    title: "Pop Hit Formula",
    producer: "PopProducer",
    price: 35,
    cover: "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&h=400&fit=crop",
    bpm: 128,
    key: "F Major",
    type: "pop",
    tags: ["Pop", "Catchy", "Commercial"]
  },
  {
    id: 6,
    title: "Hip-Hop Classic",
    producer: "OldSchool",
    price: 28,
    cover: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=400&fit=crop",
    bpm: 95,
    key: "Eb Major",
    type: "hip-hop",
    tags: ["Hip-Hop", "Classic", "Boom Bap"]
  }
];

function createBeatCard(beat) {
  return `
    <div class="beat-card" onclick="window.location.href='beat.html?id=${beat.id}'">
      <div class="beat-card-image" style="background-image: url('${beat.cover}'); background-size: cover; background-position: center;">
        <div class="beat-card-overlay">
          <button class="play-btn" onclick="event.stopPropagation();">
            <i class="fas fa-play"></i>
          </button>
        </div>
      </div>
      <div class="beat-info">
        <div class="beat-header">
          <h3>
            <a href="beat.html?id=${beat.id}">${beat.title}</a>
          </h3>
          <div class="beat-price">$${beat.price}</div>
        </div>
        <p style="color: var(--gray); font-size: 0.9rem; margin-bottom: 0.5rem;">
          <i class="fas fa-user"></i> ${beat.producer}
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
          ${beat.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
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
        <p style="font-size: 1.1rem;">No se encontraron beats que coincidan con tu búsqueda</p>
      </div>
    `;
    return;
  }

  beatsToShow.forEach(beat => {
    feed.innerHTML += createBeatCard(beat);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Cargar todos los beats
  loadBeats(beats);

  // Filtro de búsqueda
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const keyword = e.target.value.toLowerCase();
      const filtered = beats.filter(beat =>
        beat.title.toLowerCase().includes(keyword) ||
        beat.producer.toLowerCase().includes(keyword) ||
        beat.tags.some(tag => tag.toLowerCase().includes(keyword))
      );
      loadBeats(filtered);
    });
  }

  // Filtros de tipo
  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      // Remover clase active de todos
      filterBtns.forEach(b => b.classList.remove("active"));
      // Añadir clase active al botón clickeado
      btn.classList.add("active");

      const filter = btn.getAttribute("data-filter");
      let filtered = beats;

      if (filter !== "all") {
        filtered = beats.filter(beat => beat.type === filter);
      }

      loadBeats(filtered);
    });
  });
});

