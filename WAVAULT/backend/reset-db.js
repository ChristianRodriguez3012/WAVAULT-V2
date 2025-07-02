const db = require("./db");

db.serialize(() => {
  // 🔁 Eliminar tablas anteriores
  db.run(`DROP TABLE IF EXISTS beats`);
  db.run(`DROP TABLE IF EXISTS ventas`);

  // ✅ Crear tabla de beats (con columna demo añadida)
  db.run(`
    CREATE TABLE beats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      price REAL NOT NULL,
      cover TEXT NOT NULL,
      audio TEXT NOT NULL,
      demo TEXT,                   -- ✅ NUEVA COLUMNA PARA EL DEMO
      producer TEXT NOT NULL,
      tags TEXT,
      bpm INTEGER,
      key TEXT
    )
  `, err => {
    if (err) return console.error("❌ Error creando tabla beats:", err.message);
    console.log("✅ Tabla 'beats' creada con éxito.");
  });

  // ✅ Crear tabla de ventas reales
  db.run(`
    CREATE TABLE ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      beat_id INTEGER NOT NULL,
      comprador_email TEXT NOT NULL,
      fecha TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(beat_id) REFERENCES beats(id)
    )
  `, err => {
    if (err) return console.error("❌ Error creando tabla ventas:", err.message);
    console.log("✅ Tabla 'ventas' creada con éxito.");
  });
});
