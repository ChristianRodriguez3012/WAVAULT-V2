const beats = [
  {
    id: 1,
    title: "Dark Trap Vibes",
    producer: "BeatMasterX",
    price: 25,
    cover: "assets/img/beat1.jpg"
  },
  {
    id: 2,
    title: "LoFi Dreams",
    producer: "ChillGuy",
    price: 20,
    cover: "assets/img/beat2.jpg"
  },
  {
    id: 3,
    title: "Hard Drill Beat",
    producer: "808King",
    price: 30,
    cover: "assets/img/beat3.jpg"
  }
];

function loadBeats(beatsToShow) {
  const feed = document.getElementById("beatFeed");
  feed.innerHTML = "";

  beatsToShow.forEach(beat => {
    const card = document.createElement("div");
    card.className = "beat-card";
    card.innerHTML = `
      <img src="${beat.cover}" alt="${beat.title}" />
      <div class="beat-info">
        <h3>${beat.title}</h3>
        <p>👤 ${beat.producer}</p>
        <p>💲${beat.price}</p>
      </div>
    `;
    feed.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadBeats(beats);

  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("input", (e) => {
    const keyword = e.target.value.toLowerCase();
    const filtered = beats.filter(beat =>
      beat.title.toLowerCase().includes(keyword) ||
      beat.producer.toLowerCase().includes(keyword)
    );
    loadBeats(filtered);
  });
});
