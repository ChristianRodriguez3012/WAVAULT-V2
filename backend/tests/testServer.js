const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// Storage para subidas temporales
const uploadDir = '/tmp/wavault-uploads';
const demoDir = '/tmp/wavault-demos';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(demoDir)) fs.mkdirSync(demoDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// login mock: devuelve token simple según email
app.post('/auth/login', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });
  if (email.includes('productor')) return res.json({ token: 'producer-token' });
  return res.json({ token: 'client-token' });
});

// Middleware de autorización simple
function requireRole(role) {
  return (req, res, next) => {
    const auth = req.get('authorization') || '';
    const token = auth.replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    // tokens de prueba: 'producer-token' o 'client-token'
    const userRole = token === 'producer-token' ? 'productor'
      : token === 'client-token' ? 'cliente' : null;
    if (!userRole) return res.status(401).json({ error: 'Invalid token' });

    if (role && userRole !== role) return res.status(403).json({ error: 'Forbidden' });

    req.user = { role: userRole, token };
    next();
  };
}

// Endpoint /subir-beat solo para productor: guarda el archivo y genera un "demo" con tag (simulado)
app.post('/subir-beat', requireRole('productor'), upload.single('beat'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });

  const originalName = path.basename(req.file.originalname, path.extname(req.file.originalname));
  const demoName = `${originalName}-demo.mp3`;
  const demoPath = path.join(demoDir, demoName);

  try {
    // Simula procesamiento: copia y añade un "tag" textual al final
    await fs.promises.copyFile(req.file.path, demoPath);
    await fs.promises.appendFile(demoPath, '\n--TAG--'); // marca de prueba
    return res.status(201).json({ demoPath });
  } catch (err) {
    return res.status(500).json({ error: 'processing error', details: err.message });
  }
});

module.exports = app;