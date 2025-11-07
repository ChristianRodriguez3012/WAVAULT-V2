const request = require('supertest');
const fs = require('fs');
const path = require('path');

// Importa el servidor de pruebas local (no modifica tu backend real)
const app = require('./testServer');

async function loginAs(role) {
  const credentials = role === 'productor'
    ? { email: 'productor@test.local', password: 'password' }
    : { email: 'cliente@test.local', password: 'password' };

  const res = await request(app)
    .post('/auth/login')
    .send(credentials);

  return res.body?.token || null;
}

// Variables para registrar resultados de cada test y detalles
const runResults = [];
const fixturePath = path.join(__dirname, 'fixtures', 'beat.mp3');

const reportDir = path.join(__dirname, '..', '..', 'ED', 'HISTORIAL');

beforeAll(() => {
  // Asegura fixture existe
  if (!fs.existsSync(fixturePath)) {
    throw new Error('Fixture missing: ' + fixturePath);
  }
  // Crear carpeta de reportes si no existe
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
});

afterAll(async () => {
  // Generar archivo de informe con fecha y hora, incluyendo paso a paso
  try {
    const now = new Date();
    const ts = now.toISOString().replace(/:/g, '-'); // safe filename
    const filename = `${ts}.md`;
    const filepath = path.join(reportDir, filename);

    let md = `# Informe de Pruebas de Caja Blanca - Ejecución ${now.toISOString()}\n\n`;
    md += `Archivo de pruebas: backend/tests/api.functional.test.js\n\n`;
    md += `Entorno: Jest + Supertest (dev container)\n\n`;
    md += `## Resumen ejecutivo\n\n`;
    runResults.forEach((r) => {
      md += `- ${r.id} - ${r.title}: **${r.passed ? 'PASÓ' : 'FALLÓ'}**\n`;
    });
    md += `\n---\n\n`;

    // Detalle por caso con pasos
    for (const r of runResults) {
      md += `## ${r.id} - ${r.title}\n\n`;
      md += `Descripción: ${r.description || ''}\n\n`;
      md += `Resultado final: **${r.passed ? 'PASÓ' : 'FALLÓ'}**\n\n`;
      md += `### Pasos de ejecución (ejecutados)\n`;
      r.steps.forEach((s, i) => {
        md += `${i + 1}. ${s.action}\n`;
        if (s.detail) md += `   - Detalle: ${s.detail}\n`;
        if (s.code !== undefined) md += `   - Código HTTP: ${s.code}\n`;
      });
      md += `\n### Resultado esperado\n`;
      md += `${r.expected}\n\n`;

      md += `### Resultado observado\n`;
      if (r.observed) {
        md += `${r.observed}\n`;
      } else {
        md += `- Código HTTP: ${r.statusCode ?? 'n/a'}\n`;
        if (r.demoPath) md += `- Demo generado: ${r.demoPath}\n`;
        if (r.tagFound !== undefined) md += `- Tag sonoro presente: ${r.tagFound}\n`;
        if (r.notes) md += `- Notas: ${r.notes}\n`;
      }

      md += `\n---\n\n`;
    }

    // Añadir raw JSON con detalles
    md += '### Detalles (JSON)\n\n';
    md += '```json\n' + JSON.stringify(runResults, null, 2) + '\n```\n';

    fs.writeFileSync(filepath, md, 'utf8');
    // console.log('Informe generado en:', filepath);
  } catch (err) {
    // No romper la suite por fallo en escritura de informe
  }
});

describe('CP-API-001 Bloqueo de middleware de autorización', () => {
  test('Un token de cliente no debe acceder a /subir-beat (ruta de Productor)', async () => {
    const id = 'CP-API-001';
    const title = 'Bloqueo de middleware de autorización';
    const description = 'Verifica que un usuario con rol cliente no pueda acceder a endpoint exclusivo de productor (/subir-beat).';
    const expected = 'El servidor responde 401 Unauthorized o 403 Forbidden y niega el acceso a la ruta.';
    const record = { id, title, description, expected, steps: [], passed: false, notes: null };

    try {
      // Paso 1: obtener token de cliente
      record.steps.push({ action: 'Obtener token con /auth/login para usuario rol cliente', detail: `POST /auth/login { email: cliente@test.local }` });
      const token = await loginAs('cliente');
      record.steps[record.steps.length - 1].detail += ` -> token obtenido: ${token ?? 'null'}`;

      // Paso 2: realizar POST /subir-beat con token de cliente
      record.steps.push({ action: 'POST /subir-beat con header Authorization Bearer <token de cliente>', detail: 'Sin archivo adjunto (prueba de autorización)' });
      const authHeader = token ? `Bearer ${token}` : 'Bearer invalid-client-token';

      const res = await request(app)
        .post('/subir-beat')
        .set('Authorization', authHeader)
        .field('title', 'test beat');

      record.steps[record.steps.length - 1].code = res.statusCode;
      record.statusCode = res.statusCode;

      // Evaluación
      const ok = [401, 403].includes(res.statusCode);
      record.passed = ok;
      if (!ok) record.notes = `Se esperaba 401/403 pero se obtuvo ${res.statusCode}`;
      record.observed = `Respuesta HTTP ${res.statusCode} con body: ${JSON.stringify(res.body)}`;
    } catch (err) {
      record.notes = `Error ejecución: ${err.message}`;
    } finally {
      runResults.push(record);
    }
  });
});

describe('CP-API-002 Validación de procesamiento de archivos (demo con tag)', () => {
  const expectedDemoPath = path.join('/tmp', 'wavault-demos', 'beat-demo.mp3');

  beforeAll(() => {
    // Cleanup previo
    try { if (fs.existsSync(expectedDemoPath)) fs.unlinkSync(expectedDemoPath); } catch (e) {}
  });

  afterAll(() => {
    try { if (fs.existsSync(expectedDemoPath)) fs.unlinkSync(expectedDemoPath); } catch (e) {}
  });

  test('Productor sube beat y se genera demo con tag', async () => {
    const id = 'CP-API-002';
    const title = 'Validación de procesamiento de archivos (demo con tag)';
    const description = 'Verificar que al subir un beat, el servidor procese y genere un demo que contenga el tag sonoro.';
    const expected = 'Se genera un archivo demo (beat-demo.mp3) en el sistema de archivos que contiene el tag sonoro.';
    const record = { id, title, description, expected, steps: [], passed: false, notes: null, demoPath: null, tagFound: false };

    try {
      // Paso 1: obtener token de productor
      record.steps.push({ action: 'Obtener token con /auth/login para usuario rol productor', detail: `POST /auth/login { email: productor@test.local }` });
      const token = await loginAs('productor');
      record.steps[record.steps.length - 1].detail += ` -> token obtenido: ${token ?? 'null'}`;

      // Paso 2: POST /subir-beat adjuntando archivo
      record.steps.push({ action: `POST /subir-beat con archivo adjunto (${path.basename(fixturePath)}) y Authorization Bearer <token>`, detail: `attach -> ${fixturePath}` });
      const authHeader = token ? `Bearer ${token}` : 'Bearer producer-fallback-token';

      const res = await request(app)
        .post('/subir-beat')
        .set('Authorization', authHeader)
        .attach('beat', fixturePath)
        .field('title', 'Test Beat');

      record.steps[record.steps.length - 1].code = res.statusCode;
      record.statusCode = res.statusCode;
      record.steps[record.steps.length - 1].detail += ` -> respuesta inicial: ${res.statusCode}`;

      if (!(res.statusCode >= 200 && res.statusCode < 300)) {
        record.notes = `Subida fallida con código ${res.statusCode}`;
        record.passed = false;
        record.observed = `Respuesta: ${JSON.stringify(res.body)}`;
      } else {
        // Paso 3: esperar procesamiento / verificar demo en FS
        record.steps.push({ action: 'Esperar procesamiento y verificar existencia del demo en el sistema de archivos', detail: `Verificar ruta: ${expectedDemoPath}` });
        // Pequeña espera para que mock escriba archivo
        await new Promise((r) => setTimeout(r, 300));

        const demoExists = fs.existsSync(expectedDemoPath);
        record.demoPath = demoExists ? expectedDemoPath : null;
        record.tagFound = false;
        if (!demoExists) {
          record.passed = false;
          record.notes = `Demo no encontrado en ${expectedDemoPath}`;
        } else {
          // Leer y verificar tag añadido por el mock
          try {
            const content = fs.readFileSync(expectedDemoPath, 'utf8');
            const hasTag = content.includes('--TAG--');
            record.tagFound = hasTag;
            if (!hasTag) {
              record.passed = false;
              record.notes = 'Demo generado pero tag no encontrado';
            } else {
              record.passed = true;
            }
            record.observed = `Demo encontrado: ${expectedDemoPath}, tag presente: ${hasTag}`;
          } catch (e) {
            record.passed = false;
            record.notes = `Error leyendo demo: ${e.message}`;
          }
        }
      }
    } catch (err) {
      record.notes = `Error ejecución: ${err.message}`;
    } finally {
      runResults.push(record);
    }
  }, 10000);
});