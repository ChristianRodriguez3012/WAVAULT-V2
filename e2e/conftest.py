import os
import json
from datetime import datetime
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager
from shutil import which

# Informe en repo raíz: /workspaces/WAVAULT-V2/INFORMES_PRUEBAS/E2E/HISTORIAL
REPORT_DIR = os.path.abspath(os.path.join(os.getcwd(), "..", "INFORMES_PRUEBAS", "E2E", "HISTORIAL"))
os.makedirs(REPORT_DIR, exist_ok=True)

# Lista compartida para acumular resultados
run_results = []

@pytest.fixture(scope="session")
def target_url():
    return os.environ.get("TEST_TARGET", "http://localhost:3000")

@pytest.fixture(scope="session")
def driver():
    from selenium.webdriver.chrome.options import Options
    options = Options()

    headless = os.environ.get("HEADLESS", "1")
    if headless and headless != "0":
        options.add_argument("--headless=new")

    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1920,1080")

    # Detectar binario Chrome/Chromium
    chrome_bin = os.environ.get("CHROME_BIN")
    candidates = [
        chrome_bin,
        "/usr/bin/google-chrome-stable",
        "/usr/bin/google-chrome",
        "/usr/bin/chromium-browser",
        "/usr/bin/chromium",
        which("chrome"),
        which("chromium"),
    ]
    for c in candidates:
        if c and os.path.exists(str(c)):
            options.binary_location = str(c)
            break

    if not getattr(options, "binary_location", None):
        raise RuntimeError("Chrome/Chromium binary not found. Instala chromium o exporta CHROME_BIN apuntando al binario.")

    service = ChromeService(ChromeDriverManager().install())
    drv = webdriver.Chrome(service=service, options=options)
    drv.maximize_window()
    yield drv
    drv.quit()

def pytest_sessionfinish(session, exitstatus):
    now = datetime.utcnow().isoformat(timespec='seconds').replace(":", "-")
    filename = f"{now}.md"
    filepath = os.path.join(REPORT_DIR, filename)

    md = f"# Informe E2E - Ejecución {datetime.utcnow().isoformat()}\n\n"
    md += "## Resumen\n\n"
    for r in run_results:
        md += f"- {r.get('id','?')} {r.get('title','')}: **{'PASÓ' if r.get('passed') else 'FALLÓ'}**\n"
    md += "\n---\n\n"

    for r in run_results:
        md += f"## {r.get('id','?')} - {r.get('title','')}\n\n"
        md += f"Descripción: {r.get('description','')}\n\n"
        md += f"Resultado esperado: {r.get('expected','')}\n\n"
        md += "### Pasos ejecutados\n"
        for i, s in enumerate(r.get('steps', []), 1):
            md += f"{i}. {s}\n"
        md += f"\n### Resultado observado\n{r.get('observed','')}\n\n"
        if r.get('notes'):
            md += f"Notas: {r.get('notes')}\n\n"
        md += "\n---\n\n"

    md += "### Detalles JSON\n\n"
    md += "```json\n" + json.dumps(run_results, indent=2, ensure_ascii=False) + "\n```\n"

    try:
        with open(filepath, "w", encoding="utf8") as f:
            f.write(md)
    except Exception as e:
        print("Error escribiendo informe E2E:", e)