/**
 * INTEGRACIÓN RÁPIDA EN server.js EXISTENTE
 * 
 * Este archivo muestra cómo integrar analyze_beat_ai.py
 * en el server.js actual de WAVAULT
 */

// ============================================
// 1. AGREGAR AL PRINCIPIO DE server.js
// ============================================

const AudioAIAnalyzer = require('./ai-analysis-integration');

// Instanciar analizador (usará GEMINI_API_KEY del environment)
const audioAnalyzer = new AudioAIAnalyzer();

// ============================================
// 2. AGREGAR NUEVA RUTA PARA ANÁLISIS DE AUDIO
// ============================================

/**
 * POST /upload-beat-with-ai
 * Sube un beat y realiza análisis técnico + IA
 */
app.post('/upload-beat-with-ai', upload.single('audio'), async (req, res) => {
  try {
    const userId = req.body.userId;
    const beatName = req.body.beatName || 'Sin nombre';
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó archivo de audio'
      });
    }

    console.log(`🎵 Analizando beat: ${req.file.filename}`);
    
    // Analizar con IA
    const analysis = await audioAnalyzer.analyze(req.file.path);
    
    if (analysis.status !== 'success') {
      throw new Error(analysis.message || 'Error en análisis');
    }

    // Guardar en base de datos junto con análisis
    const beatData = {
      userId: userId,
      name: beatName,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      
      // Datos técnicos
      bpm: analysis.technical_data.bpm,
      key: analysis.technical_data.key,
      duration: analysis.technical_data.duration,
      spectral_centroid: analysis.technical_data.spectral_centroid,
      
      // IA Inference
      mood: analysis.ai_inference.mood,
      tags: analysis.ai_inference.tags,
      
      uploadDate: new Date(),
      analyzed: true
    };

    // Ejecutar query a DB (ajustar según tu estructura)
    const query = `
      INSERT INTO beats (
        user_id, name, filename, mimetype, size,
        bpm, key, duration, spectral_centroid,
        mood, tags, upload_date, analyzed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(query, [
      beatData.userId, beatData.name, beatData.filename, beatData.mimetype, beatData.size,
      beatData.bpm, beatData.key, beatData.duration, beatData.spectral_centroid,
      beatData.mood, JSON.stringify(beatData.tags), beatData.uploadDate, 1
    ], (err) => {
      if (err) {
        console.error('❌ Error guardando beat:', err);
        return res.status(500).json({
          success: false,
          message: 'Error guardando beat en base de datos'
        });
      }

      console.log(`✅ Beat analizado y guardado: ${beatData.filename}`);
      res.json({
        success: true,
        beat: beatData,
        analysis: analysis
      });
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================
// 3. AGREGAR RUTA PARA OBTENER ANÁLISIS
// ============================================

/**
 * GET /beat/:beatId/analysis
 * Obtiene datos de análisis de un beat
 */
app.get('/beat/:beatId/analysis', (req, res) => {
  const beatId = req.params.beatId;
  
  const query = `
    SELECT bpm, key, duration, spectral_centroid, mood, tags
    FROM beats WHERE id = ?
  `;
  
  db.get(query, [beatId], (err, row) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error obteniendo análisis'
      });
    }
    
    if (!row) {
      return res.status(404).json({
        success: false,
        message: 'Beat no encontrado'
      });
    }
    
    res.json({
      success: true,
      technical_data: {
        bpm: row.bpm,
        key: row.key,
        duration: row.duration,
        spectral_centroid: row.spectral_centroid
      },
      ai_inference: {
        mood: row.mood,
        tags: JSON.parse(row.tags)
      }
    });
  });
});

// ============================================
// 4. AGREGAR RUTA PARA RE-ANALIZAR BEAT
// ============================================

/**
 * POST /beat/:beatId/re-analyze
 * Re-analiza un beat existente
 */
app.post('/beat/:beatId/re-analyze', async (req, res) => {
  const beatId = req.params.beatId;
  
  try {
    // Obtener info del beat
    db.get('SELECT filename FROM beats WHERE id = ?', [beatId], async (err, row) => {
      if (err || !row) {
        return res.status(404).json({
          success: false,
          message: 'Beat no encontrado'
        });
      }

      const audioPath = path.join(__dirname, '..', 'public', 'uploads', 'audio', row.filename);
      
      // Re-analizar
      const analysis = await audioAnalyzer.analyze(audioPath);
      
      // Actualizar en BD
      const updateQuery = `
        UPDATE beats SET
          bpm = ?, key = ?, duration = ?, spectral_centroid = ?,
          mood = ?, tags = ?
        WHERE id = ?
      `;
      
      db.run(updateQuery, [
        analysis.technical_data.bpm,
        analysis.technical_data.key,
        analysis.technical_data.duration,
        analysis.technical_data.spectral_centroid,
        analysis.ai_inference.mood,
        JSON.stringify(analysis.ai_inference.tags),
        beatId
      ], (err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Error actualizando análisis'
          });
        }

        res.json({
          success: true,
          analysis: analysis
        });
      });
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================
// 5. AGREGAR RUTA PARA BUSCAR POR MOOD
// ============================================

/**
 * GET /beats/by-mood/:mood
 * Obtiene todos los beats con un mood específico
 */
app.get('/beats/by-mood/:mood', (req, res) => {
  const mood = req.params.mood;
  
  const query = `SELECT * FROM beats WHERE mood LIKE ? ORDER BY upload_date DESC`;
  
  db.all(query, [`%${mood}%`], (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error obteniendo beats'
      });
    }
    
    const beats = rows.map(row => ({
      ...row,
      tags: JSON.parse(row.tags)
    }));
    
    res.json({
      success: true,
      count: beats.length,
      beats: beats
    });
  });
});

// ============================================
// 6. AGREGAR RUTA PARA FILTRAR POR TAGS
// ============================================

/**
 * GET /beats/by-tag/:tag
 * Obtiene beats que contienen un tag específico
 */
app.get('/beats/by-tag/:tag', (req, res) => {
  const tag = req.params.tag;
  
  db.all('SELECT * FROM beats WHERE tags LIKE ? ORDER BY upload_date DESC',
    [`%${tag}%`], (err, rows) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Error obteniendo beats'
        });
      }
      
      const beats = rows.map(row => ({
        ...row,
        tags: JSON.parse(row.tags)
      }));
      
      res.json({
        success: true,
        count: beats.length,
        beats: beats
      });
    }
  );
});

// ============================================
// 7. AGREGAR ESTADÍSTICAS DE ANÁLISIS
// ============================================

/**
 * GET /stats/analysis
 * Obtiene estadísticas sobre análisis realizados
 */
app.get('/stats/analysis', (req, res) => {
  db.all('SELECT mood, COUNT(*) as count FROM beats WHERE analyzed = 1 GROUP BY mood',
    (err, moods) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Error obteniendo estadísticas'
        });
      }

      db.get('SELECT AVG(bpm) as avg_bpm, MIN(bpm) as min_bpm, MAX(bpm) as max_bpm FROM beats',
        (err, tempos) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: 'Error obteniendo estadísticas'
            });
          }

          res.json({
            success: true,
            stats: {
              moods: moods || [],
              tempo: tempos || {
                avg_bpm: 0,
                min_bpm: 0,
                max_bpm: 0
              }
            }
          });
        }
      );
    }
  );
});

// ============================================
// 8. VARIABLES DE ENTORNO REQUERIDAS
// ============================================

/*
Agregar a .env o configuración:

GEMINI_API_KEY=tu_api_key_aqui

O ejecutar servidor con:

GEMINI_API_KEY="tu_api_key" node server.js
*/

// ============================================
// 9. EJEMPLO DE CLIENTE (FRONTEND)
// ============================================

/*
// HTML Form
<form id="beatForm" enctype="multipart/form-data">
  <input type="file" name="audio" accept="audio/*" required>
  <input type="text" name="beatName" placeholder="Nombre del beat">
  <input type="hidden" name="userId" value="123">
  <button type="submit">Subir y Analizar</button>
  <div id="result"></div>
</form>

// JavaScript
document.getElementById('beatForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(this);
  
  const response = await fetch('/upload-beat-with-ai', {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('Beat analizado:');
    console.log('Mood:', data.beat.mood);
    console.log('Tags:', data.beat.tags);
    console.log('BPM:', data.beat.bpm);
    
    document.getElementById('result').innerHTML = `
      <h3>${data.beat.name}</h3>
      <p><strong>Mood:</strong> ${data.beat.mood}</p>
      <p><strong>Tags:</strong> ${data.beat.tags.join(', ')}</p>
      <p><strong>BPM:</strong> ${data.beat.bpm}</p>
      <p><strong>Key:</strong> ${data.beat.key}</p>
    `;
  } else {
    alert('Error: ' + data.message);
  }
});
*/

// ============================================
// 10. SCHEMA DB SUGERIDO
// ============================================

/*
CREATE TABLE beats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  filename TEXT NOT NULL UNIQUE,
  mimetype TEXT,
  size INTEGER,
  
  -- Datos técnicos
  bpm INTEGER,
  key TEXT,
  duration INTEGER,
  spectral_centroid INTEGER,
  
  -- IA Inference
  mood TEXT,
  tags TEXT,  -- JSON string
  
  analyzed BOOLEAN DEFAULT 0,
  upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_user_beats ON beats(user_id);
CREATE INDEX idx_mood ON beats(mood);
CREATE INDEX idx_analyzed ON beats(analyzed);
*/
