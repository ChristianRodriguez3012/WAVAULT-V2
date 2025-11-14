const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('Navegando a /login.html');
    await page.goto('http://localhost:3000/login.html', { waitUntil: 'load' });

    const form = await page.$('form');
    if (!form) {
      console.error('ERROR: no se encontró el formulario de login en /login.html');
      await browser.close();
      process.exit(2);
    }
    console.log('Formulario de login detectado');

    const resp = await context.request.get('http://localhost:3000/beats');
    console.log('/beats status:', resp.status());
    if (resp.status() !== 200) {
      console.error('ERROR: /beats respondió', resp.status());
      await browser.close();
      process.exit(3);
    }

    await browser.close();
    console.log('E2E local: OK');
    process.exit(0);
  } catch (err) {
    console.error('E2E local: Error', err);
    process.exit(1);
  }
})();
