#!/usr/bin/env python3
"""
metadata_enrichment.py
Sistema de enriquecimiento de metadatos para beats usando Tunebat + Gemini AI Search.
Flujo: Parsing archivo → Scraping Tunebat → Gemini AI Search → Metadatos finales
"""

import json
import re
import sys
import os
from typing import Dict, List, Tuple
import requests
from bs4 import BeautifulSoup
import google.generativeai as genai
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

# ============================================================
# CONFIGURACIÓN
# ============================================================

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "empty")

def configure_gemini():
    """Configura el cliente de Gemini"""
    if GEMINI_API_KEY and GEMINI_API_KEY != "empty":
        genai.configure(api_key=GEMINI_API_KEY)
        return True
    return False

# ============================================================
# PASO 1: PARSER DE NOMBRE DE ARCHIVO
# ============================================================

def parse_filename(filename: str) -> Dict:
    """
    Extrae metadatos del nombre del archivo.
    Formatos soportados:
    - "Artista - Titulo - 120BPM - C Mayor.mp3"
    - "Artista_Titulo_120BPM_Cm.mp3"
    - "120BPM_C#m_Artista_Titulo.mp3"
    
    Args:
        filename: Nombre del archivo de audio
    
    Returns:
        Dict con: artist, title, bpm, key, genre_hint
    """
    
    # Remover extensión
    name = filename.replace(".mp3", "").replace(".wav", "").replace(".flac", "").strip()
    
    result = {
        "artist": None,
        "title": None,
        "bpm": None,
        "key": None,
        "genre_hint": None,
        "mood_hint": None
    }
    
    # Extraer BPM: buscar patrón "120BPM" o "120 BPM"
    bpm_match = re.search(r'(\d{2,3})\s*BPM', name, re.IGNORECASE)
    if bpm_match:
        result["bpm"] = int(bpm_match.group(1))
        print(f"📍 BPM detectado en filename: {result['bpm']}", file=sys.stderr)
    
    # Extraer Key: buscar patrones como "C Mayor", "Cm", "C#m", "Dbm", "G minor", etc.
    key_patterns = [
        r'([A-G](?:[#b])?)\s*(?:Mayor|Major|Maj)',  # C Mayor, D# Major
        r'([A-G](?:[#b])?)\s*(?:Menor|Minor|Min)',  # C Menor, D# Minor
        r'([A-G](?:[#b])?)(m|M)(?:\s|$|-)',         # Cm, C#m, Dbm
    ]
    
    for pattern in key_patterns:
        key_match = re.search(pattern, name, re.IGNORECASE)
        if key_match:
            note = key_match.group(1).upper()
            mode = key_match.group(2) if len(key_match.groups()) > 1 else ""
            
            # Normalizar enarmónicos
            enharmonics = {
                "C#": "Db", "D#": "Eb", "E#": "F", "F#": "Gb",
                "G#": "Ab", "A#": "Bb", "B#": "C"
            }
            if note in enharmonics:
                note = enharmonics[note]
            
            # Determinar modo
            if mode and mode.lower() in ['m']:
                result["key"] = f"{note} Minor"
            else:
                result["key"] = f"{note} Major"
            
            print(f"📍 Key detectada en filename: {result['key']}", file=sys.stderr)
            break
    
    # Extraer Artista y Título: buscar separadores comunes
    # Intentar formatos: "Artista - Titulo" o "Artista_Titulo"
    separators = [' - ', '--', '_']  # Cambiar orden: guión primero, luego underscore
    for sep in separators:
        if sep in name:
            parts = name.split(sep)
            if len(parts) >= 2:
                # Limpiar y remover metadatos ya extraídos
                candidate_artist = parts[0].strip()
                # Para underscore, tomar primeros 2 partes como artist_title
                if sep == '_' and len(parts) >= 3:
                    candidate_artist = parts[0].replace('_', ' ').strip()
                    candidate_title = parts[1].replace('_', ' ').strip()
                else:
                    candidate_title = parts[1].strip()
                
                # Remover BPM y Key si están aún en el nombre
                candidate_artist = re.sub(r'\d{2,3}\s*BPM', '', candidate_artist, flags=re.IGNORECASE).strip()
                candidate_title = re.sub(r'\d{2,3}\s*BPM', '', candidate_title, flags=re.IGNORECASE).strip()
                candidate_artist = re.sub(r'[A-G](?:[#b])?\s*(?:Mayor|Minor|Maj|Min|m)', '', candidate_artist, re.IGNORECASE).strip()
                candidate_title = re.sub(r'[A-G](?:[#b])?\s*(?:Mayor|Minor|Maj|Min|m)', '', candidate_title, re.IGNORECASE).strip()
                
                if candidate_artist and len(candidate_artist) > 1:
                    result["artist"] = candidate_artist
                if candidate_title and len(candidate_title) > 1:
                    result["title"] = candidate_title
                
                if result["artist"]:
                    print(f"📍 Artista: {result['artist']}", file=sys.stderr)
                if result["title"]:
                    print(f"📍 Título: {result['title']}", file=sys.stderr)
                break
    
    # Si no se encontró artista/título con separadores, usar el nombre completo como título
    if not result["title"]:
        clean_name = name
        clean_name = re.sub(r'\d{2,3}\s*BPM', '', clean_name, flags=re.IGNORECASE).strip()
        clean_name = re.sub(r'[A-G](?:[#b])?\s*(?:Mayor|Minor|Maj|Min|m)', '', clean_name, re.IGNORECASE).strip()
        if clean_name:
            result["title"] = clean_name
    
    return result

# ============================================================
# PASO 2: SCRAPING DE TUNEBAT (sin Selenium, con requests + BS4)
# ============================================================

def scrape_tunebat(artist: str, title: str) -> List[Dict]:
    """
    Realiza scraping en Tunebat usando Selenium en modo headless.
    Evita bloqueos de anti-bot.
    
    Args:
        artist: Nombre del artista
        title: Nombre de la canción
    
    Returns:
        Lista de dicts con: title, artist, bpm, key, url
    """
    
    try:
        search_query = f"{artist} {title}".strip()
        search_url = f"https://tunebat.com/Search?q={requests.utils.quote(search_query)}"
        
        print(f"🔍 Buscando en Tunebat (Selenium): {search_query}", file=sys.stderr)
        
        # Configurar Chrome en modo headless
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        
        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
        results = []
        
        try:
            driver.get(search_url)
            # Esperar a que cargue la tabla de resultados (máx 10 segundos)
            wait = WebDriverWait(driver, 10)
            wait.until(EC.presence_of_all_elements_located((By.TAG_NAME, "tr")))
            
            soup = BeautifulSoup(driver.page_source, 'html.parser')
            rows = soup.find_all('tr')
            
            for row in rows[:3]:  # Primeros 3 resultados
                try:
                    cells = row.find_all('td')
                    if len(cells) < 2:
                        continue
                    
                    # Extraer datos
                    row_text = row.get_text(strip=True)
                    
                    # Buscar BPM: patrón "120 BPM" o "120BPM"
                    bpm_match = re.search(r'(\d{2,3})\s*BPM', row_text)
                    # Buscar Key: "C Major", "Am", "G# minor", etc.
                    key_match = re.search(r'([A-G](?:[#b])?)\s*(?:major|major|maj|m|minor|min)', row_text, re.IGNORECASE)
                    
                    # Título generalmente en el primer link
                    title_elem = row.find('a')
                    song_title = title_elem.get_text(strip=True) if title_elem else cells[0].get_text(strip=True)
                    
                    # Artista generalmente en segunda celda
                    artist_text = cells[1].get_text(strip=True) if len(cells) > 1 else ""
                    
                    if song_title:
                        result_item = {
                            "title": song_title,
                            "artist": artist_text,
                            "bpm": int(bpm_match.group(1)) if bpm_match else None,
                            "key": key_match.group(0) if key_match else None,
                            "url": search_url,
                            "source": "tunebat_selenium"
                        }
                        results.append(result_item)
                        print(f"   ✅ Resultado: {song_title} - BPM: {result_item['bpm']}, Key: {result_item['key']}", file=sys.stderr)
                
                except Exception as e:
                    print(f"   ⚠️  Error parseando fila: {e}", file=sys.stderr)
                    continue
        
        finally:
            driver.quit()
        
        if results:
            print(f"✅ Tunebat: {len(results)} resultado(s) encontrado(s)", file=sys.stderr)
        else:
            print(f"⚠️  Tunebat: No se encontraron resultados", file=sys.stderr)
        
        return results
    
    except Exception as e:
        print(f"❌ Error scrapeando Tunebat: {e}", file=sys.stderr)
        return []

# ============================================================
# PASO 3: ENRIQUECIMIENTO CON GEMINI AI SEARCH
# ============================================================

def enrich_with_gemini(internal_data: Dict, tunebat_data: List[Dict]) -> Dict:
    """
    Usa Gemini con búsqueda en Google para enriquecer y validar metadatos.
    
    Args:
        internal_data: Dict con datos del filename
        tunebat_data: Lista de resultados de Tunebat
    
    Returns:
        Dict con: bpm_final, tonalidad_final, tags[]
    """
    
    if not configure_gemini():
        print(f"⚠️  API Key no configurada, usando valores por defecto", file=sys.stderr)
        return {
            "bpm_final": internal_data.get("bpm"),
            "tonalidad_final": internal_data.get("key"),
            "tags": ["AI-Analysis-Failed", "Fallback-Mode"],
            "source": "internal_only"
        }
    
    try:
        # Preparar contexto para Gemini
        tunebat_summary = ""
        if tunebat_data:
            tunebat_summary = "Datos de Tunebat:\n"
            for i, item in enumerate(tunebat_data[:3], 1):
                tunebat_summary += f"{i}. {item.get('title', 'N/A')} - BPM: {item.get('bpm', 'N/A')}, Key: {item.get('key', 'N/A')}\n"
        
        prompt = f"""Eres un experto en análisis musical y metadatos de beats. 
        
He recopilado estos datos sobre un beat musical:

DATOS INTERNOS (del nombre del archivo):
- Artista: {internal_data.get('artist', 'N/A')}
- Título: {internal_data.get('title', 'N/A')}
- BPM (interno): {internal_data.get('bpm', 'N/A')}
- Tonalidad (interno): {internal_data.get('key', 'N/A')}

{tunebat_summary}

TAREA:
1. Compara los datos internos con los de Tunebat
2. Valida cuál BPM es más probable (considera variaciones de ±5 BPM)
3. Valida la tonalidad (considera enarmónicos: C#=Db, etc.)
4. Genera 10-15 tags relevantes para este beat (mood, género, instrumentos, energía, etc.)

RESPUESTA (SOLO JSON, sin explicaciones):
{{
    "bpm_final": <número o null>,
    "bpm_confidence": <0-100>,
    "bpm_source": "<internal|tunebat|estimated>",
    "tonalidad_final": "<Nota Modo>",
    "tonalidad_confidence": <0-100>,
    "tonalidad_source": "<internal|tunebat|estimated>",
    "tags": ["tag1", "tag2", ..., "tag10-15"],
    "reasoning": "<explicación breve>"
}}
"""
        
        print(f"🤖 Consultando Gemini con búsqueda en Google...", file=sys.stderr)
        
        # Usar Gemini 2.0 Flash con búsqueda web
        model = genai.GenerativeModel(
            'gemini-2.0-flash',
            tools=[genai.protos.Tool(google_search_retrieval=genai.protos.GoogleSearchRetrieval())]
        )
        
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Parsear JSON de la respuesta
        if '```json' in response_text:
            response_text = response_text.split('```json')[1].split('```')[0].strip()
        elif '```' in response_text:
            response_text = response_text.split('```')[1].split('```')[0].strip()
        
        result = json.loads(response_text)
        
        print(f"✅ Gemini enriquecimiento completado", file=sys.stderr)
        return result
    
    except Exception as e:
        print(f"❌ Error en Gemini: {e}", file=sys.stderr)
        return {
            "bpm_final": internal_data.get("bpm"),
            "tonalidad_final": internal_data.get("key"),
            "tags": ["Fallback-Mode"],
            "source": "error_fallback"
        }

# ============================================================
# FUNCIÓN PRINCIPAL: ENRIQUECIMIENTO COMPLETO
# ============================================================

def enrich_beat_metadata(filename: str) -> Dict:
    """
    Pipeline completo de enriquecimiento de metadatos.
    
    Args:
        filename: Nombre del archivo de audio
    
    Returns:
        Dict estructurado con metadatos enriquecidos
    """
    
    print(f"\n{'='*60}", file=sys.stderr)
    print(f"🎵 ENRIQUECIMIENTO DE METADATOS: {filename}", file=sys.stderr)
    print(f"{'='*60}\n", file=sys.stderr)
    
    # PASO 1: Parse del filename
    print(f"📍 PASO 1: Parseando nombre del archivo...", file=sys.stderr)
    internal_data = parse_filename(filename)
    
    # PASO 2: Scraping de Tunebat
    print(f"\n📍 PASO 2: Scrapeando Tunebat...", file=sys.stderr)
    tunebat_data = []
    if internal_data.get("artist") or internal_data.get("title"):
        tunebat_data = scrape_tunebat(
            internal_data.get("artist", ""),
            internal_data.get("title", "")
        )
    
    # PASO 3: Enriquecimiento con Gemini
    print(f"\n📍 PASO 3: Enriquecimiento con Gemini AI Search...", file=sys.stderr)
    enriched = enrich_with_gemini(internal_data, tunebat_data)
    
    # Construir respuesta final
    final_result = {
        "status": "success",
        "filename": filename,
        "internal_data": internal_data,
        "tunebat_data": tunebat_data,
        "enriched_metadata": enriched,
        "final_metadata": {
            "bpm": enriched.get("bpm_final", internal_data.get("bpm")),
            "key": enriched.get("tonalidad_final", internal_data.get("key")),
            "tags": enriched.get("tags", []),
            "artist": internal_data.get("artist"),
            "title": internal_data.get("title")
        }
    }
    
    print(f"\n{'='*60}", file=sys.stderr)
    print(f"✅ ENRIQUECIMIENTO COMPLETADO", file=sys.stderr)
    print(f"{'='*60}\n", file=sys.stderr)
    
    return final_result

# ============================================================
# PUNTO DE ENTRADA
# ============================================================

if __name__ == "__main__":
    import os
    
    if len(sys.argv) < 2:
        print("Uso: python3 metadata_enrichment.py <nombre_archivo>", file=sys.stderr)
        print("Ejemplo: python3 metadata_enrichment.py 'Bad Bunny - Tití Me Preguntó - 95BPM - Am.mp3'", file=sys.stderr)
        sys.exit(1)
    
    filename = sys.argv[1]
    
    try:
        result = enrich_beat_metadata(filename)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    except Exception as e:
        error_response = {
            "status": "error",
            "message": str(e)
        }
        print(json.dumps(error_response, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)
