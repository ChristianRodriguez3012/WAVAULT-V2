import os
import time
import conftest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Instalar Chromium y configurar variable de entorno
os.system("sudo apt update")
os.system("sudo apt install -y chromium-browser chromium-chromedriver")
os.environ["CHROME_BIN"] = "/usr/bin/chromium-browser"

def test_cp_e2e_002_search_and_play_demo(driver, target_url):
    id = "CP-E2E-002"
    title = "Flujo completo
    description = "Buscar un beat y reproducir su demo; verificar reproducción (player inicia)."
    expected = "El reproductor de audio inicia y se escucha el demo (tag presente)."recio correctos."
    steps = []
    passed = False
    notes = None
    observed = ""

    wait = WebDriverWait(driver, 15)
    try:
        steps.append(f"Ir a {target_url}")get_url}")
        driver.get(target_url)

        steps.append("Usar barra de búsqueda y buscar 'E2E Test Beat'") Login")        # (Opcional) Login como cliente
        input_search = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "input[name='q'], input#search")))ckable((By.CSS_SELECTOR, "a[href*='login'], button#btn-login")))nte")
        input_search.clear(); input_search.send_keys("E2E Test Beat")
        input_search.submit()
ubmit")
        steps.append("Clic en resultado de búsqueda")SS_SELECTOR, "input[name='email']")))r barra de búsqueda y buscar 'E2E Test Beat'")
        result = wait.until(EC.element_to_be_clickable((By.XPATH, "//*[contains(text(),'E2E Test Beat')]/ancestor::a"))).visibility_of_element_located((By.CSS_SELECTOR, "input[name='q'], input#search")))
        result.click()E_PRODUCER_EMAIL", "productor@test.local"))
nput_pass.send_keys(os.environ.get("E2E_PRODUCER_PASS", "password"))
        steps.append("Clic en botón 'Reproducir Demo' y verificar que el player inicie")        btn_submit = driver.find_element(By.CSS_SELECTOR, "button[type='submit'], button#login-submit")
        btn_play = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button.play-demo, button#play-demo")))
        btn_play.click()

        audio_elem = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "audio")))ait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "a[href*='subir'], button#btn-subir")))
        time.sleep(1)        link_subir.click()
        current_time = driver.execute_script("return arguments[0].currentTime", audio_elem)
        paused = driver.execute_script("return arguments[0].paused", audio_elem) y verificar que el player inicie")
        observed = f"audio.currentTime={current_time}, paused={paused}"  btn_play = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button.play-demo, button#play-demo")))
        passed = (current_time is not None and float(current_time) > 0) or (paused is False)river.find_element(By.CSS_SELECTOR, "select[name='genre']")
    except Exception as e:        input_title.send_keys("E2E Test Beat")
        passed = False
        notes = str(e)on")[1]
        observed = f"Error: {notes}"
    finally:
        conftest.run_results.append({"Adjuntar archivo de audio y portada")
            "id": id,d(), "e2e", "fixtures", "beat.mp3"))used == false
            "title": title,tures", "cover.jpg"))
            "description": description,ame='beat'], input[type='file']#beat-file")
            "expected": expected,'file'][name='cover'], input[type='file']#cover-file")t_time}, paused={paused}"
            "steps": steps,sed is False)
            "observed": observed,eys(cover_path)
            "passed": passed,
            "notes": notesEnviar formulario de subida")(e)
        })nt(By.CSS_SELECTOR, "button[type='submit'], button#submit-beat")        observed = f"Error: {notes}"
        if not passed:send.click()
            try:
                ts = int(time.time())"Ir a Catálogo / Mis Beats y buscar el beat subido")
                ss = os.path.join(os.getcwd(), "INFORMES_PRUEBAS", "E2E", f"{id}_{ts}.png").until(EC.element_to_be_clickable((By.CSS_SELECTOR, "a[href*='catalogo'], a[href*='mis-beats']")))
        link_catalog.click()hot(ss)

        steps.append("Verificar presencia del título en el catálogo")
        item = wait.until(EC.visibility_of_element_located((By.XPATH, "//*[contains(text(),'E2E Test Beat')]")))es}"        observed = f"Elemento encontrado: {item.text}"        passed = True    except Exception as e:        passed = False        notes = str(e)        observed = f"Error: {notes}"    finally:        conftest.run_results.append({            "id": id,            "title": title,            "description": description,            "expected": expected,            "steps": steps,            "observed": observed,            "passed": passed,            "notes": notes        })        if not passed:            try:                ts = int(time.time())                ss = os.path.join(os.getcwd(), "INFORMES_PRUEBAS", "E2E", f"{id}_{ts}.png")                driver.save_screenshot(ss)            except Exception:                pass        assert passed, f"{id} falló: {notes}"
cd /workspaces/WAVAULT-V2/e2e
source .venv/bin/activate
