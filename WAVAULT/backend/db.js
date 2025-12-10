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

  // Tabla de beats (ACTUALIZADO: incluye todos los campos necesarios)
  db.run(`
    CREATE TABLE IF NOT EXISTS beats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      artist TEXT DEFAULT 'Unknown Artist',
      price REAL NOT NULL,
      tags TEXT DEFAULT 'beat',
      bpm INTEGER,
      key TEXT,
      type TEXT,
      mood TEXT,
      cover TEXT,
      audio TEXT NOT NULL,
      demo TEXT,
      producer TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de ventas
  db.run(`
    CREATE TABLE IF NOT EXISTS ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      beat_id INTEGER NOT NULL,
      comprador_email TEXT NOT NULL,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (beat_id) REFERENCES beats(id) ON DELETE CASCADE
    )
  `);
});

module.exports = db;
