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
      audio_processed TEXT,
      demo TEXT,
      producer TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err && !err.message.includes('already exists')) {
      console.error('❌ Error creating beats table:', err.message);
    }
  });

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

  // Agregar columna audio_processed si no existe (para beats anteriores)
  db.all("PRAGMA table_info(beats)", (err, columns) => {
    if (!err && columns) {
      const hasAudioProcessed = columns.some(col => col.name === 'audio_processed');
      if (!hasAudioProcessed) {
        console.log('⚙️ Migrando beats: agregando columna audio_processed...');
        db.run(`ALTER TABLE beats ADD COLUMN audio_processed TEXT`, (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('⚠️ Error adding audio_processed column:', err.message);
          } else if (!err) {
            console.log('✅ Columna audio_processed agregada');
          }
        });
      }
    }
  });
});

module.exports = db;
