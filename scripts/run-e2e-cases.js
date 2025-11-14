const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

function uniqueEmail(prefix) {
  const ts = Date.now();
  return `${prefix}+${ts}@example.com`;
}

async function cpE2E_001(page, producerEmail) {
  const title = `E2E Test Beat ${Date.now()}`;
  console.log('[CP-E2E-001] Registro/Login productora y subida de beat ->', title);

  // Registrar productor
  await page.request.post('http://localhost:3000/registro', {
    data: { email: producerEmail, password: 'prod-pass', rol: 'productor' }
  }).catch(() => {});

  // Login
  await page.goto('http://localhost:3000/login.html');
  await page.fill('#loginEmail', producerEmail);
  await page.fill('#loginPassword', 'prod-pass');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'load' }),
    page.click('#loginForm button[type=submit]')
  ]);

  page.on('console', m => console.log('PAGE LOG:', m.text()));
  page.on('pageerror', e => console.log('PAGE ERROR:', e.message));
  page.on('request', req => console.log('PAGE REQ:', req.method(), req.url()));
  page.on('requestfailed', req => console.log('PAGE REQ FAILED:', req.method(), req.url(), req.failure()?.errorText));
  // Mostrar la sección "Subir" y esperar el formulario visible
  await page.waitForSelector('a[data-seccion="subir"]', { timeout: 10000 });
  await page.click('a[data-seccion="subir"]');
  await page.waitForSelector('#formSubirBeat', { state: 'visible', timeout: 10000 });

  // Ir a sección Subir
  await page.click('a[data-seccion="subir"]');
  // Rellenar formulario
  await page.fill('#tituloBeat', title);
  await page.fill('#precioBeat', '9.99');
  await page.fill('#tag1', 'hiphop');
  await page.fill('#tag2', 'drill');
  await page.fill('#tag3', 'mood');
  await page.fill('#bpm', '90');
  await page.selectOption('#key', 'C Maj');

  const fixtures = path.join(__dirname, '..', 'tests', 'fixtures');
  const audioPath = path.join(fixtures, 'sample.mp3');
  const coverPath = path.join(fixtures, 'sample.jpg');

  await page.setInputFiles('#archivoPortada', coverPath);
  await page.setInputFiles('#archivoAudio', audioPath);

  // Submit y esperar que aparezca en Mis Beats
  // Esperar la respuesta del endpoint /subir-beat (aceptar cualquier status y validar después)
  // Disparar submit programáticamente (algunas apps usan handlers que previenen el submit por defecto)
  const [resp] = await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/subir-beat'), { timeout: 60000 }),
    page.evaluate(() => {
      const form = document.getElementById('formSubirBeat');
      if (!form) throw new Error('Formulario no encontrado al intentar submit');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      return true;
    })
  ]);

  const status = resp.status();
  const body = await resp.text();
  if (status < 200 || status >= 300) {
    throw new Error(`CP-E2E-001: /subir-beat respondió ${status}: ${body}`);
  }

  // After success, the client code calls cargarBeats() and mostrarSeccion('misBeats')
  await page.waitForSelector('#misBeatsList .titulo-beat', { timeout: 5000 });

  const foundTitle = await page.locator('#misBeatsList .titulo-beat', { hasText: title }).first().textContent();
  const priceText = await page.locator('#misBeatsList .beat-info').locator('p', { hasText: '$9.99' }).first().textContent().catch(() => null);

  if (!foundTitle || !foundTitle.includes(title)) {
    throw new Error('CP-E2E-001: El beat no aparece en Mis Beats con el título esperado');
  }
  if (!priceText || !priceText.includes('9.99')) {
    throw new Error('CP-E2E-001: El precio no coincide');
  }

  console.log('[CP-E2E-001] OK — Beat subido y visible con título y precio.');
  return { title };
}

async function cpE2E_002(page, clientEmail, beatTitle) {
  console.log('[CP-E2E-002] Registro/Login cliente y búsqueda/reproducción ->', beatTitle);
  // Registrar cliente
  await page.request.post('http://localhost:3000/registro', {
    data: { email: clientEmail, password: 'client-pass', rol: 'cliente' }
  }).catch(() => {});

  // Login
  await page.goto('http://localhost:3000/login.html');
  await page.fill('#loginEmail', clientEmail);
  await page.fill('#loginPassword', 'client-pass');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'load' }),
    page.click('#loginForm button[type=submit]')
  ]);

  // Esperar feed y buscar
  await page.waitForSelector('#buscarBeatsCliente');
  await page.fill('#buscarBeatsCliente', beatTitle);
  // Esperar que el resultado aparezca
  await page.waitForSelector(`#beatsCliente .titulo-beat:has-text("${beatTitle}")`, { timeout: 5000 });

  // Abrir detalle
  await page.click(`#beatsCliente .titulo-beat:has-text("${beatTitle}")`);

  // En beat.html, esperar audio control
  await page.waitForSelector('audio[controls]', { timeout: 5000 });
  const src = await page.getAttribute('audio[controls]', 'src');
  if (!src) throw new Error('CP-E2E-002: No se encontró fuente de audio en la página de detalle');

  console.log('[CP-E2E-002] OK — Reproductor presente con src:', src);
}

// Ejecuta los casos, acumula resultados y escribe reportes (JSON + MD)
(async () => {
  const runId = `run-${Date.now()}`;
  const results = [];
  const browser = await chromium.launch();

  try {
    const producerEmail = uniqueEmail('prod');
    const clientEmail = uniqueEmail('client');

    // Ejecutar caso CP-E2E-001
    const context1 = await browser.newContext();
    const page = await context1.newPage();
    const start1 = Date.now();
    try {
      const cp1res = await cpE2E_001(page, producerEmail);
      const duration = Date.now() - start1;
      results.push({ id: 'CP-E2E-001', title: 'Productor sube un beat', status: 'PASS', duration_ms: duration, details: cp1res });
    } catch (err) {
      const duration = Date.now() - start1;
      results.push({ id: 'CP-E2E-001', title: 'Productor sube un beat', status: 'FAIL', duration_ms: duration, error: err && err.message });
    }

    // Ejecutar caso CP-E2E-002
    const context2 = await browser.newContext();
    const clientPage = await context2.newPage();
    const start2 = Date.now();
    try {
      const created = results.find(r => r.id === 'CP-E2E-001' && r.status === 'PASS');
      const beatTitle = created?.details?.title || `E2E Test Beat ${Date.now()}`;
      await cpE2E_002(clientPage, clientEmail, beatTitle);
      const duration = Date.now() - start2;
      results.push({ id: 'CP-E2E-002', title: 'Cliente busca y reproduce demo', status: 'PASS', duration_ms: duration });
    } catch (err) {
      const duration = Date.now() - start2;
      results.push({ id: 'CP-E2E-002', title: 'Cliente busca y reproduce demo', status: 'FAIL', duration_ms: duration, error: err && err.message });
    }

    await browser.close();

    // Generar reportes por test individual
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportsDir = path.join(__dirname, '..', 'reports', 'e2e');
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

    const typeTag = 'E2E-BLACKBOX';
    // Para cada resultado, generar JSON + MD con el formato: "NOMBRE DEL TEST - REPORTE - FECHA"
    results.forEach(r => {
      const safeName = `${r.id} - REPORTE - ${timestamp}`;
      const jsonPath = path.join(reportsDir, `${safeName}.json`);
      const mdPath = path.join(reportsDir, `${safeName}.md`);

      const reportObj = {
        runId,
        type: typeTag,
        timestamp: new Date().toISOString(),
        host: os.hostname(),
        result: r
      };
      fs.writeFileSync(jsonPath, JSON.stringify(reportObj, null, 2));

      let md = `# ${r.id} - REPORTE - ${timestamp}\n\n`;
      md += `- Test: **${r.id} - ${r.title}**\n`;
      md += `- Estado: **${r.status}**\n`;
      md += `- Duración: ${r.duration_ms} ms\n`;
      if (r.details && r.details.title) md += `- Beat Title: ${r.details.title}\n`;
      if (r.error) md += `- Error: ${r.error}\n`;
      md += `\n> JSON completo: ${path.basename(jsonPath)}\n`;

      fs.writeFileSync(mdPath, md);
      console.log('Generado reporte:', mdPath);
    });

    // Actualizar índice global de reports/e2e/README.md
    const indexPath = path.join(reportsDir, 'README.md');
    const indexLine = `- ${new Date().toISOString()} - ${typeTag} - ${results.length} tests - carpeta: e2e\n`;
    fs.appendFileSync(indexPath, indexLine);

    // Salida: mostrar resumen en consola
    console.log('Resumen:');
    results.forEach(r => console.log(` - ${r.id}: ${r.status} (${r.duration_ms} ms)`));

    const failCount = results.filter(r => r.status !== 'PASS').length;
    process.exit(failCount === 0 ? 0 : 1);
  } catch (err) {
    console.error('Error general durante ejecución E2E:', err);
    await browser.close();
    process.exit(1);
  }
})();
