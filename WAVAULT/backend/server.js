const path = require("path");
// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require("express");
const fs = require("fs");
const multer = require("multer");
const db = require("./db");
const { spawn } = require("child_process");

const app = express();
const port = process.env.PORT || 3000;

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

app.get("/upload-beat", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "upload-beat-final.html"));
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
// NOTA: Endpoint movido a línea 585 con soporte para múltiples archivos (audio + cover)

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
// ✅ ANÁLISIS DE BEATS CON IA
// ===================
const AudioAIAnalyzer = require("./ai-analysis-integration");
const analyzer = new AudioAIAnalyzer();

/**
 * POST /api/analyze-beat
 * Analiza un beat subido y retorna características técnicas + IA
 */
app.post("/api/analyze-beat", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionó archivo de audio"
      });
    }

    console.log(`📊 Analizando beat: ${req.file.originalname}`);
    
    // Analizar con IA, pasando el nombre original del archivo
    const result = await analyzer.analyze(req.file.path, req.file.originalname);

    if (result.status !== "success") {
      return res.status(500).json({
        success: false,
        message: result.message || "Error en análisis"
      });
    }

    console.log(`✅ Beat analizado exitosamente`);
    
    return res.json({
      success: true,
      analysis: result
    });

  } catch (error) {
    console.error("❌ Error analizando beat:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/parse-filename
 * Extrae metadatos del nombre del archivo usando la estructura exacta
 * Body: { filename: "Tropical Vibes - Drake Type Beat - Drake - Fm - 90.mp3" }
 */
app.post("/api/parse-filename", async (req, res) => {
  try {
    const { filename } = req.body;
    
    if (!filename) {
      return res.status(400).json({
        success: false,
        message: "Se requiere 'filename'"
      });
    }
    
    console.log(`📋 Parseando nombre: ${filename}`);
    
    // Llamar al script Python
    const result = await new Promise((resolve, reject) => {
      const { spawn } = require("child_process");
      const pythonProcess = spawn("python3", [
        path.join(__dirname, "parse_filename_ai.py"),
        filename
      ], {
        env: {
          ...process.env,
          GEMINI_API_KEY: process.env.GEMINI_API_KEY || ""
        }
      });
      
      let output = "";
      let errorOutput = "";
      
      pythonProcess.stdout.on("data", (data) => {
        output += data.toString();
      });
      
      pythonProcess.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });
      
      pythonProcess.on("close", (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output);
            resolve(result);
          } catch (e) {
            console.error("Parse error:", e, "Output:", output.substring(0, 500));
            reject(new Error(`JSON parse error: ${output.substring(0, 200)}`));
          }
        } else {
          reject(new Error(`Process failed: ${errorOutput.substring(0, 200)}`));
        }
      });
      
      pythonProcess.on("error", (err) => {
        reject(err);
      });
    });
    
    console.log(`✅ Nombre parseado:`, result);
    
    return res.json(result);
    
  } catch (error) {
    console.error("❌ Error parseando nombre:", error.message);
    
    // Retornar estructura básica si falla
    return res.json({
      beat_name: null,
      beat_type: null,
      reference: null,
      key: null,
      bpm: null,
      beat_name_confidence: 0,
      beat_type_confidence: 0,
      reference_confidence: 0,
      key_confidence: 0,
      bpm_confidence: 0
    });
  }
});

/**
 * POST /api/analyze-beat/inference-only
 * Solo retorna inferencia IA (sin datos técnicos)
 */
app.post("/api/analyze-beat/inference-only", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionó archivo"
      });
    }

    const result = await analyzer.analyzeInferenceOnly(req.file.path);

    return res.json({
      success: true,
      analysis: result
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/enrich-metadata
 * Enriquece metadatos de un beat usando Tunebat + Gemini
 * Body: { filename: "Artist - Title - 120BPM - Cm.mp3" }
 */
app.post("/api/enrich-metadata", async (req, res) => {
  try {
    const { filename } = req.body;
    
    if (!filename) {
      return res.status(400).json({
        success: false,
        message: "Se requiere 'filename' en el body"
      });
    }
    
    console.log(`📊 Enriqueciendo metadatos: ${filename}`);
    
    // Llamar al script Python
    const result = await new Promise((resolve, reject) => {
      const { spawn } = require("child_process");
      const pythonProcess = spawn("python3", [
        path.join(__dirname, "metadata_enrichment.py"),
        filename
      ], {
        env: {
          ...process.env,
          GEMINI_API_KEY: process.env.GEMINI_API_KEY || ""
        }
      });
      
      let output = "";
      let errorOutput = "";
      
      pythonProcess.stdout.on("data", (data) => {
        output += data.toString();
      });
      
      pythonProcess.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });
      
      pythonProcess.on("close", (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output);
            resolve(result);
          } catch (e) {
            reject(new Error(`JSON parse error: ${output}`));
          }
        } else {
          reject(new Error(`Process failed: ${errorOutput}`));
        }
      });
      
      pythonProcess.on("error", (err) => {
        reject(err);
      });
    });
    
    return res.json({
      success: true,
      enrichment: result
    });
    
  } catch (error) {
    console.error("❌ Error enriqueciendo metadatos:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/enrich-beats-simple
 * Enriquece metadatos usando SOLO Gemini Web Search (sin Tunebat)
 * Body: { filename: "Artist - Title - 120BPM - Cm.mp3" }
 */
app.post("/api/enrich-beats-simple", async (req, res) => {
  try {
    const { filename } = req.body;
    
    if (!filename) {
      return res.status(400).json({
        success: false,
        message: "Se requiere 'filename'"
      });
    }
    
    console.log(`📊 Enriqueciendo (Gemini): ${filename}`);
    
    // Usar metadata_enrichment.py que NO requiere archivo físico
    const result = await new Promise((resolve, reject) => {
      const { spawn } = require("child_process");
      const pythonProcess = spawn("python3", [
        path.join(__dirname, "metadata_enrichment.py"),
        filename
      ], {
        env: {
          ...process.env,
          GEMINI_API_KEY: process.env.GEMINI_API_KEY || ""
        }
      });
      
      let output = "";
      let errorOutput = "";
      
      pythonProcess.stdout.on("data", (data) => {
        output += data.toString();
      });
      
      pythonProcess.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });
      
      pythonProcess.on("close", (code) => {
        if (code === 0) {
          try {
            const data = JSON.parse(output);
            resolve(data);
          } catch (e) {
            reject(new Error(`JSON parse error: ${output.substring(0, 200)}`));
          }
        } else {
          reject(new Error(`Python error: ${errorOutput.substring(0, 200)}`));
        }
      });
    });
    
    console.log(`✅ Enriquecimiento completado`);
    
    return res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error("❌ Error en enriquecimiento simple:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /upload-beat
 * Guarda un beat en la BD después de confirmación del usuario
 * El beat SOLO se guarda si el usuario confirma en el modal
 */
app.post("/upload-beat", upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req, res) => {
  try {
    if (!req.files || !req.files.audio) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionó archivo de audio"
      });
    }

    if (!req.files.cover) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionó imagen de portada"
      });
    }

    const audioFile = req.files.audio[0];
    const coverFile = req.files.cover[0];

    const { beat_name, beat_type, reference, key, bpm, mood, price, tags, description, producer, ai_analysis } = req.body;

    // Validar campos requeridos
    if (!beat_name || !bpm || !key || !price || !producer) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos requeridos (beat_name, bpm, key, price, producer)"
      });
    }

    const audioPath = `uploads/audio/${audioFile.filename}`;
    const coverPath = `uploads/covers/${coverFile.filename}`;
    const fullAudioPath = path.join(__dirname, "..", "public", audioPath);

    console.log(`✅ Guardando beat: ${beat_name}`);
    console.log(`   🎵 Audio: ${audioPath}`);
    console.log(`   🖼️  Cover: ${coverPath}`);
    console.log(`   🎵 BPM: ${bpm} | Key: ${key} | Type: ${beat_type}`);

    // Insertar en BD
    db.run(
      `INSERT INTO beats (title, artist, bpm, key, type, mood, price, tags, cover, audio, producer, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [beat_name, reference || 'Unknown', bpm, key, beat_type, mood, price, tags || "beat", coverPath, audioPath, producer, description || null],
      function (err) {
        if (err) {
          console.error("❌ Error al guardar beat:", err.message);
          return res.status(500).json({
            success: false,
            message: "Error al guardar el beat en la BD"
          });
        }

        const beatId = this.lastID;
        console.log(`✅ Beat guardado con ID: ${beatId}`);

        // Guardar análisis IA si está disponible
        if (ai_analysis) {
          try {
            const analysisData = JSON.parse(ai_analysis);
            console.log(`🤖 Guardando análisis IA para beat ${beatId}`);
          } catch (e) {
            console.error('⚠️ Error parseando ai_analysis:', e.message);
          }
        }

        // Generar demo con marca de agua (opcional)
        const demoPath = fullAudioPath.replace(/\.mp3$/i, "_demo.mp3");
        const scriptPath = path.join(__dirname, "generar_demo.py");

        if (fs.existsSync(scriptPath)) {
          const py = spawn("python3", [scriptPath, fullAudioPath, demoPath]);

          py.stdout.on("data", data => console.log("🐍 Demo:", data.toString()));
          py.stderr.on("data", data => console.error("❌ Demo error:", data.toString()));

          py.on("close", (code) => {
            if (code === 0) {
              const relativeDemoPath = audioPath.replace(/\.mp3$/i, "_demo.mp3");
              db.run(`UPDATE beats SET demo = ? WHERE id = ?`, [relativeDemoPath, beatId]);
              console.log(`✅ Demo generada: ${demoPath}`);
            }
          });
        }

        return res.json({
          success: true,
          message: "✅ Beat guardado exitosamente",
          beatId: beatId
        });
      }
    );

  } catch (error) {
    console.error("❌ Error en /upload-beat:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
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
