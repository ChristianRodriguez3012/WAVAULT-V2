const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const db = require("./db");
const { spawn } = require("child_process");

const app = express();
const port = 3000;

// =====================
// ✅ CONFIGURAR MULTER
// =====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = file.fieldname === "cover" ? "covers" : "audio";
    const dir = path.join(__dirname, "..", "public", "uploads", folder);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "_");
    const uniqueName = `${Date.now()}-${safeName}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// ===================
// ✅ MIDDLEWARES
// ===================
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));
app.use("/uploads", express.static(path.join(__dirname, "..", "public", "uploads")));

// ===================
// ✅ RUTAS PRINCIPALES
// ===================
app.get("/", (req, res) => {
  res.redirect("/login.html");
});

app.get("/WAVAULT/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "client.html"));
});

// ===================
// ✅ REGISTRO DE USUARIO
// ===================
app.post("/registro", (req, res) => {
  const { email, password, rol } = req.body;
  if (!email || !password || !rol) {
    return res.status(400).json({ error: "Faltan campos requeridos." });
  }

  db.run(
    `INSERT INTO usuarios (email, password, rol) VALUES (?, ?, ?)`,
    [email, password, rol],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    }
  );
});

// ===================
// ✅ LOGIN DE USUARIO
// ===================
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Correo y contraseña son requeridos." });
  }

  db.get(
    `SELECT * FROM usuarios WHERE email = ? AND password = ?`,
    [email, password],
    (err, row) => {
      if (err) return res.status(500).json({ error: "Error del servidor." });
      if (!row) return res.status(401).json({ error: "Credenciales inválidas." });

      res.json({
        id: row.id,
        email: row.email,
        rol: row.rol
      });
    }
  );
});

// ==========================
// ✅ SUBIDA DE BEATS (POST)
// ==========================
app.post("/subir-beat", upload.fields([
  { name: "cover", maxCount: 1 },
  { name: "audio", maxCount: 1 }
]), (req, res) => {
  const { title, price, producer, tags, bpm, key } = req.body;
  const coverFile = req.files?.cover?.[0];
  const audioFile = req.files?.audio?.[0];

  if (!title || !price || !producer || !tags || !bpm || !key || !coverFile || !audioFile) {
    return res.status(400).json({ error: "Faltan campos o archivos requeridos." });
  }

  const coverPath = `uploads/covers/${coverFile.filename}`;
  const audioPath = `uploads/audio/${audioFile.filename}`;
  const fullAudioPath = path.join(__dirname, "..", "public", audioPath);

  console.log("✅ Archivos guardados:");
  console.log("   🎨 Cover:", coverPath);
  console.log("   🎵 Audio:", audioPath);

  db.run(
    `INSERT INTO beats (title, price, tags, bpm, key, cover, audio, producer)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, price, tags, bpm, key, coverPath, audioPath, producer],
    function (err) {
      if (err) {
        console.error("❌ Error al guardar beat:", err.message);
        return res.status(500).json({ error: "Error al guardar el beat." });
      }

      const beatId = this.lastID;

      // ✅ Generar demo con marca de agua usando Python
      if (audioFile.mimetype === "audio/mpeg" || audioFile.filename.endsWith(".mp3")) {
        const demoPath = fullAudioPath.replace(/\.mp3$/i, "_demo.mp3");
        const scriptPath = path.join(__dirname, "generar_demo.py");

        const py = spawn("python3", [scriptPath, fullAudioPath, demoPath]);

        py.stdout.on("data", data => console.log("🐍 Python:", data.toString()));
        py.stderr.on("data", data => console.error("❌ Python error:", data.toString()));

        py.on("close", (code) => {
          if (code === 0) {
            console.log("✅ Demo generada:", demoPath);
            const relativeDemoPath = audioPath.replace(/\.mp3$/i, "_demo.mp3");
            db.run(`UPDATE beats SET demo = ? WHERE id = ?`, [relativeDemoPath, beatId]);
          } else {
            console.error("❌ Error generando demo con Python");
          }
        });
      }

      res.status(201).json({ id: beatId });
    }
  );
});

// ===================
// ✅ OBTENER BEATS
// ===================
app.get("/beats", (req, res) => {
  db.all(`SELECT * FROM beats`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ============================
// ✅ REGISTRAR VENTA REAL
// ============================
app.post("/registrar-venta", (req, res) => {
  const { comprador, beats } = req.body;

  if (!comprador || !Array.isArray(beats)) {
    return res.status(400).json({ error: "Faltan datos para registrar la venta." });
  }

  const stmt = db.prepare(`INSERT INTO ventas (beat_id, comprador_email) VALUES (?, ?)`);

  beats.forEach(beat => {
    if (beat.id) stmt.run(beat.id, comprador);
  });

  stmt.finalize(err => {
    if (err) {
      console.error("❌ Error al registrar venta:", err.message);
      return res.status(500).json({ error: "Error al registrar venta." });
    }

    res.json({ mensaje: "✅ Ventas registradas." });
  });
});

// ============================
// ✅ OBTENER VENTAS POR PRODUCTOR
// ============================
app.get("/ventas", (req, res) => {
  const { producer } = req.query;
  if (!producer) return res.status(400).json({ error: "Falta parámetro 'producer'." });

  db.all(`
    SELECT 
      b.id, b.title, b.cover, v.comprador_email AS comprador
    FROM ventas v
    JOIN beats b ON b.id = v.beat_id
    WHERE b.producer = ?
  `, [producer], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ============================
// ✅ ELIMINAR BEAT
// ============================
app.delete("/borrar-beat/:id", (req, res) => {
  const beatId = req.params.id;
  const { producer } = req.body;

  if (!producer) {
    return res.status(400).json({ error: "Falta el campo 'producer'." });
  }

  db.get(`SELECT * FROM beats WHERE id = ?`, [beatId], (err, beat) => {
    if (err) {
      console.error("❌ Error al buscar beat:", err.message);
      return res.status(500).json({ error: "Error interno del servidor." });
    }

    if (!beat) {
      return res.status(404).json({ error: "Beat no encontrado." });
    }

    if (beat.producer !== producer) {
      return res.status(403).json({ error: "No tienes permiso para eliminar este beat." });
    }

    try {
      const fullCover = path.join(__dirname, "..", "public", beat.cover);
      const fullAudio = path.join(__dirname, "..", "public", beat.audio);
      const fullDemo = beat.demo ? path.join(__dirname, "..", "public", beat.demo) : null;

      if (fs.existsSync(fullCover)) fs.unlinkSync(fullCover);
      if (fs.existsSync(fullAudio)) fs.unlinkSync(fullAudio);
      if (fullDemo && fs.existsSync(fullDemo)) fs.unlinkSync(fullDemo);
    } catch (fileErr) {
      console.warn("⚠️ Error eliminando archivos:", fileErr.message);
    }

    db.run(`DELETE FROM beats WHERE id = ?`, [beatId], function (err) {
      if (err) {
        console.error("❌ Error al eliminar beat:", err.message);
        return res.status(500).json({ error: "Error al eliminar el beat." });
      }

      res.json({ success: true, mensaje: "🗑️ Beat eliminado correctamente." });
    });
  });
});

// ===================
// 🔁 RUTA 404
// ===================
app.use((req, res) => {
  res.status(404).send("Página no encontrada");
});

// ===================
// ✅ INICIAR SERVIDOR
// ===================
app.listen(port, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${port}`);
});
