const express = require('express');
const app = express();

app.use(express.json());

// Almacenamiento en memoria para pruebas
const store = [];
let nextId = 1;

// Ruta de ejemplo requerida por la prueba
app.get('/ruta-de-ejemplo', (req, res) => {
  res.status(200).json({ ok: true });
});

// Crear recurso (esperado por la prueba)
app.post('/ruta-de-ejemplo', (req, res) => {
  const { nombre } = req.body || {};
  if (!nombre) return res.status(400).json({ error: 'nombre es requerido' });

  const item = { id: nextId++, nombre };
  store.push(item);
  res.status(201).json(item);
});

// Obtener recurso por id (esperado por la prueba)
app.get('/ruta-de-ejemplo/:id', (req, res) => {
  const id = Number(req.params.id);
  const item = store.find((i) => i.id === id);
  if (!item) return res.status(404).json({ error: 'no encontrado' });
  res.status(200).json(item);
});

module.exports = app;