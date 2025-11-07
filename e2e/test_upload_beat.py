import os
import time
import conftest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def test_cp_e2e_001_upload_beat(driver, target_url):
    id = "CP-E2E-001"
    title = "Flujo completo: Productor sube un beat"
    description = "Subir beat (audio + portada) y verificar aparición en catálogo."
    expected = "El beat recién subido aparece en el catálogo con título, portada y precio correctos."
    steps = []
    passed = False
    notes = None
    observed = ""

    wait = WebDriverWait(driver, 15)
    try:
        steps.append(f"Ir a {target_url}")
        driver.get(target_url)

        steps.append("Ir a la página de Login")
        btn_login = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "a[href*='login'], button#btn-login")))
        btn_login.click()

        steps.append("Ingresar credenciales de productor y hacer submit")
        input_email = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "input[name='email']")))
        input_pass = driver.find_element(By.CSS_SELECTOR, "input[name='password']")
        input_email.clear(); input_email.send_keys(os.environ.get("E2E_PRODUCER_EMAIL", "productor@test.local"))
        input_pass.clear(); input_pass.send_keys(os.environ.get("E2E_PRODUCER_PASS", "password"))
        btn_submit = driver.find_element(By.CSS_SELECTOR, "button[type='submit'], button#login-submit")
        btn_submit.click()

        steps.append("Navegar a la sección 'Subir Beat'")
        link_subir = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "a[href*='subir'], button#btn-subir")))
        link_subir.click()

        steps.append("Completar formulario (título, género)")
        input_title = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "input[name='title']")))
        select_genre = driver.find_element(By.CSS_SELECTOR, "select[name='genre']")
        input_title.send_keys("E2E Test Beat")
        select_genre.click()
        opt = select_genre.find_elements(By.TAG_NAME, "option")[1]
        opt.click()

        steps.append("Adjuntar archivo de audio y portada")
        audio_path = os.environ.get("E2E_BEAT_FILE", os.path.join(os.getcwd(), "e2e", "fixtures", "beat.mp3"))
        cover_path = os.environ.get("E2E_COVER_FILE", os.path.join(os.getcwd(), "e2e", "fixtures", "cover.jpg"))
        input_audio = driver.find_element(By.CSS_SELECTOR, "input[type='file'][name='beat'], input[type='file']#beat-file")
        input_cover = driver.find_element(By.CSS_SELECTOR, "input[type='file'][name='cover'], input[type='file']#cover-file")
        input_audio.send_keys(audio_path)
        input_cover.send_keys(cover_path)

        steps.append("Enviar formulario de subida")
        btn_send = driver.find_element(By.CSS_SELECTOR, "button[type='submit'], button#submit-beat")
        btn_send.click()

        steps.append("Ir a Catálogo / Mis Beats y buscar el beat subido")
        link_catalog = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "a[href*='catalogo'], a[href*='mis-beats']")))
        link_catalog.click()

        steps.append("Verificar presencia del título en el catálogo")
        item = wait.until(EC.visibility_of_element_located((By.XPATH, "//*[contains(text(),'E2E Test Beat')]")))
        observed = f"Elemento encontrado: {item.text}"
        passed = True
    except Exception as e:
        passed = False
        notes = str(e)
        observed = f"Error: {notes}"
    finally:
        conftest.run_results.append({
            "id": id,
            "title": title,
            "description": description,
            "expected": expected,
            "steps": steps,
            "observed": observed,
            "passed": passed,
            "notes": notes
        })
        if not passed:
            try:
                ts = int(time.time())
                ss = os.path.join(os.getcwd(), "INFORMES_PRUEBAS", "E2E", f"{id}_{ts}.png")
                driver.save_screenshot(ss)
            except Exception:
                pass
        assert passed, f"{id} falló: {notes}"