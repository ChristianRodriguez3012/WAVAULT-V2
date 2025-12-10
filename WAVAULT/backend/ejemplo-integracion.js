/**
 * ejemplo-integracion.js
 * Ejemplo práctico de uso del analizador de audio con IA en una ruta Express
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const AudioAIAnalyzer = require('./ai-analysis-integration');

const router = express.Router();
const analyzer = new AudioAIAnalyzer(); // Usa GEMINI_API_KEY del environment

/**
 * POST /api/analyze-beat
 * Analiza un archivo de beat (audio) y retorna análisis técnico + IA
 * 
 * Body (form-data):
 * - file: archivo mp3/wav/etc
 * 
 * Response:
 * {
 *   "status": "success",
 *   "technical_data": { ... },
 *   "ai_inference": { "mood": "...", "tags": [...] }
 * }
 */
router.post('/analyze-beat', async (req, res) => {
  try {
    // Validar que hay un archivo
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        error: 'no_file',
        message: 'No se proporcionó archivo de audio'
      });
    }

    // Validar que es un archivo de audio
    const validMimes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/ogg'];
    if (!validMimes.includes(req.file.mimetype)) {
      fs.unlinkSync(req.file.path); // Eliminar archivo
      return res.status(400).json({
        status: 'error',
        error: 'invalid_format',
        message: `Formato no soportado: ${req.file.mimetype}. Use MP3, WAV, FLAC u OGG.`
      });
    }

    // Analizar archivo
    console.log(`📊 Analizando: ${req.file.originalname}`);
    const result = await analyzer.analyze(req.file.path);

    // Eliminar archivo temporal
    fs.unlinkSync(req.file.path);

    // Retornar resultado
    return res.json(result);

  } catch (error) {
    // Limpiar archivo en caso de error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('❌ Error analizando beat:', error.message);
    return res.status(500).json({
      status: 'error',
      error: 'analysis_failed',
      message: error.message
    });
  }
});

/**
 * GET /api/analyze-beat/file/:filename
 * Analiza un archivo que ya existe en el servidor
 * Útil para re-analizar o analizar beats guardados
 */
router.get('/analyze-beat/file/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const audioPath = path.join(__dirname, '..', 'public', 'uploads', 'audio', filename);

    // Validar que el archivo existe
    if (!fs.existsSync(audioPath)) {
      return res.status(404).json({
        status: 'error',
        error: 'file_not_found',
        message: `Archivo no encontrado: ${filename}`
      });
    }

    // Analizar
    console.log(`📊 Re-analizando: ${filename}`);
    const result = await analyzer.analyze(audioPath);

    return res.json(result);

  } catch (error) {
    console.error('❌ Error analizando archivo:', error.message);
    return res.status(500).json({
      status: 'error',
      error: 'analysis_failed',
      message: error.message
    });
  }
});

/**
 * POST /api/analyze-beat/inference-only
 * Solo retorna inferencia IA (sin datos técnicos)
 */
router.post('/analyze-beat/inference-only', async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No se proporcionó archivo'
      });
    }

    const result = await analyzer.analyzeInferenceOnly(req.file.path);
    fs.unlinkSync(req.file.path);

    return res.json(result);

  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * POST /api/analyze-beat/technical-only
 * Solo retorna análisis técnico (sin IA)
 */
router.post('/analyze-beat/technical-only', async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No se proporcionó archivo'
      });
    }

    const result = await analyzer.analyzeTechnicalOnly(req.file.path);
    fs.unlinkSync(req.file.path);

    return res.json(result);

  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;

/**
 * USO EN SERVER.JS:
 * 
 * const analyzeRoutes = require('./ejemplo-integracion');
 * const multer = require('multer');
 * 
 * const upload = multer({ dest: '/tmp' });
 * 
 * app.use('/api', upload.single('file'), analyzeRoutes);
 * 
 * EJEMPLOS DE CURL:
 * 
 * # Análisis completo
 * curl -F "file=@beat.mp3" http://localhost:3000/api/analyze-beat
 * 
 * # Solo inferencia
 * curl -F "file=@beat.mp3" http://localhost:3000/api/analyze-beat/inference-only
 * 
 * # Solo análisis técnico
 * curl -F "file=@beat.mp3" http://localhost:3000/api/analyze-beat/technical-only
 * 
 * # Re-analizar archivo existente
 * curl http://localhost:3000/api/analyze-beat/file/1702123456-beat.mp3
 */
