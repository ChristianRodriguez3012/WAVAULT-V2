// db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Ruta absoluta a la base de datos
const dbPath = path.resolve(__dirname, 'wavault.db');
const db = new sqlite3.Database(dbPath);

// Crear tablas si no existen
db.serialize(() => {
  // Tabla de usuarios
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      rol TEXT CHECK (rol IN ('cliente', 'productor')) NOT NULL
    )
  `);

  // Tabla de beats
  db.run(`
    CREATE TABLE IF NOT EXISTS beats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      precio REAL NOT NULL,
      archivo_url TEXT NOT NULL,
      productor_id INTEGER NOT NULL,
      FOREIGN KEY (productor_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )
  `);
});

module.exports = db;
