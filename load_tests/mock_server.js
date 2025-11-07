const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

const sampleBeats = [
  { id: 1, title: "E2E Test Beat", genre: "trap", price: 10 },
  { id: 2, title: "Demo Beat", genre: "rap", price: 5 }
];

app.get("/api/beats", (req, res) => {
  res.json(sampleBeats);
});

app.get("/api/beats/search", (req, res) => {
  const q = (req.query.q || "").toLowerCase();
  const results = sampleBeats.filter(b =>
    b.title.toLowerCase().includes(q) || b.genre.toLowerCase().includes(q)
  );
  res.json(results);
});

app.get("/", (req, res) => res.send("Mock server OK"));

app.listen(port, "0.0.0.0", () => {
  console.log(`Mock API server listening on http://0.0.0.0:${port}`);
});
