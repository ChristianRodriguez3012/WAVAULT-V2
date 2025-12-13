#!/usr/bin/env python3
"""
analyze_beat_ai.py
Analiza características técnicas de audio e infiere Mood y Tags usando Gemini AI.
Incluye: BPM, Key, LUFS, Acordes, Análisis Espectral, MFCC.
Invocación: python3 analyze_beat_ai.py <ruta_archivo_audio> <nombre_archivo>

SISTEMA MEJORADO:
- Integración con parse_filename_improved.py
- Sistema de confianza (100/70/50)
- Validación de escalas por IA
- Tags inteligentes (1-3 palabras)
"""

import sys
import json
import os
import re
import numpy as np
import librosa
import librosa.display
from scipy.signal import find_peaks
import google.generativeai as genai
from urllib.parse import urlencode, quote
import urllib.request
from html.parser import HTMLParser
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()

# Importar el nuevo parser
try:
    from parse_filename_improved import parse_filename
    PARSER_AVAILABLE = True
except ImportError:
    print("⚠️  parse_filename_improved no disponible, usando fallback", file=sys.stderr)
    PARSER_AVAILABLE = False

# 🔑 SISTEMA MULTI-API KEY CON FALLBACK AUTOMÁTICO (dinámico)
# Fuentes soportadas:
# 1) `GEMINI_API_KEYS` (CSV): "KEY_A,KEY_B,KEY_C"
# 2) Variables numeradas: GEMINI_API_KEY, GEMINI_API_KEY_2..GEMINI_API_KEY_10

_csv_keys = os.environ.get('GEMINI_API_KEYS', '')
_list_from_csv = [k.strip() for k in _csv_keys.split(',') if k.strip()] if _csv_keys else []

_numbered_keys = []
base = os.environ.get('GEMINI_API_KEY', '')
if base:
    _numbered_keys.append(base)
for i in range(2, 11):  # Soporta hasta 10 keys numeradas
    k = os.environ.get(f'GEMINI_API_KEY_{i}', '')
    if k:
        _numbered_keys.append(k)

# Unir, filtrar vacíos, placeholders y duplicados preservando orden
_all_keys = _list_from_csv + _numbered_keys
seen = set()
ACTIVE_API_KEYS = []
for key in _all_keys:
    if not key or key in ('tu_api_key_aqui', 'empty'):
        continue
    if key in seen:
        continue
    seen.add(key)
    ACTIVE_API_KEYS.append(key)

# Soporte de emergencia con Groq (Llama 3)
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant").strip()
USE_GROQ_PRIMARY = os.getenv("USE_GROQ_PRIMARY", "1") == "1" and bool(GROQ_API_KEY)

# Índice de la key actual (se rota en caso de error)
CURRENT_KEY_INDEX = 0

# Configuración legacy (para compatibilidad con código existente)
GEMINI_API_KEY = ACTIVE_API_KEYS[0] if ACTIVE_API_KEYS else 'tu_api_key_aqui'

print(f"🔑 Sistema Multi-API Key inicializado: {len(ACTIVE_API_KEYS)} key(s) activa(s)", file=sys.stderr)
if len(ACTIVE_API_KEYS) > 1:
    print(f"   └─ Fallback automático habilitado (rotación secuencial)", file=sys.stderr)

# 💾 CACHÉ SIMPLE DE ARTISTAS (para reducir requests a Gemini)
# Estructura: {"artist_name": {"genre": "...", "subgenres": [...], "style": "...", "tags_example": [...]}}
# ⚠️ CACHÉ DESACTIVADO - Cada consulta usa conocimiento fresco de Groq
# No guardamos respuestas previas para evitar propagación de errores

# 🏥 HEALTH CHECK CACHE: Registra qué keys están funcionales
# Estructura: {"key_index": {"status": "ok"/"bad", "last_check": timestamp, "error_count": int}}
import time
API_KEY_HEALTH = {}

def check_api_key_health(api_key, key_index):
    """
    Verifica si una API key está funcional con un prompt mínimo (health check).
    Usa caché para evitar verificar constantemente keys que ya sabemos están mal.
    
    Args:
        api_key: La API key a verificar
        key_index: Índice de la key (para logging)
    
    Returns:
        (is_healthy: bool, error_msg: str)
    """
    # Verificar si ya tenemos info reciente de esta key
    now = time.time()
    if key_index in API_KEY_HEALTH:
        cache_entry = API_KEY_HEALTH[key_index]
        time_since_check = now - cache_entry['last_check']
        
        # Si la key estaba OK y la verificamos hace menos de 5 minutos → asumir que sigue OK
        if cache_entry['status'] == 'ok' and time_since_check < 300:
            return True, None
        
        # Si la key estaba MAL y la verificamos hace menos de 1 minuto → skip (evitar spam)
        if cache_entry['status'] == 'bad' and time_since_check < 60:
            return False, cache_entry.get('error_msg', 'Key fallida recientemente')
    
    # Health check real: prompt ultra-mínimo (solo 10 tokens)
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash-lite')
        response = model.generate_content("Say OK")  # 10 tokens aprox
        
        # Si llegamos aquí, la key funciona
        API_KEY_HEALTH[key_index] = {
            'status': 'ok',
            'last_check': now,
            'error_count': 0,
            'error_msg': None
        }
        return True, None
        
    except Exception as e:
        error_str = str(e)
        error_count = API_KEY_HEALTH.get(key_index, {}).get('error_count', 0) + 1
        
        API_KEY_HEALTH[key_index] = {
            'status': 'bad',
            'last_check': now,
            'error_count': error_count,
            'error_msg': error_str[:100]
        }
        
        return False, error_str


def get_next_api_key():
    """
    Obtiene la siguiente API key disponible (rotación automática).
    Retorna: (api_key, key_index) o (None, -1) si no hay más keys
    """
    global CURRENT_KEY_INDEX
    
    if not ACTIVE_API_KEYS:
        return None, -1
    
    # Intentar con la siguiente key
    if CURRENT_KEY_INDEX < len(ACTIVE_API_KEYS):
        key = ACTIVE_API_KEYS[CURRENT_KEY_INDEX]
        index = CURRENT_KEY_INDEX
        CURRENT_KEY_INDEX += 1
        return key, index
    
    # Ya probamos todas las keys
    return None, -1


def reset_api_key_rotation():
    """Resetea el índice de rotación de API keys (para nuevo beat)"""
    global CURRENT_KEY_INDEX
    CURRENT_KEY_INDEX = 0


def call_gemini_with_fallback(prompt, model_name="gemini-2.0-flash-lite"):
    """
    Llama a Gemini con fallback automático entre múltiples API keys.
        INCLUYE HEALTH CHECK: Verifica que la key esté funcional ANTES de enviar el prompt.
    
    Args:
        prompt: Prompt a enviar
        model_name: Modelo de Gemini a usar
    
    Returns:
        response_text: Respuesta de Gemini
        
    Raises:
        Exception: Si todas las keys fallan
    """
    if not ACTIVE_API_KEYS:
        raise Exception("❌ No hay API keys configuradas")
    
    reset_api_key_rotation()
    last_error = None
    
    while True:
        api_key, key_index = get_next_api_key()
        
        if api_key is None:
            # Ya probamos todas las keys
            error_msg = f"❌ Todas las API keys fallaron ({len(ACTIVE_API_KEYS)} intentos)"
            if last_error:
                error_msg += f"\nÚltimo error: {str(last_error)}"
            raise Exception(error_msg)
        
        # 🏥 HEALTH CHECK: Verificar si la key está funcional ANTES de enviar el prompt
        print(f"🔍 Verificando API KEY #{key_index + 1}...", file=sys.stderr)
        is_healthy, error_msg = check_api_key_health(api_key, key_index)
        
        if not is_healthy:
            print(f"⚠️  API KEY #{key_index + 1} NO funcional (health check) - probando siguiente...", file=sys.stderr)
            print(f"   Razón: {error_msg[:100]}", file=sys.stderr)
            last_error = Exception(error_msg)
            continue  # Saltar esta key sin enviar el prompt
        
        print(f"✅ API KEY #{key_index + 1} pasa health check - enviando prompt...", file=sys.stderr)
        
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt)
            
            # Si llegamos aquí, funcionó
            print(f"✅ API KEY #{key_index + 1} funcionó correctamente", file=sys.stderr)
            reset_api_key_rotation()  # Resetear para próximo beat
            return response.text
            
        except Exception as e:
            error_str = str(e)
            last_error = e
            
            # Detectar tipo de error
            if "429" in error_str or "quota" in error_str.lower() or "limit" in error_str.lower():
                print(f"⚠️  API KEY #{key_index + 1} alcanzó límite (429) - probando siguiente...", file=sys.stderr)
            elif "403" in error_str or "invalid" in error_str.lower():
                print(f"⚠️  API KEY #{key_index + 1} inválida (403) - probando siguiente...", file=sys.stderr)
            else:
                print(f"⚠️  API KEY #{key_index + 1} falló: {error_str[:100]} - probando siguiente...", file=sys.stderr)
            
            # Actualizar health cache como "bad" para esta key
            API_KEY_HEALTH[key_index] = {
                'status': 'bad',
                'last_check': time.time(),
                'error_count': API_KEY_HEALTH.get(key_index, {}).get('error_count', 0) + 1,
                'error_msg': error_str[:100]
            }
            
            # Continuar con la siguiente key en el loop


# ==========================================
# LLAMADA A GROQ (LLAMA 3) - EMERGENCIA
# ==========================================
def call_groq_with_json(prompt, model_name=None):
    """Llama a Groq y fuerza salida JSON. Requiere GROQ_API_KEY."""
    if not GROQ_API_KEY:
        raise Exception("❌ GROQ_API_KEY no configurada")
    try:
        from groq import Groq
    except Exception as e:
        raise Exception(f"No se pudo importar groq: {e}")
    try:
        if not model_name:
            model_name = GROQ_MODEL
        client = Groq(api_key=GROQ_API_KEY)
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "Eres un experto en música. Analiza CADA consulta de forma INDEPENDIENTE usando tu conocimiento actual. NO uses información de consultas anteriores. Retorna SOLO JSON válido sin texto extra. Prioriza variedad y especificidad en tags."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model=model_name,
            response_format={"type": "json_object"},
            temperature=0.6,
            top_p=0.9
        )
        # Log de verificación Groq
        try:
            rid = getattr(chat_completion, 'id', None)
            usage = getattr(chat_completion, 'usage', None)
            used_model = getattr(chat_completion, 'model', model_name)
            if usage and hasattr(usage, 'prompt_tokens'):
                print(f"✅ Groq OK id={rid} model={used_model} usage(p={usage.prompt_tokens}, c={usage.completion_tokens}, t={usage.total_tokens})", file=sys.stderr)
            else:
                print(f"✅ Groq OK id={rid} model={used_model}", file=sys.stderr)
        except Exception:
            pass
        raw_json = chat_completion.choices[0].message.content
        time.sleep(0.2)
        return raw_json
    except Exception as e:
        raise Exception(f"Groq error: {e}")


def scrape_tunebat_song(artist, song_name):
    """
    Obtiene información de TuneBat usando Gemini con búsqueda web.
    (Web scraping directo está bloqueado, así que usamos Gemini)
    
    Args:
        artist: Nombre del artista
        song_name: Nombre de la canción
    
    Returns:
        Dict con: bpm, key, song_title, artist_name, url, confidence
        o {} si no encuentra o hay error
    """
    try:
        # Verificar si hay API keys disponibles
        if not ACTIVE_API_KEYS:
            print(f"⚠️  No hay API Keys disponibles - omitiendo búsqueda TuneBat", file=sys.stderr)
            return {}
        
        # Usar Gemini para buscar en TuneBat
        prompt = f"""Busca información en TuneBat para:
Canción: "{song_name}"
Artista: "{artist}"

Específicamente busca en: site:tunebat.com "{artist}" "{song_name}"

RETORNA SOLO JSON (sin explicación):
{{"bpm": número o null, "key": "notación_musical" o null, "song_title": "título", "source": "tunebat"}}

Ejemplo válido:
{{"bpm": 130, "key": "G major", "song_title": "goosebumps", "source": "tunebat"}}
"""
        
        # Llamar a Gemini con fallback automático
        response_text = call_gemini_with_fallback(
            prompt,
            model_name='gemini-2.0-flash'  # Nota: este modelo tiene Google Search
        )
        
        # Limpiar JSON
        if '```json' in response_text:
            response_text = response_text.split('```json')[1].split('```')[0].strip()
        elif '```' in response_text:
            response_text = response_text.split('```')[1].split('```')[0].strip()
        
        data = json.loads(response_text)
        
        if data.get("bpm") or data.get("key"):
            result = {
                "bpm": data.get("bpm"),
                "key": data.get("key"),
                "song_title": data.get("song_title", song_name),
                "artist_name": artist,
                "source": "tunebat_via_gemini",
                "confidence": 85
            }
            print(f"✅ TuneBat (vía Gemini): BPM={result['bpm']}, Key={result['key']}", file=sys.stderr)
            return result
        else:
            print(f"⚠️  TuneBat no encontró datos para: {artist} - {song_name}", file=sys.stderr)
            return {}
    
    except Exception as e:
        print(f"⚠️  Error buscando TuneBat: {e}", file=sys.stderr)
        return {}



def extract_filename_metadata(filename):
    """
    Extrae información del nombre del archivo con ALTA PRECISIÓN.
    Formato típico: "ARTIST - SONG TYPE BEAT - KEY BPM"
    Ejemplo: "Drake - God's Plan TYPE BEAT - C#m 140BPM"
    
    PRIORIDAD: El nombre del archivo es LA VERDAD para beats comerciales.
    Retorna dict con artist, song, type, key, bpm (si se encuentran)
    """
    try:
        # Remover extensión
        name = os.path.splitext(filename)[0]
        
        metadata = {
            "artist": None,
            "song": None,
            "type": None,
            "genre_hint": None,
            "mood_hint": None,
            "key_hint": None,
            "bpm_hint": None,
            "original_name": name
        }
        
        # ============================================
        # PATRÓN 1: TIPO DE BEAT (detectar primero para extraer mejor)
        # ============================================
        # Formatos: "TYPE BEAT", "Type Beat", "type beat"
        # También: "Trap Beat", "Drill Beat", "Reggaeton Beat", etc.
        type_patterns = [
            r'(TYPE\s+BEAT)',  # TYPE BEAT clásico
            r'(Trap|Drill|Reggaeton|Dembow|Dancehall|Afrobeat|UK\s*Drill|Boom\s*Bap|Lo-fi|Lofi)\s+(TYPE\s+)?BEAT',  # Género + Beat
        ]
        
        type_match = None
        for pattern in type_patterns:
            match = re.search(pattern, name, re.IGNORECASE)
            if match:
                type_match = match
                metadata["type"] = "TYPE BEAT"
                # Si detectamos un género específico, guardarlo
                genre_match = re.search(r'(Trap|Drill|Reggaeton|Dembow|Dancehall|Afrobeat|UK\s*Drill|Boom\s*Bap|Lo-fi|Lofi)', match.group(0), re.IGNORECASE)
                if genre_match:
                    metadata["genre_hint"] = genre_match.group(1).title()
                break
        
        # ============================================
        # PATRÓN 2: ESCALA (KEY) - MUY IMPORTANTE
        # ============================================
        # Formatos comunes:
        # - "C#m", "C# Minor", "C#min", "C# minor"
        # - "Am", "A Minor", "Amin", "A minor"
        # - "F", "Fmaj", "F Major"
        # - Soportar: A, A#, B, C, C#, D, D#, E, F, F#, G, G#
        # - Soportar: Db, Eb, Gb, Ab, Bb (enarmónicos)
        
        scale_patterns = [
            # Patrón 1: Nota + sostenido/bemol + tipo completo (C# Minor, Db Major)
            r'\b([A-Ga-g](?:[#b])?)\s*(major|minor|maj|min|m)\b',
            # Patrón 2: Nota + sostenido/bemol + m/M directo (C#m, Dbm, AM)
            r'\b([A-Ga-g](?:[#b])?)([mM])\b',
            # Patrón 3: Nota sola seguida de espacio y BPM (implica usar para determinar luego)
            r'\b([A-Ga-g](?:[#b])?)\s+(?=\d{2,3}(?:bpm|BPM))',
        ]
        
        key_found = False
        for pattern in scale_patterns:
            matches = list(re.finditer(pattern, name, re.IGNORECASE))
            if matches:
                # Tomar el ÚLTIMO match (usualmente está cerca del BPM, más confiable)
                last_match = matches[-1]
                note = last_match.group(1)
                
                # Normalizar nota (primera letra mayúscula, resto minúscula para #/b)
                note = note[0].upper() + note[1:].lower() if len(note) > 1 else note.upper()
                
                # Determinar tipo (Major/Minor)
                if len(last_match.groups()) > 1 and last_match.group(2):
                    type_str = last_match.group(2).lower()
                    if type_str in ['minor', 'min', 'm']:
                        scale_type = "Minor"
                    elif type_str in ['major', 'maj']:
                        scale_type = "Major"
                    else:
                        scale_type = None
                    
                    if scale_type:
                        metadata["key_hint"] = f"{note} {scale_type}"
                        key_found = True
                        break
                else:
                    # Solo nota, guardar para determinar Mayor/Menor después
                    metadata["key_hint"] = note
                    key_found = True
                    break
        
        # ============================================
        # PATRÓN 3: BPM - MUY IMPORTANTE
        # ============================================
        # Formatos: "140BPM", "140 BPM", "140bpm", "140 bpm"
        bpm_patterns = [
            r'(\d{2,3})\s*(?:bpm|BPM)',  # 140BPM, 140 BPM
            r'(?:bpm|BPM)\s*(\d{2,3})',  # BPM 140, bpm140
        ]
        
        for pattern in bpm_patterns:
            bpm_match = re.search(pattern, name, re.IGNORECASE)
            if bpm_match:
                bpm_value = int(bpm_match.group(1))
                # Validar que esté en rango razonable (60-200 BPM)
                if 60 <= bpm_value <= 200:
                    metadata["bpm_hint"] = bpm_value
                    break
        
        # ============================================
        # PATRÓN 4: ARTIST Y SONG (MEJORADO)
        # ============================================
        # Formato típico: "Artist - Song TYPE BEAT - Key BPM"
        # Variaciones:
        # - "Artist Type Beat"
        # - "Artist - Song (Type Beat)"
        # - "Song - Artist Type Beat"
        
        # Intentar extraer artista y canción
        # Soportar múltiples separadores: " - ", "_-_", " -", etc.
        separator_match = re.search(r'\s*[-_]+\s*', name)
        if separator_match:
            parts = re.split(r'\s*[-_]+\s*', name, maxsplit=1)
            
            # Caso 1: "Artist - Song TYPE BEAT - Key BPM"
            if len(parts) >= 2:
                # Primer parte es artista
                metadata["artist"] = parts[0].strip()
                
                # Segunda parte contiene song + posiblemente TYPE BEAT
                rest = parts[1].strip()
                
                # Extraer song (antes de TYPE BEAT o key/bpm)
                if type_match:
                    song_part = rest[:type_match.start()].strip()
                    if song_part:
                        metadata["song"] = song_part
                else:
                    # Si no hay TYPE BEAT, intentar extraer hasta key o bpm
                    # Buscar donde empieza la metadata técnica
                    tech_start = len(rest)
                    
                    # Buscar inicio de key
                    for pattern in scale_patterns:
                        match = re.search(pattern, rest)
                        if match:
                            tech_start = min(tech_start, match.start())
                    
                    # Buscar inicio de BPM
                    for pattern in bpm_patterns:
                        match = re.search(pattern, rest)
                        if match:
                            tech_start = min(tech_start, match.start())
                    
                    song_part = rest[:tech_start].strip()
                    if song_part:
                        metadata["song"] = song_part
                        match = re.search(pattern, rest)
                        if match:
                            tech_start = min(tech_start, match.start())
                    
                    song_part = rest[:tech_start].strip()
                    if song_part:
                        metadata["song"] = song_part
        
        # Si no hay " - ", intentar patrón simple "Artist TYPE BEAT"
        elif type_match and type_match.start() > 0:
            artist_part = name[:type_match.start()].strip()
            if artist_part:
                metadata["artist"] = artist_part
        
        # ============================================
        # PATRÓN 5: MOOD/ESTILO en el nombre
        # ============================================
        # Algunos productores incluyen mood descriptivo
        mood_keywords = [
            "dark", "aggressive", "melodic", "chill", "ambient", "energetic",
            "sad", "happy", "emotional", "hard", "soft", "atmospheric",
            "spacey", "dreamy", "melancholic", "uplifting", "heavy"
        ]
        
        for mood_kw in mood_keywords:
            if re.search(rf'\b{mood_kw}\b', name, re.IGNORECASE):
                metadata["mood_hint"] = mood_kw.title()
                break
        
        return metadata
    
    except Exception as e:
        print(f"⚠️  Error extrayendo metadata del filename: {e}", file=sys.stderr)
        return {
            "artist": None,
            "song": None,
            "type": None,
            "genre_hint": None,
            "mood_hint": None,
            "key_hint": None,
            "bpm_hint": None,
            "original_name": filename
        }


def get_song_genre_from_knowledge(artist, song):
    """
    Retorna el género de una canción basado en conocimiento de canciones famosas.
    Este es un mapping de canciones conocidas a sus géneros reales.
    
    Args:
        artist: Nombre del artista
        song: Nombre de la canción
    
    Returns:
        Tuple de (genre_principal, [subgéneros]) o (None, []) si no se encuentra
    """
    
    # Base de datos de canciones famosas y sus géneros reales
    song_database = {
        # Bad Bunny
        "bad bunny - tití me preguntó": ("Reggaeton", ["Dembow", "Trap Latino", "Latin Urban"]),
        "bad bunny - dakiti": ("Reggaeton", ["Dembow", "Dancehall Fusion"]),
        
        # Travis Scott
        "travis scott - sicko mode": ("Trap", ["Hip-Hop", "Psychedelic Trap", "Beat Switch"]),
        "travis scott - goosebumps": ("Trap", ["Hip-Hop", "Psychedelic Trap"]),
        
        # Drake
        "drake - god's plan": ("R&B", ["Hip-Hop", "Trap"]),
        "drake - one dance": ("R&B", ["Hip-Hop", "Dancehall"]),
        
        # Wizkid (Afrobeat)
        "wizkid - essence": ("Afrobeat", ["R&B", "Nigerian Pop"]),
        
        # The Weeknd
        "the weeknd - blinding lights": ("Synthwave", ["Pop", "Electropop", "80s Pop"]),
        
        # Dua Lipa
        "dua lipa - levitating": ("Disco", ["Pop", "Electropop"]),
    }
    
    # Normalizar búsqueda
    search_key = f"{artist} - {song}".lower().strip()
    search_key = re.sub(r'\s+', ' ', search_key)
    
    # Buscar coincidencia exacta
    for db_key, (genre, subgenres) in song_database.items():
        if db_key == search_key or search_key in db_key or db_key in search_key:
            return (genre, subgenres)
    
    # Si no se encuentra
    return (None, [])


def calculate_lufs(y, sr):
    """
    Calcula LUFS (Loudness Units relative to Full Scale).
    Aproximación simplificada usando RMS.
    """
    # Calcular RMS
    rms = np.sqrt(np.mean(y**2))
    
    # Convertir a dB (ref: 1.0)
    db_rms = 20 * np.log10(rms + 1e-10)
    
    # LUFS aproximado (simplificado)
    lufs = db_rms - 23
    
    return lufs


def detect_chord_progression(y, sr, preferred_key_note=None, bpm=120):
    """
    Detecta progresión de acordes mejorada basada en chroma features.
    Analiza 8 compases (progresión de 4-8 acordes).
    MEJORADO: Retorna también info de qué nota fundamental es más común.
    """
    try:
        # Extraer chroma con máxima resolución
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr, n_chroma=12)
        
        # Calcular duración de un compás basado en BPM
        beats_per_minute = max(bpm, 60)
        seconds_per_beat = 60.0 / beats_per_minute
        seconds_per_measure = seconds_per_beat * 4  # 4 beats por compás
        
        # Convertir a frames
        hop_length = 512
        frames_per_second = sr / hop_length
        frames_per_measure = max(1, int(seconds_per_measure * frames_per_second))
        
        # Analizar 8 compases
        n_frames = chroma.shape[1]
        num_measures = min(8, max(4, n_frames // frames_per_measure))
        section_size = max(1, n_frames // num_measures)
        
        note_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        chords = []
        root_note_count = {note: 0 for note in note_names}
        
        # Notas de la escala menor natural relativa (Dorian para menor)
        minor_scale_intervals = [0, 2, 3, 5, 7, 8, 10]  # Intervalos en semitonos
        
        for i in range(num_measures):
            start = i * section_size
            end = min((i + 1) * section_size, n_frames)
            
            if end > start:
                section = chroma[:, start:end]
                chroma_mean = np.mean(section, axis=1)
                
                # Encontrar tónica
                root_idx = np.argmax(chroma_mean)
                root = note_names[root_idx]
                root_note_count[root] += 1  # Contar frecuencia
                root_strength = float(chroma_mean[root_idx])
                
                # Analizar tercera y quinta
                third_major = (root_idx + 4) % 12
                third_minor = (root_idx + 3) % 12
                fifth = (root_idx + 7) % 12
                
                third_major_strength = chroma_mean[third_major]
                third_minor_strength = chroma_mean[third_minor]
                fifth_strength = chroma_mean[fifth]
                
                # Lógica mejorada: considerar quinta justa
                if fifth_strength > root_strength * 0.4:  # Si hay quinta significativa
                    # Comparar terceras
                    if third_major_strength > third_minor_strength * 1.1:
                        chord_type = "maj"
                    else:
                        chord_type = "min"
                else:
                    # Sin quinta clara, usar tercera como indicador
                    if third_major_strength > third_minor_strength:
                        chord_type = "maj"
                    else:
                        chord_type = "min"
                
                chord = f"{root}{chord_type}"
                chords.append(chord)
        
        # Eliminar duplicados consecutivos pero mantener progresión
        unique_chords = []
        for i, chord in enumerate(chords):
            if not unique_chords or chord != unique_chords[-1]:
                unique_chords.append(chord)
        
        # Encontrar la nota raíz más común (tónica probable)
        most_common_root = max(root_note_count, key=root_note_count.get)
        
        return {
            "progression": unique_chords[:8],
            "most_common_root": most_common_root,
            "root_counts": root_note_count
        }
    
    except Exception as e:
        return {
            "progression": [],
            "most_common_root": None,
            "root_counts": {}
        }


def detect_key_advanced(y, sr, key_hint=None):
    """
    MEJORADO v4: Detección PROFESIONAL de tonalidad.
    
    Usa múltiples algoritmos y los combina:
    1. Krumhansl-Schmuckler (perfil de tonalidad estándar)
    2. Análisis de intervalos armónicos (terceras, quintas, séptimas)
    3. Análisis de acordes implícitos
    4. Ponderación por energía temporal
    """
    try:
        note_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        
        # ============================================
        # PASO 1: Extraer chroma features MEJORADO
        # ============================================
        # Usar STFT con ventanas más largas para mejor resolución en bajas frecuencias
        chroma_stft = librosa.feature.chroma_stft(y=y, sr=sr, n_fft=4096, hop_length=512)
        chroma_cqt = librosa.feature.chroma_cqt(y=y, sr=sr, n_chroma=12)
        
        # Combinar ambos métodos (CQT es mejor para bajas frecuencias)
        chroma = 0.6 * chroma_cqt + 0.4 * chroma_stft
        
        # Promediar en diferentes ventanas temporales
        n_frames = chroma.shape[1]
        
        # Ventanas: inicio (25%), medio (50%), final (25%)
        q1 = n_frames // 4
        q3 = 3 * n_frames // 4
        
        chroma_start = np.mean(chroma[:, :q1], axis=1) if q1 > 0 else np.mean(chroma, axis=1)
        chroma_mid = np.mean(chroma[:, q1:q3], axis=1) if q3 > q1 else np.mean(chroma, axis=1)
        chroma_end = np.mean(chroma[:, q3:], axis=1) if q3 < n_frames else np.mean(chroma, axis=1)
        chroma_overall = np.mean(chroma, axis=1)
        
        # Combinar con peso hacia la parte media (suele ser más estable)
        chroma_combined = (
            0.15 * chroma_start + 
            0.50 * chroma_mid + 
            0.15 * chroma_end + 
            0.20 * chroma_overall
        )
        
        # Normalizar
        chroma_normalized = (chroma_combined - np.min(chroma_combined)) / (
            np.max(chroma_combined) - np.min(chroma_combined) + 1e-8
        )
        
        # ============================================
        # PASO 2: ANÁLISIS DE INTERVALOS ARMÓNICOS
        # ============================================
        # Calcular qué intervalos están presentes (terceras, quintas, etc)
        harmonic_scores = np.zeros(12)
        
        for i in range(12):
            # Para cada posible tónica
            root_strength = chroma_normalized[i]
            third_minor = chroma_normalized[(i + 3) % 12]
            third_major = chroma_normalized[(i + 4) % 12]
            fifth = chroma_normalized[(i + 7) % 12]
            sixth_minor = chroma_normalized[(i + 8) % 12]
            sixth_major = chroma_normalized[(i + 9) % 12]
            seventh_minor = chroma_normalized[(i + 10) % 12]
            seventh_major = chroma_normalized[(i + 11) % 12]
            
            # Score basado en presencia de intervalos importantes
            # Quinta es casi siempre presente
            harmonic_scores[i] = root_strength * 1.5 + fifth * 1.0
        
        # ============================================
        # PASO 3: KRUMHANSL-SCHMUCKLER PROFILES
        # ============================================
        # Perfiles estándar de investigación cognitiva musical
        major_profile = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
        minor_profile = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
        
        # Normalizar perfiles
        major_profile = major_profile / np.sum(major_profile)
        minor_profile = minor_profile / np.sum(minor_profile)
        
        # Probar todos los 24 keys
        best_score = -2
        best_key = "C Major"
        best_is_minor = False
        candidates = []
        
        for tonic_idx in range(12):
            tonic_note = note_names[tonic_idx]
            
            # Rotar perfiles
            major_rotated = np.roll(major_profile, tonic_idx)
            minor_rotated = np.roll(minor_profile, tonic_idx)
            
            # Normalizar chroma para esta comparación
            chroma_norm_for_corr = chroma_normalized / (np.sum(chroma_normalized) + 1e-8)
            
            # MÉTODO 1: Correlación de Pearson
            try:
                corr_major = np.corrcoef(chroma_norm_for_corr, major_rotated)[0, 1]
                corr_minor = np.corrcoef(chroma_norm_for_corr, minor_rotated)[0, 1]
            except:
                corr_major = 0
                corr_minor = 0
            
            # MÉTODO 2: Cosine similarity (alternativa robusta)
            cos_major = np.dot(chroma_norm_for_corr, major_rotated) / (
                np.linalg.norm(chroma_norm_for_corr) * np.linalg.norm(major_rotated) + 1e-8
            )
            cos_minor = np.dot(chroma_norm_for_corr, minor_rotated) / (
                np.linalg.norm(chroma_norm_for_corr) * np.linalg.norm(minor_rotated) + 1e-8
            )
            
            # Combinar métodos
            score_major = 0.7 * corr_major + 0.3 * cos_major
            score_minor = 0.7 * corr_minor + 0.3 * cos_minor
            
            # BONUS: Si esta tónica tiene buenos intervalos armónicos
            harmonic_bonus = harmonic_scores[tonic_idx] * 0.1
            score_major += harmonic_bonus
            score_minor += harmonic_bonus
            
            candidates.append({
                "key": f"{tonic_note} Major",
                "score": float(score_major),
                "is_minor": False,
                "idx": tonic_idx
            })
            candidates.append({
                "key": f"{tonic_note} Minor",
                "score": float(score_minor),
                "is_minor": True,
                "idx": tonic_idx
            })
            
            if score_major > best_score:
                best_score = score_major
                best_key = f"{tonic_note} Major"
                best_is_minor = False
                best_tonic_idx = tonic_idx
                best_corr_major = score_major
                best_corr_minor = score_minor
                
            if score_minor > best_score:
                best_score = score_minor
                best_key = f"{tonic_note} Minor"
                best_is_minor = True
                best_tonic_idx = tonic_idx
                best_corr_major = score_major
                best_corr_minor = score_minor
        
        # ============================================
        # PASO 4: VALIDACIÓN ADICIONAL CON TERCERAS
        # ============================================
        # Si la diferencia entre Major y Minor es pequeña, usar terceras como desempate
        sorted_candidates = sorted(candidates, key=lambda x: x["score"], reverse=True)
        top_candidate = sorted_candidates[0]
        second_candidate = sorted_candidates[1] if len(sorted_candidates) > 1 else top_candidate
        
        score_diff = top_candidate["score"] - second_candidate["score"]
        
        if score_diff < 0.08:  # Muy cercanos
            # Usar análisis de terceras como desempate
            tonic_idx = top_candidate["idx"]
            third_minor_strength = chroma_normalized[(tonic_idx + 3) % 12]
            third_major_strength = chroma_normalized[(tonic_idx + 4) % 12]
            
            # Si tercera menor es significativamente más fuerte, es Minor
            if third_minor_strength > third_major_strength * 1.15:
                # Buscar versión Minor de esta tónica
                for cand in sorted_candidates[:5]:
                    if cand["idx"] == tonic_idx and cand["is_minor"]:
                        best_key = cand["key"]
                        best_is_minor = True
                        best_score = cand["score"]
                        break
            elif third_major_strength > third_minor_strength * 1.15:
                # Buscar versión Major de esta tónica
                for cand in sorted_candidates[:5]:
                    if cand["idx"] == tonic_idx and not cand["is_minor"]:
                        best_key = cand["key"]
                        best_is_minor = False
                        best_score = cand["score"]
                        break
        
        # ============================================
        # PASO 5: VALIDACIÓN CON KEY HINT
        # ============================================
        if key_hint:
            hint_parts = key_hint.split()
            if len(hint_parts) > 0:
                hint_note = hint_parts[0]
                # Enarmónicos
                enharmonic_map = {
                    'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
                }
                hint_note = enharmonic_map.get(hint_note, hint_note)
                
                if len(hint_parts) > 1:
                    hint_mode = hint_parts[1].lower()
                    best_is_minor = hint_mode in ['minor', 'min', 'm']
                
                best_key = f"{hint_note} {'Minor' if best_is_minor else 'Major'}"
        
        dominant_note = best_key.split()[0]
        scale_type = "Minor" if best_is_minor else "Major"
        
        confidence_data = {
            "key": best_key,
            "dominant_note": dominant_note,
            "scale_type": scale_type,
            "is_minor": best_is_minor,
            "correlation_major": float(best_corr_major) if 'best_corr_major' in locals() else 0.0,
            "correlation_minor": float(best_corr_minor) if 'best_corr_minor' in locals() else 0.0,
            "chroma_profile": chroma_combined.tolist(),
            "top_notes": [note_names[i] for i in np.argsort(chroma_normalized)[-3:][::-1]],
            "top_candidates": sorted_candidates[:5]
        };
        
        return confidence_data;
        
    except Exception as e:
        print(f"Error en detección avanzada de key: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return {
            "key": "C Major",
            "dominant_note": "C",
            "scale_type": "Major",
            "is_minor": False,
            "correlation_major": 0.0,
            "correlation_minor": 0.0,
            "chroma_profile": [],
            "top_notes": [],
            "top_candidates": []
        }


def extract_technical_features(audio_path, filename):
    """
    Extrae características técnicas del audio:
    - BPM (Beats Per Minute)
    - Key (Tonalidad) - MÉTODO AVANZADO MEJORADO
    - Duration
    - LUFS (Loudness)
    - Acordes
    - Análisis Espectral completo
    
    También parsea el nombre del archivo para extraer hints sobre escala, BPM, etc.
    """
    try:
        # Parsear metadata del nombre del archivo
        file_metadata = extract_filename_metadata(filename)
        
        # Cargar archivo de audio (limitar a 2 minutos para optimizar)
        y, sr = librosa.load(audio_path, duration=120)
        duration = librosa.get_duration(y=y, sr=sr)
        
        # ==================
        # 1. DETECCIÓN DE BPM MEJORADA - ULTRA PRECISA
        # ==================
        # PRIORIDAD 1: Si hay BPM en el NOMBRE DEL ARCHIVO, usarlo como VERDAD ABSOLUTA
        if file_metadata["bpm_hint"]:
            # El nombre del archivo es LA FUENTE DE VERDAD para beats comerciales
            bpm = file_metadata["bpm_hint"]
            bpm_confidence = 100.0  # 100% de confianza cuando viene del filename
            print(f"✅ BPM del filename detectado: {bpm} - Confianza: 100%", file=sys.stderr)
        else:
            # PRIORIDAD 2: No hay hint, usar análisis multi-método REFINADO
            print(f"⚠️  No hay BPM en el filename, usando detección automática REFINADA...", file=sys.stderr)
            
            # Calcular onset envelope con parámetros optimizados
            onset_env = librosa.onset.onset_strength(y=y, sr=sr, aggregate=np.median)
            
            # MÉTODO 1: Tempo estándar con rango amplio
            tempo_standard = librosa.feature.tempo(
                onset_envelope=onset_env, 
                sr=sr,
                start_bpm=60,
                std_bpm=20,
                aggregate=None
            )[0]
            
            # MÉTODO 2: Autocorrelación para encontrar periodicidad
            # Usar frames de onset para encontrar patrones repetitivos
            ac = librosa.autocorrelate(onset_env, max_size=sr * 2 // 512)
            # Encontrar picos en autocorrelación (indican periodicidad)
            peaks = librosa.util.peak_pick(ac, pre_max=3, post_max=3, pre_avg=3, post_avg=5, delta=0.5, wait=10)
            
            if len(peaks) > 0:
                # El primer pico significativo suele ser el período del beat
                first_peak = peaks[0]
                # Convertir a BPM (evitar división por cero)
                hop_length = 512
                if first_peak > 0:
                    tempo_autocorr = 60.0 * sr / (first_peak * hop_length)
                else:
                    tempo_autocorr = tempo_standard
            else:
                tempo_autocorr = tempo_standard
            
            # MÉTODO 3: Beat tracking mejorado
            try:
                # Usar múltiples configuraciones de beat tracking
                tempo_bt, beats = librosa.beat.beat_track(
                    y=y, 
                    sr=sr, 
                    onset_envelope=onset_env,
                    start_bpm=90,
                    tightness=100
                )
                
                # Calcular BPM basado en el spacing REAL de beats
                if len(beats) > 3:
                    beat_times = librosa.frames_to_time(beats, sr=sr)
                    beat_intervals = np.diff(beat_times)
                    
                    # Usar mediana para robustez (ignora outliers)
                    median_interval = np.median(beat_intervals)
                    
                    # Calcular BPM
                    if median_interval > 0.1:  # Evitar divisiones por casi 0
                        tempo_from_beats = 60.0 / median_interval
                    else:
                        tempo_from_beats = tempo_standard
                else:
                    tempo_from_beats = tempo_standard
            except Exception as e:
                print(f"⚠️  Beat tracking falló: {e}", file=sys.stderr)
                tempo_bt = tempo_standard
                tempo_from_beats = tempo_standard
            
            # MÉTODO 4: Análisis de espectrograma (para beats con mucho bajo)
            # Detectar kicks usando energía en frecuencias bajas
            try:
                # Filtrar frecuencias bajas (20-200 Hz donde están los kicks)
                S = librosa.stft(y)
                S_low = S[0:20, :]  # Primeras 20 bins (aproximadamente hasta 200Hz)
                energy_low = np.sum(np.abs(S_low), axis=0)
                
                # Encontrar picos de energía (kicks)
                kick_peaks = librosa.util.peak_pick(
                    energy_low,
                    pre_max=10,
                    post_max=10,
                    pre_avg=10,
                    post_avg=10,
                    delta=0.3,
                    wait=10
                )
                
                if len(kick_peaks) > 3:
                    kick_times = librosa.frames_to_time(kick_peaks, sr=sr)
                    kick_intervals = np.diff(kick_times)
                    median_kick_interval = np.median(kick_intervals)
                    
                    if median_kick_interval > 0.2:
                        tempo_kicks = 60.0 / median_kick_interval
                    else:
                        tempo_kicks = tempo_standard
                else:
                    tempo_kicks = tempo_standard
            except:
                tempo_kicks = tempo_standard
            
            # Combinar métodos con pesos - asegurar que todos son escalares
            tempo_standard_scalar = float(np.asarray(tempo_standard).item()) if hasattr(tempo_standard, '__iter__') else float(tempo_standard)
            tempo_bt_scalar = float(np.asarray(tempo_bt).item()) if hasattr(tempo_bt, '__iter__') else float(tempo_bt)
            tempo_from_beats_scalar = float(tempo_from_beats)
            tempo_autocorr_scalar = float(tempo_autocorr)
            tempo_kicks_scalar = float(tempo_kicks)
            
            # Validar que no haya valores infinitos o NaN
            def sanitize_tempo(t):
                if np.isnan(t) or np.isinf(t) or t <= 0 or t > 1000:
                    return 120.0  # Valor por defecto
                return t
            
            tempo_standard_scalar = sanitize_tempo(tempo_standard_scalar)
            tempo_bt_scalar = sanitize_tempo(tempo_bt_scalar)
            tempo_from_beats_scalar = sanitize_tempo(tempo_from_beats_scalar)
            tempo_autocorr_scalar = sanitize_tempo(tempo_autocorr_scalar)
            tempo_kicks_scalar = sanitize_tempo(tempo_kicks_scalar)
            
            # Agrupar tempos similares (pueden ser doble/mitad)
            all_tempos = [tempo_standard_scalar, tempo_bt_scalar, tempo_from_beats_scalar, tempo_autocorr_scalar, tempo_kicks_scalar]
            
            # Normalizar todos a rango similar (60-180 BPM)
            normalized_tempos = []
            for t in all_tempos:
                # Evitar infinitos loops con límite de iteraciones
                iterations = 0
                max_iterations = 10
                while t < 60 and iterations < max_iterations:
                    t *= 2
                    iterations += 1
                iterations = 0
                while t > 180 and iterations < max_iterations:
                    t /= 2
                    iterations += 1
                # Si aún está fuera de rango, usar un valor por defecto
                if t < 60 or t > 180:
                    t = 120  # Valor por defecto razonable
                normalized_tempos.append(t)
            
            # Usar mediana de tempos normalizados
            bpm_detected = np.median(normalized_tempos)
            
            # Redondear a entero
            bpm_detected = int(round(bpm_detected))
            
            # Validación final: si está fuera del rango común, ajustar
            if bpm_detected < 60:
                bpm_detected = bpm_detected * 2
            elif bpm_detected > 200:
                bpm_detected = bpm_detected // 2
            
            bpm = bpm_detected
            
            # Calcular confianza basada en consistencia entre TODOS los métodos
            bpm_variance = np.std(normalized_tempos)
            
            # Confianza alta si todos los métodos están de acuerdo
            if bpm_variance < 2:
                bpm_confidence = 95.0  # Muy alta confianza
            elif bpm_variance < 5:
                bpm_confidence = 90 - (bpm_variance - 2) * 5  # 90-75%
            elif bpm_variance < 10:
                bpm_confidence = 75 - (bpm_variance - 5) * 5  # 75-50%
            else:
                bpm_confidence = max(40, 50 - (bpm_variance - 10) * 2)  # 50-40%
            
            bpm_confidence = min(95.0, max(40.0, bpm_confidence))
            
            print(f"🎯 BPM DETECTADO: {bpm} BPM", file=sys.stderr)
            print(f"   Métodos: Standard={tempo_standard_scalar:.1f}, BT={tempo_bt_scalar:.1f}, Beats={tempo_from_beats_scalar:.1f}, AC={tempo_autocorr_scalar:.1f}, Kicks={tempo_kicks_scalar:.1f}", file=sys.stderr)
            print(f"   Normalizados: {[f'{t:.1f}' for t in normalized_tempos]}", file=sys.stderr)
            print(f"   Varianza: {bpm_variance:.2f} - Confianza: {bpm_confidence:.1f}%", file=sys.stderr)
        
        # ==================
        # 2. DETECCIÓN AVANZADA DE TONALIDAD (KEY) - MEJORADO
        # ==================
        # PRIORIDAD 1: Si hay key hint en el NOMBRE DEL ARCHIVO, usarlo como VERDAD ABSOLUTA
        if file_metadata["key_hint"]:
            # El nombre del archivo es LA FUENTE DE VERDAD para beats comerciales
            print(f"✅ KEY del filename detectada: {file_metadata['key_hint']}", file=sys.stderr)
            
            # Parsear el hint del filename
            hint_parts = file_metadata["key_hint"].split()
            hint_note = hint_parts[0]
            
            # Enarmónicos
            enharmonic_map = {
                'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
            }
            hint_note = enharmonic_map.get(hint_note, hint_note)
            
            # Determinar si es Mayor o Menor
            if len(hint_parts) > 1:
                hint_mode = hint_parts[1].lower()
                is_minor_from_hint = hint_mode in ['minor', 'min', 'm']
                scale_type = "Minor" if is_minor_from_hint else "Major"
            else:
                # Solo hay nota, analizar para determinar Mayor/Menor
                key_data = detect_key_advanced(y, sr, file_metadata["key_hint"])
                scale_type = key_data["scale_type"]
            
            # USAR EL KEY DEL FILENAME como certeza 100%
            key = f"{hint_note} {scale_type}"
            dominant_note = hint_note
            key_confidence = 100.0  # 100% de confianza cuando viene del filename
            
            print(f"🎯 KEY FINAL (del filename): {key} - Confianza: 100%", file=sys.stderr)
        else:
            # PRIORIDAD 2: No hay hint, usar detección automática
            print(f"⚠️  No hay KEY en el filename, usando detección automática...", file=sys.stderr)
            key_data = detect_key_advanced(y, sr, None)
            key = key_data["key"]
            dominant_note = key_data["dominant_note"]
            scale_type = key_data["scale_type"]
            
            # Calcular confianza basada en correlaciones
            corr_major = key_data["correlation_major"]
            corr_minor = key_data["correlation_minor"]
            best_corr = max(corr_major, corr_minor)
            
            # Convertir correlación (-1 a 1) a porcentaje de confianza (0-100%)
            # Correlación > 0.7 = Alta confianza (80-100%)
            # Correlación 0.5-0.7 = Media confianza (60-80%)
            # Correlación < 0.5 = Baja confianza (0-60%)
            if best_corr > 0.7:
                key_confidence = 80 + (best_corr - 0.7) * 66.67  # 80-100%
            elif best_corr > 0.5:
                key_confidence = 60 + (best_corr - 0.5) * 100    # 60-80%
            else:
                key_confidence = best_corr * 120                  # 0-60%
            
            key_confidence = min(95.0, max(0.0, key_confidence))  # Cap a 95% (nunca 100% sin filename)
            
            print(f"🎯 KEY DETECTADO (automático): {key} - Confianza: {key_confidence:.1f}%", file=sys.stderr)
        
        # ==================
        # 3. ANÁLISIS ESPECTRAL COMPLETO
        # ==================
        S = librosa.feature.melspectrogram(y=y, sr=sr)
        S_db = librosa.power_to_db(S, ref=np.max)
        
        spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
        avg_spectral_centroid = int(np.mean(spectral_centroid))
        
        spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
        avg_spectral_rolloff = int(np.mean(spectral_rolloff))
        
        zero_crossing_rate = librosa.feature.zero_crossing_rate(y)[0]
        avg_zcr = float(np.mean(zero_crossing_rate))
        
        # ==================
        # 4. LOUDNESS (LUFS)
        # ==================
        lufs = calculate_lufs(y, sr)
        
        # ==================
        # 5. DETECCIÓN DE ACORDES (8 compases mejorada)
        # ==================
        chord_data = detect_chord_progression(y, sr, dominant_note, bpm)
        chords = chord_data["progression"]
        
        # VALIDACIÓN: Solo ajustar key si NO vino del filename (confianza < 100%)
        # Si el filename dio el key, NO sobreescribir con acordes
        if key_confidence < 100.0:
            # MEJORÍA: Si la nota más común en acordes no coincide con key detectada,
            # reconsiderar el key (es probable que sea la relativa o off por 1 semitono)
            if chord_data["most_common_root"] and chord_data["most_common_root"] != dominant_note:
                # La raíz más común en los acordes es diferente
                # Esto sugiere que tal vez es la tonalidad relativa O hay un error de 1 semitono
                most_common_root = chord_data["most_common_root"]
                
                # Contar cuántos acordes usan esta raíz
                root_count = chord_data["root_counts"].get(most_common_root, 0)
                detected_count = chord_data["root_counts"].get(dominant_note, 0)
                
                # Si la raíz común aparece significativamente más (>40% de las veces)
                total_chords = sum(chord_data["root_counts"].values())
                if total_chords > 0 and root_count > total_chords * 0.4:
                    # La raíz de los acordes es más frecuente - probablemente es la tónica correcta
                    # Actualizar el key para usar esta raíz pero mantener el modo (Major/Minor)
                    print(f"🔄 Ajustando key: Acordes sugieren {most_common_root} como tónica (aparece {root_count}/{total_chords} veces)", file=sys.stderr)
                    key = f"{most_common_root} {scale_type}"
                    dominant_note = most_common_root
                    # Aumentar confianza si acordes confirman
                    key_confidence = min(95.0, key_confidence + 10.0)
        else:
            print(f"✅ KEY del filename tiene prioridad absoluta - no se ajusta con acordes", file=sys.stderr)
        
        # ==================
        # 6. MFCC (Mel-Frequency Cepstral Coefficients)
        # ==================
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        avg_mfcc = np.mean(mfcc, axis=1).tolist()
        
        # ==================
        # 7. EXPLICACIÓN DE ESCALA
        # ==================
        scale_explanation = generate_scale_explanation(key, avg_spectral_centroid, bpm)
        
        return {
            "bpm": bpm,
            "bpm_confidence": round(bpm_confidence, 1),
            "key": key,
            "key_confidence": round(key_confidence, 1),
            "duration": int(round(duration)),
            "dominant_note": dominant_note,
            "spectral_centroid": avg_spectral_centroid,
            "spectral_rolloff": avg_spectral_rolloff,
            "zero_crossing_rate": round(avg_zcr, 4),
            "lufs": lufs,
            "scale_type": scale_type,
            "chord_progression": chords,
            "scale_explanation": scale_explanation,
            "filename": filename,
            "detection_source": {
                "bpm_from_filename": file_metadata["bpm_hint"] is not None,
                "key_from_filename": file_metadata["key_hint"] is not None
            }
        }
    
    except Exception as e:
        raise Exception(f"Error en extracción de características: {str(e)}")


def extract_mandatory_tags_from_filename(file_metadata, technical_data):
    """
    Extrae tags OBLIGATORIOS del nombre del archivo y datos técnicos.
    Estos tags SIEMPRE deben estar presentes en la respuesta final.
    
    Args:
        file_metadata: Dict con metadata extraída del filename
        technical_data: Dict con datos técnicos del análisis
    
    Returns:
        List de tags obligatorios
    """
    mandatory_tags = []
    
    # 1. ARTISTA (si está en el nombre)
    if file_metadata.get("artist"):
        artist = file_metadata["artist"]
        mandatory_tags.append(artist)
        mandatory_tags.append(f"{artist} Type")
    
    # 2. CANCIÓN (si está en el nombre) + BUSCAR SU GÉNERO REAL
    if file_metadata.get("song"):
        song = file_metadata["song"]
        mandatory_tags.append(song)
        
        # BÚSQUEDA PRIORITARIA: Obtener el género real de la canción original
        if file_metadata.get("artist") and file_metadata.get("song"):
            genre_found, subgenres = get_song_genre_from_knowledge(
                file_metadata["artist"], 
                file_metadata["song"]
            )
            
            # Si encontramos el género, agregarlo como GÉNERO PRINCIPAL (muy prioritario)
            if genre_found:
                # Insertar género como SEGUNDO elemento (después del artista)
                mandatory_tags.insert(2, genre_found)
                # Agregar subgéneros
                for subgenre in subgenres[:2]:  # Máximo 2 subgéneros
                    if subgenre.lower() not in [tag.lower() for tag in mandatory_tags]:
                        mandatory_tags.append(subgenre)
                print(f"🎯 Género detectado de canción original: {genre_found} (de {song})", file=sys.stderr)
    
    # 3. GÉNERO HINT (si está en el nombre, pero SECUNDARIO a la búsqueda de canción)
    if file_metadata.get("genre_hint"):
        genre_hint = file_metadata["genre_hint"]
        # Solo agregar si no ya está en mandatory_tags
        if genre_hint.lower() not in [tag.lower() for tag in mandatory_tags]:
            mandatory_tags.append(genre_hint)
    
    # 4. MOOD HINT (si está en el nombre)
    if file_metadata.get("mood_hint"):
        mandatory_tags.append(file_metadata["mood_hint"])

    
    # 5. KEY (SIEMPRE - del filename si está, sino del análisis)
    key = technical_data.get("key", "Unknown")
    if key != "Unknown":
        mandatory_tags.append(key)
        
        # Agregar versión abreviada también (ej: "Am", "C#m")
        note = key.split()[0]
        scale_type = "Minor" if "Minor" in key else "Major"
        if scale_type == "Minor":
            abbreviated = f"{note}m"
        else:
            abbreviated = f"{note}maj"
        mandatory_tags.append(abbreviated)
    
    # 6. BPM (SIEMPRE - del filename si está, sino del análisis)
    bpm = technical_data.get("bpm", 0)
    if bpm > 0:
        mandatory_tags.append(f"{int(bpm)} BPM")
    
    # 7. TYPE BEAT (si está especificado)
    if file_metadata.get("type") == "TYPE BEAT":
        mandatory_tags.append("Type Beat")
    
    return mandatory_tags


def merge_tags_with_priority(mandatory_tags, ai_tags, max_tags=25):
    """
    Combina tags obligatorios del filename con tags generados por IA,
    dando PRIORIDAD a los tags obligatorios.
    
    Args:
        mandatory_tags: List de tags obligatorios del filename
        ai_tags: List de tags generados por Gemini
        max_tags: Número máximo de tags en la respuesta final
    
    Returns:
        List de tags combinados (sin duplicados, con prioridad)
    """
    # Normalizar todos los tags a minúsculas para comparación
    seen_normalized = set()
    final_tags = []
    
    # PRIORIDAD 1: Tags obligatorios del filename (siempre primero)
    for tag in mandatory_tags:
        tag_normalized = tag.lower().strip()
        if tag_normalized and tag_normalized not in seen_normalized:
            final_tags.append(tag)
            seen_normalized.add(tag_normalized)
    
    # PRIORIDAD 2: Tags de IA (agregar si no duplican los obligatorios)
    for tag in ai_tags:
        tag_normalized = tag.lower().strip()
        if tag_normalized and tag_normalized not in seen_normalized:
            final_tags.append(tag)
            seen_normalized.add(tag_normalized)
            
            # Limitar a max_tags
            if len(final_tags) >= max_tags:
                break
    
    return final_tags


def generate_scale_explanation(key, spectral_centroid_value, bpm):
    """
    Genera una breve explicación de la escala detectada.
    """
    scale_type = "Minor" if "Minor" in key else "Major"
    note = key.split()[0]
    
    # Características por escala
    brightness = "brillante" if spectral_centroid_value > 4000 else "oscura"
    energy = "alta energía" if bpm > 130 else "energía moderada" if bpm > 90 else "baja energía"
    
    explanation = f"Escala {key}. Características: {brightness}, {energy}. "
    
    if scale_type == "Minor":
        explanation += "Tonalidad menor típicamente asociada con emociones melancólicas o introspectivas."
    else:
        explanation += "Tonalidad mayor típicamente asociada con emociones alegres o enérgicas."
    
    return explanation


def build_baseline_confidence(technical_data, ai_inference, filename):
    """Construye una tabla de confianza base sin depender de Gemini."""
    detection = technical_data.get("detection_source", {})

    def clamp_conf(val):
        try:
            return float(max(0.0, min(100.0, val)))
        except Exception:
            return 0.0

    bpm_conf = technical_data.get("bpm_confidence", 70.0)
    if detection.get("bpm_from_filename"):
        bpm_conf = max(bpm_conf, 95.0)

    key_conf = technical_data.get("key_confidence", 70.0)
    if detection.get("key_from_filename"):
        key_conf = max(key_conf, 95.0)

    mood_conf = 78.0 if ai_inference.get("mood") else 50.0
    tags_conf = 80.0 if ai_inference.get("tags") else 60.0

    # Extraer metadata del filename para mostrar GÉNERO en la tabla
    file_metadata = extract_filename_metadata(filename)
    genre_from_file = file_metadata.get("genre_hint")
    artist_from_file = file_metadata.get("artist")
    song_from_file = file_metadata.get("song")

    gemini_access = ai_inference.get("gemini_access", False)
    tags_source_label = "IA + Parser" if gemini_access else "Solo Parser"

    items = [
        {
            "parameter": "📁 Nombre/Archivo",
            "value": filename or "Desconocido",
            "confidence": clamp_conf(92.0 if filename else 60.0),
            "source": "filename",
            "rationale": "Parseo directo del nombre del archivo"
        },
        {
            "parameter": "🎤 Artista Detectado",
            "value": artist_from_file or "No detectado",
            "confidence": clamp_conf(85.0 if artist_from_file else 0.0),
            "source": "filename",
            "rationale": "Extraído del nombre del archivo (antes del primer '-')"
        },
        {
            "parameter": "🎵 Canción/Referencia",
            "value": song_from_file or "No detectada",
            "confidence": clamp_conf(80.0 if song_from_file else 0.0),
            "source": "filename",
            "rationale": "Extraído del nombre del archivo (entre artista y TYPE BEAT)"
        },
    ]
    
    # AGREGACIÓN DE GÉNERO DETECTADO - CRÍTICO
    # Intentar extraer género de los tags generados por Gemini
    genre_detected = genre_from_file
    
    if not genre_detected and ai_inference.get("tags"):
        # Buscar en los tags principales (Gemini ordena por relevancia)
        # Géneros comunes conocidos
        known_genres = ["R&B", "Hip-Hop", "Trap", "House", "Reggaeton", "Afrobeat", 
                       "Drill", "UK Drill", "Drum & Bass", "Dubstep", "Trap Latino",
                       "Dembow", "Pop", "Electronic", "Techno", "Indie", "Rock",
                       "Funk", "Soul", "Jazz", "Lo-Fi", "Ambient"]
        
        for tag in ai_inference.get("tags", []):
            if tag in known_genres:
                genre_detected = tag
                break
    
    if artist_from_file or genre_detected or (artist_from_file and song_from_file):
        # Si hay artista, Gemini habrá analizado el género
        detected_genre = genre_detected or ("Detectado por Gemini" if artist_from_file else "No detectado")
        
        if detected_genre != "No detectado":
            ai_engine = ai_inference.get("gemini_status", "unknown")
            engine_label = "IA (Groq)" if ai_engine == "groq" else ("IA (Gemini)" if ai_inference.get("gemini_access", False) else "Local")
            source_label = "filename" if genre_from_file else ("ia-groq" if ai_engine == "groq" else ("ia-gemini" if ai_inference.get("gemini_access", False) else "local"))
            items.append({
                "parameter": "🎸 Género (del Artista)",
                "value": detected_genre,
                "confidence": clamp_conf(95.0 if genre_from_file else 85.0 if genre_detected else 75.0),
                "source": source_label,
                "rationale": f"Género del artista {'extraído del filename' if genre_from_file else f'identificado por {engine_label} desde tags generados'}"
            })
    
    # Agregar información técnica
    items.extend([
        {
            "parameter": "BPM",
            "value": str(technical_data.get("bpm", "-")),
            "confidence": clamp_conf(bpm_conf),
            "source": "filename" if detection.get("bpm_from_filename") else "audio",
            "rationale": "Se prioriza el valor en el filename; si falta, detección multi-método de audio"
        },
        {
            "parameter": "Key",
            "value": technical_data.get("key", "-"),
            "confidence": clamp_conf(key_conf),
            "source": "filename" if detection.get("key_from_filename") else "audio",
            "rationale": "Parseo del filename o detección cromática avanzada sobre el audio"
        },
        {
            "parameter": "Mood",
            "value": ai_inference.get("mood", "-"),
            "confidence": clamp_conf(mood_conf),
            "source": ("ia-groq" if ai_inference.get("gemini_status") == "groq" else ("ia-gemini" if gemini_access else "local")),
            "rationale": ("IA (Groq) combina hints del filename, BPM/Key y búsqueda web" if ai_inference.get("gemini_status") == "groq" else ("IA (Gemini) combina hints del filename, BPM/Key y búsqueda web" if gemini_access else "Heurística local basada en BPM/Key y análisis técnico"))
        },
        {
            "parameter": f"Etiquetas ({tags_source_label})",
            "value": ", ".join(ai_inference.get("tags", [])[:8]) or "-",
            "confidence": clamp_conf(tags_conf),
            "source": ("ia-groq" if ai_inference.get("gemini_status") == "groq" else ("ia-gemini" if gemini_access else "parser")),
            "rationale": ((f"IA (Groq) genera {len(ai_inference.get('tags', []))} tags considerando: artista + canción + análisis + búsqueda web") if ai_inference.get("gemini_status") == "groq" else (f"IA (Gemini) genera {len(ai_inference.get('tags', []))} tags considerando: artista + canción + análisis + búsqueda web" if gemini_access else "Parser fusiona tags obligatorios del filename y heurística local sin IA"))
        }
    ])

    return items


def generate_confidence_report(technical_data, ai_inference):
    """Genera tabla de confianza con Gemini; usa heurística local como fallback."""
    filename = technical_data.get("filename") or "Nombre no disponible"
    baseline_items = build_baseline_confidence(technical_data, ai_inference, filename)

    ai_engine = ai_inference.get("gemini_status", "unknown")
    engine_label = "IA (Groq)" if ai_engine == "groq" else ("IA (Gemini)" if ai_inference.get("gemini_access", False) else "IA Local")
    summary = f"Pipeline: parseo del filename → análisis técnico (BPM/Key) → {engine_label} para mood y tags."
    method = f"Fuentes: filename (si existe) + audio + {engine_label}."

    report = {
        "items": baseline_items,
        "summary": summary,
        "method": method
    }

    # Si no hay API keys válidas, retornar baseline
    if not ACTIVE_API_KEYS:
        return report

    try:
        prompt = f"""
Genera una tabla de confianza resumida para un beat. Usa SOLO JSON plano.
Datos disponibles:
- filename: "{filename}"
- technical_data: {json.dumps({
    "bpm": technical_data.get('bpm'),
    "bpm_confidence": technical_data.get('bpm_confidence'),
    "key": technical_data.get('key'),
    "key_confidence": technical_data.get('key_confidence'),
    "detection_source": technical_data.get('detection_source', {})
}, ensure_ascii=False)}
- ai_inference: {json.dumps({
    "mood": ai_inference.get('mood'),
    "tags": ai_inference.get('tags', [])[:8]
}, ensure_ascii=False)}

Formato EXACTO de salida (sin texto adicional):
{{"items":[{{"parameter":"BPM","value":"92","confidence":88,"source":"audio|filename|gemini","rationale":"breve"}}],"summary":"1 frase explicando pipeline","method":"fuentes usadas"}}
Los valores de confianza deben ser numéricos (0-100). Limita items a 6 máximo.
"""

        response_text = call_gemini_with_fallback(prompt, model_name='gemini-2.0-flash')

        if '```json' in response_text:
            response_text = response_text.split('```json')[1].split('```')[0].strip()
        elif '```' in response_text:
            response_text = response_text.split('```')[1].split('```')[0].strip()

        parsed = json.loads(response_text)
        items = parsed.get("items")
        if not items or not isinstance(items, list):
            return report

        normalized_items = []
        for item in items:
            normalized_items.append({
                "parameter": item.get("parameter", ""),
                "value": item.get("value", ""),
                "confidence": float(max(0.0, min(100.0, item.get("confidence", 0)))),
                "source": item.get("source", ""),
                "rationale": item.get("rationale", "")
            })

        report = {
            "items": normalized_items or baseline_items,
            "summary": parsed.get("summary", summary),
            "method": parsed.get("method", method)
        }

    except Exception as e:
        print(f"⚠️  Error generando tabla de confianza con Gemini: {e}", file=sys.stderr)

    return report


def classify_genre_by_bpm(bpm):
    """
    Clasifica géneros sugeridos basado en BPM.
    """
    if bpm < 80:
        return "Ambient, Downtempo, Chill, Ballad"
    elif 80 <= bpm < 110:
        return "Lo-Fi, Hip-Hop, Reggaeton, Trap, R&B"
    elif 110 <= bpm < 140:
        return "House, Funk, Pop, UK Garage"
    elif 140 <= bpm < 170:
        return "Drum & Bass, Dubstep, Garage, Fast Rap"
    else:
        return "Hardcore, Speedcore, Breakcore"


def validate_bpm_with_gemini(filename, detected_bpm, file_metadata):
    """
    Valida y triangula el BPM usando múltiples fuentes:
    1. Filename (si está disponible)
    2. TuneBat web scraping (más preciso)
    3. Gemini + búsqueda web
    4. Análisis técnico del script
    
    Args:
        filename: Nombre del archivo
        detected_bpm: BPM detectado por script (float)
        file_metadata: Metadata extraída del filename
    
    Returns:
        Dict con: bpm_final, bpm_confidence, bpm_source, bpm_range, tunebat_data
    """
    try:
        # Si ya está en el filename, retornar directamente
        if file_metadata.get("bpm_hint"):
            return {
                "bpm_final": file_metadata["bpm_hint"],
                "bpm_confidence": 100.0,
                "bpm_source": "filename",
                "bpm_range": f"{file_metadata['bpm_hint']-2} - {file_metadata['bpm_hint']+2}",
                "validation": "Exacto del nombre del archivo",
                "tunebat_data": None
            }
        
        artist = file_metadata.get("artist")
        song = file_metadata.get("song")
        genre = file_metadata.get("genre_hint")
        
        tunebat_data = None
        
        # PRIORIDAD 1: TuneBat (muy preciso, datos reales)
        if artist and song:
            tunebat_data = scrape_tunebat_song(artist, song)
            
            if tunebat_data and tunebat_data.get("bpm"):
                tunebat_bpm = tunebat_data["bpm"]
                diff = abs(detected_bpm - tunebat_bpm)
                
                if diff <= 5:
                    # Coincidencia cercana, usar TuneBat como autoridad
                    print(f"✅ TuneBat validó BPM: {tunebat_bpm} (detectado: {detected_bpm})", file=sys.stderr)
                    return {
                        "bpm_final": tunebat_bpm,
                        "bpm_confidence": 95.0,
                        "bpm_source": "tunebat",
                        "bpm_range": f"{tunebat_bpm-3} - {tunebat_bpm+3}",
                        "validation": f"TuneBat: {tunebat_bpm}, Script: {int(detected_bpm)}",
                        "tunebat_data": tunebat_data
                    }
                else:
                    # Diferencia grande, TuneBat probablemente es más confiable
                    print(f"⚠️  TuneBat diferente: {tunebat_bpm} vs Script: {detected_bpm}, usando TuneBat", file=sys.stderr)
                    return {
                        "bpm_final": tunebat_bpm,
                        "bpm_confidence": 90.0,
                        "bpm_source": "tunebat",
                        "bpm_range": f"{tunebat_bpm-5} - {tunebat_bpm+5}",
                        "validation": f"TuneBat: {tunebat_bpm}, Script: {int(detected_bpm)} (variación)",
                        "tunebat_data": tunebat_data
                    }
        
        # PRIORIDAD 2: Gemini con búsqueda web
        if artist and song:
            prompt = f"""Busca en internet el BPM exacto de: "{song}" por {artist}

BÚSQUEDAS ESPECÍFICAS:
1. Busca la canción original en Spotify/YouTube
2. Si no está, busca "'{song}' '{artist}' BPM"
3. Retorna SOLO el BPM como número

RESPUESTA (SOLO JSON, sin explicación):
{{"bpm": número, "source": "spotify/youtube/genius", "confidence": 0-100}}

Ejemplo:
{{"bpm": 138, "source": "spotify", "confidence": 95}}
"""
            
            try:
                response_text = call_gemini_with_fallback(prompt, model_name='gemini-2.0-flash')
                
                if '```json' in response_text:
                    response_text = response_text.split('```json')[1].split('```')[0].strip()
                elif '```' in response_text:
                    response_text = response_text.split('```')[1].split('```')[0].strip()
                
                gemini_data = json.loads(response_text)
                gemini_bpm = gemini_data.get("bpm")
                gemini_confidence = gemini_data.get("confidence", 80)
                
                if gemini_bpm:
                    diff = abs(detected_bpm - gemini_bpm)
                    if diff <= 5:
                        print(f"✅ Gemini validó BPM: {gemini_bpm}", file=sys.stderr)
                        return {
                            "bpm_final": int(gemini_bpm),
                            "bpm_confidence": min(95.0, gemini_confidence + 10),
                            "bpm_source": "gemini_web",
                            "bpm_range": f"{int(gemini_bpm)-3} - {int(gemini_bpm)+3}",
                            "validation": f"Gemini: {int(gemini_bpm)}, Script: {int(detected_bpm)}",
                            "tunebat_data": tunebat_data
                        }
            except:
                pass
        
        # FALLBACK: Usar detectado por script
        return {
            "bpm_final": int(detected_bpm),
            "bpm_confidence": 75.0,
            "bpm_source": "script",
            "bpm_range": f"{int(detected_bpm)-5} - {int(detected_bpm)+5}",
            "validation": "Detectado por análisis técnico",
            "tunebat_data": tunebat_data
        }
    
    except Exception as e:
        print(f"⚠️  Error en validación BPM: {e}", file=sys.stderr)
        return {
            "bpm_final": int(detected_bpm),
            "bpm_confidence": 75.0,
            "bpm_source": "script",
            "bpm_range": f"{int(detected_bpm)-5} - {int(detected_bpm)+5}",
            "validation": "Fallback script",
            "tunebat_data": None
        }


def should_use_web_search(file_metadata, filename):
    """
    Decide si usar búsqueda web según el contexto del beat.
    Búsqueda web consume más cuota, solo usarla cuando aporte valor real.
    
    Returns:
        bool: True si se debe usar búsqueda web
    """
    artist = file_metadata.get('artist', '').strip()
    song = file_metadata.get('song', '').strip()
    
    # Palabras que NO son artistas reales (filtro)
    non_artist_words = [
        'dark', 'trap', 'drill', 'type', 'beat', 'instrumental', 'free',
        'tagged', 'demo', 'hard', 'soft', 'melodic', 'aggressive', 'chill',
        'ambient', 'emotional', 'sad', 'happy', 'test', 'sample'
    ]
    
    # NO usar búsqueda web si:
    # 1. No hay artista mencionado
    if not artist:
        return False
    
    # 2. El "artista" es realmente una palabra descriptiva o tag
    if artist.lower() in non_artist_words:
        print(f"⚠️  '{artist}' no es artista real, usando flash-lite sin búsqueda", file=sys.stderr)
        return False
    
    # 3. Es un beat genérico sin artista específico
    generic_terms = ['type beat', 'instrumental', 'beat', 'prod by', 'free beat']
    if any(term in filename.lower() for term in generic_terms) and not song:
        return False
    
    # SÍ usar búsqueda web si:
    # 1. Hay artista específico Y canción mencionada (validar longitud mínima)
    if artist and song and len(artist) > 3 and len(song) > 5:
        print(f"🌐 Artista '{artist}' + canción '{song}' detectados, usando búsqueda web", file=sys.stderr)
        return True
    
    # 2. Hay artista que parece legítimo
    if artist and len(artist) > 3:
        print(f"🔍 Artista '{artist}' detectado, usando búsqueda web", file=sys.stderr)
        return True
    
    return False


def infer_with_gemini(technical_data):
    """
    Usa la API de Gemini para inferir Mood y generar Tags descriptivos.
    Incluye información completa de audio: LUFS, acordes, spectro, filename.
    Búsqueda web SELECTIVA: solo cuando aporte valor (artista+canción o artista nuevo).
    Si falla, usa inferencia local.
    """
    # Estado de acceso a Gemini para UI/tabla
    gemini_access = False
    gemini_status = "unknown"
    try:
        # Extraer datos
        bpm = technical_data['bpm']
        key = technical_data['key']
        spectral_centroid = technical_data['spectral_centroid']
        lufs = technical_data['lufs']
        chords = technical_data.get('chord_progression', [])
        filename = technical_data.get('filename', 'unknown')
        spectral_rolloff = technical_data.get('spectral_rolloff', 0)
        zcr = technical_data.get('zero_crossing_rate', 0)
        
        suggested_genres = classify_genre_by_bpm(bpm)
        
        # Parsear metadata del nombre
        file_metadata = extract_filename_metadata(filename)
        
        # Decidir si usar búsqueda web (optimización de cuota)
        use_web_search = should_use_web_search(file_metadata, filename)
        
        # Instrucción de búsqueda web (solo si está habilitada)
        web_search_instruction = ""
        if use_web_search:
            web_search_instruction = """
⚠️  INSTRUCCIÓN CRÍTICA: PUEDES BUSCAR EN INTERNET PARA OBTENER INFORMACIÓN PRECISA

Si el nombre del archivo menciona un ARTISTA o una CANCIÓN CONOCIDA:
🌐 BUSCA EN INTERNET la información sobre ese artista/canción
🔍 Busca específicamente:
   - El GÉNERO MUSICAL REAL de esa canción/artista
   - Las características de producción de ese artista
   - El estilo musical característico del artista
   - Colaboraciones y contexto cultural

EJEMPLOS DE BÚSQUEDAS QUE DEBES HACER SI APLICA:
- "Bad Bunny Tití Me Preguntó genre" → Reggaeton/Dembow
- "Travis Scott SICKO MODE genre" → Trap/Hip-Hop
- "Drake God's Plan genre" → R&B/Hip-Hop
- "Wizkid Essence genre" → Afrobeat

Esto es CRÍTICO porque el BPM por sí solo no es suficiente para determinar el género real.
"""
        
        # Construir prompt optimizado (con o sin búsqueda web)
        prompt = f"""Eres un experto musicólogo, productor musical y crítico especializado en análisis de beats y archivos de audio.
{web_search_instruction}

╔═══════════════════════════════════════════════════════════════════════════════════════╗
║           🎯 NOMBRE DEL ARCHIVO - FUENTE PRINCIPAL DE INFORMACIÓN                    ║
╚═══════════════════════════════════════════════════════════════════════════════════════╝

📁 NOMBRE COMPLETO DEL ARCHIVO:
{filename}

📊 METADATA EXTRAÍDA DEL NOMBRE (INFORMACIÓN CRÍTICA):
- Artista(s) Mencionado(s): {file_metadata.get("artist") or "No especificado"}
- Canción/Concepto Referencia: {file_metadata.get("song") or "No especificado"}
- Tipo de Beat: {file_metadata.get("type") or "No especificado"}
- Género Hint: {file_metadata.get("genre_hint") or "No especificado"}
- Mood Hint: {file_metadata.get("mood_hint") or "No especificado"}
- Escala en nombre: {file_metadata.get("key_hint") or "No especificada"}
- BPM en nombre: {file_metadata.get("bpm_hint") or "No especificado"}

╔═══════════════════════════════════════════════════════════════════════════════════════╗
║                    🌐 INSTRUCCIÓN CRÍTICA - USO DE METADATA DEL ARCHIVO               ║
╚═══════════════════════════════════════════════════════════════════════════════════════╝

⚠️  TAGS OBLIGATORIOS DEL NOMBRE DEL ARCHIVO (INCLUIR SÍ O SÍ):

1. 🎤 SI HAY ARTISTA MENCIONADO:
   - DEBE incluir el nombre del artista como tag (ej: "Bad Bunny", "Travis Scott", "Drake")
   - DEBE incluir el nombre del artista + "Type" o "Style" (ej: "Travis Scott Type")
   - BUSCA en tu conocimiento: ¿Qué género hace este artista?
   - BUSCA en tu conocimiento: ¿Qué mood/estilo caracteriza a este artista?
   - Incluye tags relacionados al estilo del artista

2. 🎵 SI HAY CANCIÓN MENCIONADA:
   - DEBE incluir el nombre de la canción como tag
   - 🔍 BÚSQUEDA PRIORITARIA EN INTERNET: Busca el GÉNERO REAL de esa canción en internet
   - BUSCA ESPECÍFICAMENTE:
     * El género musical de la canción original
     * El productor original y su estilo
     * Las características de producción
     * El país/región de origen del artista
   - El GÉNERO DE LA CANCIÓN ORIGINAL es el género principal del TYPE BEAT
   - NO uses BPM para determinar género - usa información real de internet


3. 🎹 SI HAY GÉNERO/TYPE BEAT ESPECIFICADO:
   - DEBE incluir el género exacto como tag principal
   - Incluye subgéneros relacionados
   - Incluye características típicas de ese género

4. 🎼 SI HAY KEY/ESCALA Y BPM:
   - DEBE incluir "{key}" como tag (ej: "C# Minor", "A Major")
   - DEBE incluir "{bpm} BPM" como tag (ej: "138 BPM")

5. 🎭 SI HAY MOOD HINT:
   - DEBE incluir el mood mencionado como tag

EJEMPLO COMPLETO:
Archivo: "Bad Bunny - Tití Me Preguntó TYPE BEAT - Am 95BPM Dark.mp3"

TAGS OBLIGATORIOS que DEBES incluir:
✓ "Bad Bunny" (artista)
✓ "Bad Bunny Type" (estilo del artista)
✓ "Tití Me Preguntó" (canción)
✓ "Reggaeton" (género conocido del artista)
✓ "Trap Latino" (subgénero del artista)
✓ "A Minor" (key del filename)
✓ "95 BPM" (bpm del filename)
✓ "Dark" (mood hint del filename)

TAGS ADICIONALES basados en conocimiento del artista:
✓ "Latin Urban"
✓ "Dembow"
✓ "Perreo"
✓ "Spanish Trap"
✓ "Commercial"
✓ "Puerto Rico"

╔═══════════════════════════════════════════════════════════════════════════════════════╗
║                      🔊 ANÁLISIS TÉCNICO DEL AUDIO (VALIDACIÓN)                       ║
╚═══════════════════════════════════════════════════════════════════════════════════════╝

DATOS DETECTADOS DEL ANÁLISIS DE AUDIO:
- BPM Detectado: {bpm}
- Tonalidad Detectada: {key}
- LUFS (Loudness): {lufs:.1f} dB
- Centroide Espectral: {spectral_centroid} Hz
- Rolloff Espectral: {spectral_rolloff} Hz
- Zero-Crossing Rate: {zcr:.4f}
- Progresión de Acordes: {' → '.join(chords[:4]) if chords else "No detectados"}
- Géneros Sugeridos por BPM: {suggested_genres}

INTERPRETACIÓN TÉCNICA:
- Brillo: {"⚡ Muy brillante/agudo (High-End/Crisp)" if spectral_centroid > 5000 else "🌑 Oscuro/profundo (Low-Pass/Dark)" if spectral_centroid < 2000 else "⚖️ Equilibrado"}
- Compresión: {"🔴 Muy comprimido/limitado (Loud Mix)" if lufs > -8 else "🟢 Dinámica preservada (Clean Mix)"}
- Energía: {"🔥 Alta energía/agresivo" if bpm > 140 else "⚡ Energía moderada" if bpm > 100 else "💤 Relajado/tranquilo"}

╔═══════════════════════════════════════════════════════════════════════════════════════╗
║                                  📋 INSTRUCCIONES FINALES                             ║
╚═══════════════════════════════════════════════════════════════════════════════════════╝

1. 🎭 GENERACIÓN DE MOOD (1-3 palabras descriptivas):
   - PRIORIZA el mood del artista de referencia si está en el nombre
   - Combina con análisis técnico
   - Ejemplos: "Dark & Atmospheric", "Energetic & Urban", "Melancholic & Introspectivo"
   
2. 🏷️  GENERACIÓN DE TAGS (MÍNIMO 15 TAGS, MÁXIMO 30 SI HAY MUCHA INFO):
   
   🌐 BÚSQUEDA WEB PARA ENRIQUECIMIENTO:
   Si hay artista mencionado → BUSCA EN INTERNET:
     * Artistas similares / colaboradores
     * Productores asociados al estilo
     * Movimientos musicales relacionados
     * Plataformas donde es popular (SoundCloud, Spotify, etc)
   
   ORDEN DE PRIORIDAD:
   
   TAGS OBLIGATORIOS (del nombre del archivo):
   1. Nombre del artista (si está)
   2. Nombre del artista + "Type" o "Style"
   3. Nombre de la canción (si está)
   4. Género principal del artista
   5. Key/Escala (ej: "C# Minor")
   6. BPM específico (ej: "138 BPM")
   7. Mood hint del filename
   8. Genre hint del filename
   
   TAGS ADICIONALES (basados en conocimiento + análisis):
   9. Subgéneros relacionados al artista
   10. Elementos de producción típicos del artista (808s, dembow, drill hi-hats, etc)
   11. Características de producción (dark, bright, heavy, clean, atmospheric)
   12. Mood/sentimiento emocional
   13. Características espectrales del análisis técnico
   14. Nivel de energía
   15. Uso recomendado (vocal ready, freestyle, instrumental)
   16. Referencias culturales/geográficas del artista (Latino, UK, Atlanta, etc)
   17. Era/período del artista si es relevante
   18. Colaboradores típicos del artista si aplica
   
   EJEMPLO REAL:
   Archivo: "Travis Scott - SICKO MODE TYPE BEAT - Gm 155BPM.mp3"
   
   Tags generados:
   ["Travis Scott", "Travis Scott Type", "SICKO MODE", "Trap", "Hip-Hop", 
    "G Minor", "155 BPM", "Dark", "Atmospheric", "Psychedelic Trap", 
    "Autotune Ready", "Houston", "Cactus Jack", "Heavy 808s", "Reversed Sounds",
    "Beat Switch", "High Energy", "Commercial", "Rage", "Astroworld"]

3. 📊 FORMATO DE SALIDA:
   Retorna SOLO JSON válido (sin ```json, sin markdown, sin explicaciones adicionales):
   
{{"mood": "Mood descriptivo aquí", "tags": ["tag1", "tag2", "tag3", ..., "tag15+"], "chord_progression": {chords}, "scale_explanation": "Breve explicación técnica considerando análisis + referencia artista si aplica"}}

🎯 RECUERDA: 
- Los tags del NOMBRE DEL ARCHIVO son OBLIGATORIOS y prioritarios
- USA tu conocimiento del artista/canción para generar tags MÁS PRECISOS
- BUSCA EN INTERNET para obtener artistas relacionados y tags adicionales
- MÍNIMO 15 tags, MÁXIMO 30 tags si tienes información abundante
- Artista, canción, key y BPM del filename DEBEN estar en los tags
- Cuanta más información encuentres en internet, más tags génera (hasta 30)

            Tags generados:
            ["Travis Scott", "Travis Scott Type", "SICKO MODE", "Trap", "Hip-Hop", 
             "G Minor", "155 BPM", "Dark", "Atmospheric", "Psychedelic Trap", 
             "Autotune Ready", "Houston", "Cactus Jack", "Heavy 808s", "Reversed Sounds",
             "Beat Switch", "High Energy", "Commercial", "Rage", "Astroworld"]
- Características técnicas de mezcla (Stereo, Mono, Spatial Audio)
- Ubicación geográfica / región musical
- Época o era musical
- Posibles usos (Streaming, TikTok, YouTube, Club, Radio)
- Certificaciones o logros del artista (Grammy, Chart, Platinum)
"""
        
        # Datos de IA (puede venir de Groq o Gemini)
        ai_data = None

        # 1) Groq como primario si está habilitado
        if USE_GROQ_PRIMARY:
            try:
                print(f"🚀 Usando Groq (Llama3) como primario", file=sys.stderr)
                print(f"📝 PROMPT ENVIADO A GROQ ({len(prompt)} caracteres):", file=sys.stderr)
                print("="*80, file=sys.stderr)
                print(prompt[:2000], file=sys.stderr)  # Primeros 2000 caracteres
                print(f"\n... (total {len(prompt)} caracteres) ...\n", file=sys.stderr)
                print("="*80, file=sys.stderr)
                response_text = call_groq_with_json(prompt)
                ai_data = json.loads(response_text)
                print(f"📦 RESPUESTA GROQ (JSON):", file=sys.stderr)
                print(json.dumps(ai_data, indent=2, ensure_ascii=False), file=sys.stderr)
                gemini_access = True  # Señal de que hubo IA
                gemini_status = "groq"
            except Exception as e:
                print(f"⚠️  Groq falló ({e}), intentando Gemini...", file=sys.stderr)

        # 2) Gemini (solo si no tenemos ai_data todavía)
        if ai_data is None:
            try:
                if use_web_search:
                    print(f"📡 Usando Gemini 2.0 Flash + búsqueda web", file=sys.stderr)
                    try:
                        # Intentar con herramienta de búsqueda si el SDK lo soporta
                        model = genai.GenerativeModel(
                            'gemini-2.0-flash',
                            tools=[genai.protos.Tool(google_search_retrieval=genai.protos.GoogleSearchRetrieval())]
                        )
                    except AttributeError:
                        print("ℹ️  Versión del SDK sin 'protos'; usando Gemini sin búsqueda web", file=sys.stderr)
                        model = genai.GenerativeModel('gemini-2.0-flash')
                else:
                    print(f"⚡ Usando Gemini Flash-lite sin búsqueda web", file=sys.stderr)
                    model = genai.GenerativeModel('gemini-2.0-flash-lite')

                response = model.generate_content(
                    prompt,
                    safety_settings=[
                        {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                        {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                        {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
                        {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"}
                    ]
                )
                response_text = response.text.strip()

                if use_web_search and ("search" in response_text.lower() or response.candidates[0].finish_reason == "STOP"):
                    print(f"🌐 Gemini usó búsqueda web para respuesta mejorada", file=sys.stderr)

                if '```json' in response_text:
                    response_text = response_text.split('```json')[1].split('```')[0].strip()
                elif '```' in response_text:
                    response_text = response_text.split('```')[1].split('```')[0].strip()

                ai_data = json.loads(response_text)
                gemini_access = True
                gemini_status = "ok"
            except Exception as e:
                if use_web_search and ("google_search" in str(e).lower() or "search" in str(e).lower()):
                    print(f"⚠️  Búsqueda web no disponible. Intentando sin búsqueda...", file=sys.stderr)
                    try:
                        model = genai.GenerativeModel('gemini-2.0-flash')
                        response = model.generate_content(prompt)
                        response_text = response.text.strip()
                        if '```json' in response_text:
                            response_text = response_text.split('```json')[1].split('```')[0].strip()
                        elif '```' in response_text:
                            response_text = response_text.split('```')[1].split('```')[0].strip()
                        ai_data = json.loads(response_text)
                        gemini_access = True
                        gemini_status = "ok"
                    except Exception as e2:
                        print(f"⚠️  Error en Gemini: {e2}. Usando inferencia local...", file=sys.stderr)
                        gemini_access = False
                        gemini_status = "error"
                        ai_data = infer_mood_local(technical_data)
                else:
                    print(f"⚠️  Error en Gemini: {e}. Usando inferencia local...", file=sys.stderr)
                    gemini_access = False
                    gemini_status = "error"
                    ai_data = infer_mood_local(technical_data)
        # Combinar tags obligatorios del filename con los de IA (camino exitoso)
        filename = technical_data.get('filename', '')
        # file_metadata ya fue calculado arriba
        mandatory_tags = extract_mandatory_tags_from_filename(file_metadata, technical_data)
        ai_tags = ai_data.get('tags', []) if isinstance(ai_data, dict) else []
        final_tags = merge_tags_with_priority(mandatory_tags, ai_tags, max_tags=25)

        print(f"📊 Tags obligatorios del filename: {mandatory_tags}", file=sys.stderr)
        print(f"🤖 Tags generados por IA: {ai_tags[:5]}...", file=sys.stderr)
        print(f"✅ Tags finales combinados: {len(final_tags)} tags", file=sys.stderr)
        
        # Actualizar ai_data con tags combinados y fuente
        ai_data['tags'] = final_tags
        ai_data['tags_source'] = "IA + Parser" if gemini_access else "Solo Parser"
        ai_data['gemini_access'] = gemini_access
        ai_data['gemini_status'] = gemini_status
        
        print(f"🎯 DATOS FINALES QUE SE RETORNAN AL CLIENTE:", file=sys.stderr)
        print(f"   - mood: {ai_data.get('mood')}", file=sys.stderr)
        print(f"   - genre: {ai_data.get('genre')}", file=sys.stderr)
        print(f"   - tags: {len(ai_data.get('tags', []))} tags", file=sys.stderr)
        print(f"   - gemini_access: {gemini_access}", file=sys.stderr)
        print(f"   - gemini_status: {gemini_status}", file=sys.stderr)
        
        return ai_data
    
    except Exception as e:
        # Fallback final: usar inferencia local
        print(f"❌ Error en infer_with_gemini: {e}", file=sys.stderr)
        ai_data = infer_mood_local(technical_data)
        
        # Aún en fallback, agregar tags obligatorios
        filename = technical_data.get('filename', '')
        file_metadata = extract_filename_metadata(filename)
        mandatory_tags = extract_mandatory_tags_from_filename(file_metadata, technical_data)
        ai_tags = ai_data.get('tags', [])
        final_tags = merge_tags_with_priority(mandatory_tags, ai_tags, max_tags=25)
        ai_data['tags'] = final_tags
        ai_data['tags_source'] = "Solo Parser"
        ai_data['gemini_access'] = False
        ai_data['gemini_status'] = "error"
        
        return ai_data

def infer_mood_local(technical_data):
    """
    Inferencia local de Mood y Tags basada en análisis técnico.
    No requiere API Key - fallback cuando Gemini no está disponible.
    """
    bpm = technical_data['bpm']
    key = technical_data['key']
    spectral_centroid = technical_data['spectral_centroid']
    lufs = technical_data.get('lufs', -20)
    chords = technical_data.get('chord_progression', [])
    
    is_minor = "Minor" in key
    
    # Lógica de Mood basada en características
    mood = "Neutral"
    
    if is_minor:
        if bpm < 80:
            mood = "Melancholic / Dark"
        elif bpm < 120:
            mood = "Sad / Introspective"
        else:
            mood = "Aggressive / Intense"
    else:
        if bpm < 80:
            mood = "Calm / Ambient"
        elif bpm < 120:
            mood = "Happy / Uplifting"
        else:
            mood = "Energetic / Positive"
    
    # Ajustar por brillo espectral
    if spectral_centroid < 2000:
        mood = mood.split(" / ")[0] + " / Dark"
    elif spectral_centroid > 5000:
        mood = mood + " / Bright"
    
    # Generar tags localmente - MÍNIMO 12 TAGS
    genre_base = classify_genre_by_bpm(bpm)
    genre_list = [g.strip() for g in genre_base.split(",")]
    
    # Características espectrales
    spectral_char = "Bright" if spectral_centroid > 5000 else "Dark" if spectral_centroid < 2000 else "Balanced"
    
    # Características dinámicas
    dynamic_char = "Compressed" if lufs > -8 else "Dynamic"
    
    # Energía
    energy_char = "High-Energy" if bpm > 140 else "Mid-Tempo" if bpm > 100 else "Relaxed"
    
    # Tipo de escala
    scale_char = "Minor" if is_minor else "Major"
    
    # Nota principal
    note = key.split()[0]
    
    # Lista extendida de tags (mínimo 12)
    tags = [
        genre_list[0] if genre_list else "Beat",  # Género principal
        genre_list[1] if len(genre_list) > 1 else "Electronic",  # Subgénero
        f"{note} Key",  # Tonalidad
        scale_char,  # Escala
        mood.split(" / ")[0],  # Primer componente del mood
        spectral_char,  # Brillo
        dynamic_char,  # Compresión
        energy_char,  # Energía
        f"{int(bpm)} BPM",  # BPM exacto
        "Production-Ready",  # Estado
        "AI-Analyzed",  # Procesamiento
        f"{note}{scale_char[0]}",  # Nota+escala abreviado (Am, C#maj, etc)
    ]
    
    # Agregar características adicionales basadas en análisis
    if spectral_centroid > 7000:
        tags.append("Crisp")
    if lufs < -18:
        tags.append("Natural-Dynamics")
    if bpm < 70:
        tags.append("Meditative")
    elif bpm > 150:
        tags.append("Intense")
    
    # Garantizar mínimo 10 tags únicos
    tags = list(dict.fromkeys(tags))  # Remover duplicados manteniendo orden
    tags = tags[:20]  # Máximo 20 tags
    
    # Generar explicación de escala
    scale_explanation = generate_scale_explanation(key, spectral_centroid, bpm)
    
    return {
        "mood": mood,
        "tags": tags,
        "chord_progression": chords,
        "scale_explanation": scale_explanation
    }


# =====================================================
# NUEVAS FUNCIONES - SISTEMA MEJORADO V2
# =====================================================

def suggest_key_from_notes(detected_notes, chroma_values):
    """Sugiere escala musical basada en notas detectadas."""
    note_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    root_idx = np.argmax(chroma_values)
    root_note = note_names[root_idx]
    
    third_major_idx = (root_idx + 4) % 12
    third_minor_idx = (root_idx + 3) % 12
    
    major_strength = chroma_values[third_major_idx]
    minor_strength = chroma_values[third_minor_idx]
    
    scale_type = "Minor" if minor_strength > major_strength else "Major"
    return f"{root_note} {scale_type}"


def analyze_audio_technical_simple(audio_path):
    """Análisis técnico simplificado del audio."""
    try:
        y, sr = librosa.load(audio_path, sr=22050, duration=30)
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        note_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        
        chroma_mean = np.mean(chroma, axis=1)
        top_notes_idx = np.argsort(chroma_mean)[-5:]
        detected_notes = [note_names[idx] for idx in top_notes_idx]
        
        suggested_key = suggest_key_from_notes(detected_notes, chroma_mean)
        
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        calculated_bpm = int(tempo)
        
        chord_progression = []
        frames_per_section = chroma.shape[1] // 4
        for i in range(4):
            start = i * frames_per_section
            end = start + frames_per_section
            section_chroma = np.mean(chroma[:, start:end], axis=1)
            root_idx = np.argmax(section_chroma)
            chord_progression.append(note_names[root_idx])
        
        return {
            "detected_notes": detected_notes,
            "chord_progression": chord_progression,
            "suggested_key": suggested_key,
            "suggested_key_confidence": 50,
            "calculated_bpm": calculated_bpm,
            "calculated_bpm_confidence": 50
        }
    except Exception as e:
        print(f"⚠️  Error análisis técnico: {e}", file=sys.stderr)
        return {
            "detected_notes": [],
            "chord_progression": [],
            "suggested_key": None,
            "suggested_key_confidence": 0,
            "calculated_bpm": None,
            "calculated_bpm_confidence": 0
        }


def determine_mood_genre_by_bpm_key(bpm, key):
    """Determina mood y género probable por BPM y KEY."""
    mood = "Unknown"
    genre = "Unknown"
    
    if bpm and key:
        # Determinar mood por KEY
        if "Minor" in key or "m" in key.lower():
            mood = "Dark"
        else:
            mood = "Uplifting"
        
        # Determinar género por BPM
        if 60 <= bpm < 90:
            genre = "Hip-Hop/Trap"
        elif 90 <= bpm < 110:
            genre = "Lo-Fi/Chill"
        elif 110 <= bpm < 128:
            genre = "Pop/R&B"
        elif 128 <= bpm < 140:
            genre = "House/Dance"
        elif 140 <= bpm <= 160:
            genre = "Trap/Dubstep"
        elif 160 < bpm <= 180:
            genre = "Drum & Bass"
        else:
            genre = "Electronic"
    
    return mood, genre


def query_gemini_with_full_context(filename, parsed_data, audio_analysis):
    """Consulta Gemini API con contexto completo. OPTIMIZADO PARA MULTI-ARTISTAS.
    
    ⚠️  NUEVA ESTRATEGIA:
    - Envía el FILENAME COMPLETO a Groq para que detecte TODOS los artistas
    - Genera 20-30 tags por beat (doble de lo anterior)
    - Soporta análisis de múltiples artistas en colaboraciones
    - Tags más ricos y contextuales por artista
    
    TAGS de Gemini (15-20 PRINCIPALES):
    ✅ Mood, Estilo de cada artista, Subgéneros, Vibe único, Referencias culturales
    
    TAGS automáticos (5-10):
    ✅ BPM, KEY, Técnicos
    
    Total: 20-30 tags finales
    """
    
    print(f"📄 Filename completo enviado a Groq: {filename}", file=sys.stderr)
    print(f"🔄 Groq analizará y detectará TODOS los artistas del filename", file=sys.stderr)
    
    if not GEMINI_API_KEY or GEMINI_API_KEY in ['empty', 'tu_api_key_aqui']:
        return {
            "key": audio_analysis.get('suggested_key'),
            "key_confidence": 50,
            "key_validated": False,
            "artist_known": False,
            "artist_info": None,
            "mood": "Unknown",
            "type": "Beat",
            "genre": "Unknown",
            "subgenres": [],
            "tags": [],
            "description": ""
        }
    
    try:
        # Determinar mood/genre automático por BPM y KEY
        auto_mood, auto_genre = determine_mood_genre_by_bpm_key(
            parsed_data.get('bpm') or audio_analysis.get('calculated_bpm'),
            parsed_data.get('key') or audio_analysis.get('suggested_key')
        )
        
        prompt = f"""Eres un experto en TODOS los géneros musicales: hip-hop, trap, R&B, pop, reggaeton, trap latino, drill, etc.

📁 BEAT ANALYSIS REQUEST:
📄 FILENAME COMPLETO: "{filename}"

⚠️ INSTRUCCIONES CRÍTICAS:
1) Analiza el FILENAME COMPLETO y DETECTA TODOS los artistas mencionados
   - Busca separadores: "x", "feat", "ft", "&", "+", ","
   - Identifica CADA artista individualmente
   - Si encuentras múltiples artistas (ej: "Pop Smoke x Travis Scott"), analiza AMBOS

2) PARA CADA ARTISTA DETECTADO:
   - SI lo conoces → Proporciona info REAL: género, país/ciudad, estilo, label, colaboradores frecuentes
   - SI NO lo conoces → Marca artist_known=false para ESE artista específico
   - NO inventes información ni sustituyas con artistas similares

3) DETECTA TAMBIÉN del filename:
   - BPM (números entre 60-200)
   - Key/Tonalidad (ej: "E Major", "C# Minor", "Amin")
   - Género hints ("drill", "trap", "reggaeton", etc.)
   - Mood hints ("dark", "melodic", "aggressive", etc.)

4) Retorna SOLO JSON válido, sin markdown, sin texto extra

🎯 TAREA:
1. 🎤 IDENTIFICA AL ARTISTA ESPECÍFICO MENCIONADO:
   
   EJEMPLOS DE ARTISTAS Y SUS GÉNEROS REALES:
   - Kanye West = Hip-Hop/Rap (Chicago, USA)
   - Drake = Hip-Hop/R&B (Toronto, Canada)
   - Travis Scott = Hip-Hop/Trap (Houston, USA)
   - Bryson Tiller = R&B/Trap Soul (Louisville, USA)
   - Bad Bunny = Trap Latino/Reggaeton (Puerto Rico)
   - Anuel AA = Trap Latino (Puerto Rico)
   - Feid = Reggaeton/Urban (Colombia)
   - Cro = Hip-Hop/Rap (Alemania)
   - Franky Style = Hip-Hop/Rap/Reggaeton (Lituania)
   
   ⚠️ REGLA DE ORO:
   - Si el artista es americano/europeo → Hip-Hop, Trap, R&B, Pop, Drill
   - Si el artista es latino (Puerto Rico, Colombia, etc.) → Trap Latino, Reggaeton
   - Si NO conoces al artista → Marca artist_known=false, género="Unknown", NO inventes

2. 🔍 VALIDA LA KEY: {parsed_data.get('key') or audio_analysis.get('suggested_key')}

3. 🏷️ TAGS RICOS Y CONTEXTUALES (20-30 TAGS OBLIGATORIOS):
    - Devuelve entre 20 y 30 tags ORIGINALES, específicos y variados
    - PARA CADA ARTISTA DETECTADO (si hay múltiples):
        ✅ Nombre del artista
        ✅ "[Artista] Type Beat" o "[Artista] Style"
        ✅ Género principal y subgéneros
        ✅ País/ciudad/escena (ej: "New York Drill", "Atlanta Trap", "Buenos Aires Trap")
        ✅ Label/movimiento (ej: "Cactus Jack", "OVO Sound", "Real Hasta la Muerte")
        ✅ Colaboradores frecuentes del artista
        ✅ Rasgos técnicos distintivos (ej: "808 Glides", "Autotune melódico", "Hi-hats triplet")
        ✅ Referencias culturales/época (ej: "2020s Drill", "Latin Urban Wave", "Brooklyn Sound")
    
    - Si hay MÚLTIPLES ARTISTAS (ej: Pop Smoke x Travis Scott):
        → Genera tags para AMBOS artistas
        → Incluye tags de fusión (ej: "NY Drill x Houston Trap", "East Coast x South")
        → Suma estilos (ej: "Dark Drill meets Psychedelic Trap")
    
    - Incluye siempre:
        ✅ Descriptores de producción específicos (no genéricos)
        ✅ Mood calificado (ej: "Dark Aggressive", "Melodic Melancholic")
        ✅ Elementos técnicos del filename (BPM hints, genre hints)
    
    🚫 PROHIBIDOS: "Music", "Audio", "Beat" solo, "Instrumental" genérico, "Unknown", "N/A", "Track", "Song", adjetivos vacíos sin contexto.

4. 📝 DESCRIPCIÓN:
   - SI conoces al artista: menciona SU estilo característico
   - SI NO lo conoces: descripción genérica basada en características técnicas

📏 FORMATO JSON OBLIGATORIO:
{{
    "key": "X Minor/Major",
    "key_confidence": 0-100,
    "key_validated": true/false,
    "artists": [
        {{
            "name": "Nombre Artista",
            "known": true/false,
            "genre": "...",
            "subgenres": ["..."],
            "origin": "pais/ciudad",
            "label": "...",
            "style": "..."
        }}
    ],
    "artist_known": true/false,
    "artist_info": {{"genre":"...", "subgenres":["..."], "style":"...", "origin":"pais/ciudad", "label":"..."}},
    "mood": "...",
    "type": "{parsed_data.get('beat_type') or 'Beat'}",
    "genre": "...",
    "subgenres": ["..."],
    "tags": ["tag1", "tag2", ..., "tag20-30"],
    "description": "...",
    "confidence": {{"artist_identification": 0-100, "genre_assignment": 0-100, "tags_quality": 0-100}}
}}

EJEMPLO CORRECTO - Artista Conocido (Cro):
- artist_known: true
- Genre: "Hip-Hop" 
- Subgenres: ["Rap", "German Hip-Hop"]
- Tags: ["Cro", "Cro Type Beat", "Hip-Hop", "German Rap", "Alemania", "Rap Consciente"]
- Description: "Estilo de Cro con elementos de hip-hop alemán consciente..."

EJEMPLO CORRECTO - Artista Desconocido:
- artist_known: false
- Genre: "Unknown"
- Tags: ["Artist Name", "Type Beat", "Hip-Hop Style", "Urban"]
- Description: "Beat con características urbanas. Producción versátil para flows diversos."

EJEMPLO INCORRECTO ❌:
- Filename dice "Franky Style" pero respondes sobre "J Balvin" → MAL
- NO conoces al artista pero inventas uno similar → MAL

📋 RETORNA JSON:
- Genre: "Trap Latino" (NO "Pop")
- Subgenres: ["Reggaeton", "Latin Trap", "Urban Latino"]
- Tags: ["Anuel AA", "Anuel AA Type", "Real Hasta la Muerte", "Puerto Rico", "Trap Latino", "Street", "Dark", "Aggressive", "808s Heavy", "Latin Urban", "Dembow Elements"]
- Description: "Estilo característico de Anuel AA con elementos de trap latino y reggaeton. Producción dark y agresiva con 808s pesados, perfecto para letras de calle y estilo Real Hasta la Muerte."

📋 RETORNA EXACTAMENTE ESTE JSON (sin ```json, sin markdown):
{{
  "key": "X Minor/Major",
  "key_confidence": 95,
  "key_validated": true,
  "artist_known": true/false,
  "artist_info": {{"genre":"GÉNERO REAL", "subgenres":["subgenre1", "subgenre2"], "style":"estilo característico"}},
  "mood": "Dark/Energetic/Melancholic/etc",
  "type": "{parsed_data.get('beat_type') or 'Beat'}",
  "genre": "GÉNERO PRINCIPAL REAL DEL ARTISTA",
  "subgenres": ["subgenre1", "subgenre2"],
    "tags": ["tag1", "tag2", ..., "tag12-15"],
  "description": "Descripción de 2-3 líneas"
}}"""
        
        # 🚀 Intentar con Groq primero si está habilitado
        response_text = None
        if USE_GROQ_PRIMARY:
            try:
                print(f"🚀 V2: Usando Groq (Llama3) como primario", file=sys.stderr)
                response_text = call_groq_with_json(prompt)
                print(f"✅ Groq respondió exitosamente", file=sys.stderr)
                print(f"📄 Groq response (primeros 300 chars): {response_text[:300]}", file=sys.stderr)
            except Exception as e:
                print(f"⚠️  Groq falló ({e}), intentando Gemini...", file=sys.stderr)
                response_text = None
        
        # Si Groq falló o no está habilitado, evaluar fallback
        if response_text is None:
            skip_fallback = os.getenv("SKIP_GEMINI_FALLBACK", "0") == "1"
            if skip_fallback:
                print(f"⚠️  Fallback Gemini omitido (SKIP_GEMINI_FALLBACK=1)", file=sys.stderr)
                raise Exception("Gemini fallback omitido por configuración")
            print(f"📡 V2: Usando Gemini como fallback", file=sys.stderr)
            response_text = call_gemini_with_fallback(prompt, model_name='gemini-2.0-flash-lite')
            print(f"📄 Gemini response (primeros 200 chars): {response_text[:200]}", file=sys.stderr)
        
        if '```json' in response_text:
            response_text = response_text.split('```json')[1].split('```')[0].strip()
        elif '```' in response_text:
            response_text = response_text.split('```')[1].split('```')[0].strip()
        
        result = json.loads(response_text)
        print(f"✅ JSON parseado correctamente", file=sys.stderr)
        
        return result
    except Exception as e:
        print(f"⚠️  Gemini error: {e}", file=sys.stderr)
        print(f"⚠️  Error type: {type(e).__name__}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        # Fallback con mood/genre automático
        auto_mood, auto_genre = determine_mood_genre_by_bpm_key(
            parsed_data.get('bpm') or audio_analysis.get('calculated_bpm'),
            parsed_data.get('key') or audio_analysis.get('suggested_key')
        )
        return {
            "key": audio_analysis.get('suggested_key'),
            "key_confidence": 50,
            "key_validated": False,
            "artist_known": False,
            "artist_info": None,
            "mood": auto_mood,
            "type": "Beat",
            "genre": auto_genre,
            "subgenres": [],
            "tags": [],
            "description": ""
        }


def extract_artist_from_ai_tags(ai_tags):
    """Encuentra el artista principal desde los tags devueltos por IA."""
    for tag in ai_tags or []:
        if not isinstance(tag, str):
            continue
        clean = tag.strip()
        match = re.match(r"(.+?)\s+(?:type\s+beat|type|style)$", clean, flags=re.IGNORECASE)
        candidate = match.group(1).strip() if match else clean
        if not candidate:
            continue
        lower = candidate.lower()
        if lower in {"hip-hop", "trap", "drill", "reggaeton", "beat", "instrumental", "unknown"}:
            continue
        if re.search(r"\b(bpm|major|minor)\b", lower):
            continue
        return candidate
    return None


def generate_auto_tags(parsed_data, audio_analysis, gemini_analysis, bpm, key):
    """Genera tags automáticos inteligentes basados en todos los datos.
    PRIORIZA tags de IA (Groq/Gemini) sobre tags genéricos."""
    tags = set()

    # 🚀 PRIORIDAD 1: TAGS DE IA (GROQ/GEMINI) - Los más importantes
    ai_tags_raw = gemini_analysis.get('tags', [])
    if ai_tags_raw:
        print(f"✅ Agregando {len(ai_tags_raw)} tags de IA: {ai_tags_raw[:5]}...", file=sys.stderr)
        for tag in ai_tags_raw:
            if tag and isinstance(tag, str) and len(tag) > 1:
                tags.add(tag)

    # 🎤 PRIORIDAD 2: ARTISTA (prioriza lo que Groq detectó en tags)
    ai_artist = extract_artist_from_ai_tags(ai_tags_raw or [])
    reference_artist = ai_artist
    if not reference_artist and not ai_tags_raw:
        reference_artist = parsed_data.get('reference_artist')
    if reference_artist and reference_artist not in tags:
        tags.add(reference_artist)
        tags.add(f"{reference_artist} Type Beat")
        tags.add(f"{reference_artist} Style")

    # 🎹 PRIORIDAD 3: KEY y BPM (técnicos obligatorios)
    if key:
        tags.add(key)  # "E Minor" completo
        key_short = key.split()[0]  # "D Minor" -> "D"
        # Mantener solo formas compactas útiles, evitar "Minor/Major" sueltos
        if "Minor" in key:
            tags.add(f"{key_short}m")
        else:
            tags.add(key_short)

    # BPM (solo el valor, sin tags genéricos que diluyen)
    if bpm:
        tags.add(f"{bpm}BPM")
        # Rangos amplios solo si NO hay tags de IA
        if not ai_tags_raw:
            tags.add(f"{int(bpm/10)*10} BPM")

    # 📦 PRIORIDAD 4: METADATOS DEL ARCHIVO (útiles pero no críticos)
    """
    Sistema de combinación y refinamiento de tags con prioridad IA y
    deduplicación semántica básica.

    Prioridad:
    1) IA (Groq/Gemini)
    2) Artista(s) y colaboradores del filename
    3) Técnicos (KEY, BPM, 808s, Autotune)

    Mejoras:
    - Normaliza mayúsculas/minúsculas
    - Dedup por raíces conocidas (e.g., 'Trap Latino' ~ 'Latin Trap')
    - Filtra adjetivos genéricos si hay IA fuerte
    - Limita a 30, ordenado por categoría
    """

    def norm(t):
        return re.sub(r"\s+", " ", t).strip()

    raw_ai = gemini_analysis.get('tags', []) or []
    ai_tags = [norm(t) for t in raw_ai if isinstance(t, str) and t.strip()]
    # Normalizar etiquetas "Type" a "Type Beat"
    ai_tags = [re.sub(r"(?i)\\btype\\b$", "Type Beat", t) for t in ai_tags]

    filename_artists = []
    if parsed_data.get('artist') and not ai_artist:
        filename_artists.append(parsed_data['artist'])
    for c in parsed_data.get('collabs', []) or []:
        if not ai_artist:
            filename_artists.append(c)
    filename_artists = [norm(t) for t in filename_artists if t]

    technical = []
    if key and key != 'Unknown':
        technical.append(norm(key))
    if bpm and 60 <= bpm <= 200:
        technical.append(f"{int(bpm)}BPM")
    if audio_analysis.get('has_808'):
        technical.append('808s')
    if audio_analysis.get('has_autotune'):
        technical.append('Autotune')

    # Bloqueo de genéricos que diluyen IA
    generic_blocklist = {
        # Placeholders y genéricos vacíos
        "Unknown", "Unknown Artist", "N/A", "N/A Movement", "N/A Label", "N/A Country",
        # Palabras demasiado genéricas sin calificador
        "Music", "Audio", "Beat", "Track", "Song", "Type", "Style", "Instrumental", "Urban",
        # Adjetivos poco informativos
        "Medium", "Smooth", "Generic",
        # Evitar duplicados sin contexto
        "Trap Latino Type"
    }

    # Si la IA no conoce al artista, ampliar el bloqueo de genéricos
    if not gemini_analysis.get('artist_known', False):
        generic_blocklist.update({
            "Trap Latino", "Reggaeton", "Latin Urban", "Dark", "Aggressive", "808s Heavy", "Street"
        })

    # Mapa semántico simple para dedup
    semantic_groups = [
        {"Trap Latino", "Latin Trap"},
        {"Hip-Hop", "Rap"},
        {"Reggaeton", "Reguetón"},
        {"R&B", "Rhythm and Blues"}
    ]

    def dedup_semantic(tags):
        s = []
        seen = set()
        for t in tags:
            if t in generic_blocklist:
                continue
            rep = t
            for grp in semantic_groups:
                if t in grp:
                    rep = sorted(grp)[0]
                    break
            if rep not in seen:
                seen.add(rep)
                s.append(rep)
        return s

    ai_tags = dedup_semantic(ai_tags)

    # Si se conoce al artista, evitar géneros base sin calificador; transformar a versiones calificadas
    if gemini_analysis.get('artist_known', False):
        base_genres = {"Hip-Hop", "Trap", "Rap", "Reggaeton", "Trap Latino", "Latin Trap", "Urban Latino", "R&B", "Pop", "Drill"}
        artist_info = gemini_analysis.get('artist_info') or {}
        origin = artist_info.get('origin') or ''
        origin_simple = origin.split(',')[-1].strip() if origin else ''
        style = artist_info.get('style') or ''
        transformed = []
        for t in ai_tags:
            if t in base_genres:
                if origin_simple:
                    transformed.append(f"{t} {origin_simple}")
                # Evitar dejar el género plano sin calificador
                if style and style not in transformed:
                    transformed.append(style)
            else:
                transformed.append(t)
        ai_tags = dedup_semantic(transformed)

    # Añadir artistas del filename solo si IA no aportó uno
    combined = []
    combined.extend(ai_tags)
    for a in filename_artists:
        if a and a not in combined:
            combined.append(a)

    # Añadir técnicos
    for t in technical:
        if t and t not in combined:
            combined.append(t)

    # Si IA está vacía, permitir algunos descriptores suaves del parser
    if not ai_tags:
        soft = parsed_data.get('soft_descriptors', []) or []
        for s in soft[:5]:
            s = norm(s)
            if s and s not in combined and s not in generic_blocklist:
                combined.append(s)

    # Orden: IA → Artistas → Técnicos → Suaves
    order = {t: 0 for t in ai_tags}
    for a in filename_artists:
        order.setdefault(a, 1)
    for t in technical:
        order.setdefault(t, 2)

    combined_sorted = sorted(combined, key=lambda x: order.get(x, 3))
    # Filtrado final extra para evitar etiquetas vacías o genéricas prohibidas
    def is_allowed_tag(t):
        # Bloquear exactos genéricos
        if t in generic_blocklist:
            return False
        # Bloquear "Type Beat" sin artista
        if t.strip().lower() == "type beat":
            return False
        # Bloquear "Style" suelto
        if t.strip().lower() == "style":
            return False
        return True

    filtered = [t for t in combined_sorted if is_allowed_tag(t)]
    # Asegurar mínimo de 20 tags originales; si faltan, enriquecer con técnicos/calificadores del filename y artistas
    if len(filtered) < 20:
        # Calificadores simples desde filename y contexto
        extras = []
        title = parsed_data.get('beat_name') or parsed_data.get('title') or ''
        if title:
            extras.append(title)
        
        # Extraer info de múltiples artistas desde gemini_analysis
        artists_array = gemini_analysis.get('artists', [])
        for artist_info in artists_array:
            artist_name = artist_info.get('name')
            if artist_name and artist_name not in filtered:
                extras.append(artist_name)
                extras.append(f"{artist_name} Type Beat")
            origin = artist_info.get('origin')
            if origin:
                extras.append(origin)
            label = artist_info.get('label')
            if label:
                extras.append(label)
        
        # Derivar ciudad/label si aparece en tags AI
        for t in ai_tags:
            if any(city in t.lower() for city in ['atlanta', 'madrid', 'houston', 'new york', 'brooklyn', 'miami', 'buenos aires']):
                extras.append(t)
            if any(label in t.lower() for label in ['brick squad', 'real hasta la muerte', 'cactus jack', 'ovo', 'dreamville']):
                extras.append(t)
        
        # Técnicos adicionales
        if bpm and 60 <= bpm <= 200:
            extras.append(f"{int(bpm)} BPM")
            # Rangos BPM descriptivos
            if bpm < 80:
                extras.append('Slow Tempo')
            elif 80 <= bpm < 100:
                extras.append('Lo-fi Tempo')
            elif 140 <= bpm < 160:
                extras.append('High Energy Tempo')
        
        if key and key != 'Unknown':
            extras.append(key)
            # Añadir mood de la tonalidad
            if 'Minor' in key:
                extras.append('Minor Key Melancholy')
            else:
                extras.append('Major Key Bright')
        
        # Producción específica con calificador
        extras.extend([
            'Hi-hats triplet bounce',
            'Sub 808 deep glide',
            'Melodic minor phrasing',
            'Syncopated drums pattern',
            'Reverb-heavy atmosphere',
            'Layered vocal samples',
            'Hard-hitting kicks',
            'Rolling bassline',
            'Ambient pads texture'
        ])
        
        for e in extras:
            if e and e not in filtered and e not in generic_blocklist:
                filtered.append(e)
            if len(filtered) >= 25:
                break

    final = filtered[:30]  # Limitar máximo a 30
    print(f"🏷️ Tags finales: total={len(final)} IA={len(ai_tags)} artists={len(filename_artists)} tech={len(technical)}", file=sys.stderr)
    return final

def build_autofill_from_filename(filename_info):
    """
    Construye un autofill inteligente solo desde el nombre del archivo.
    Entradas esperadas (output de parser mejorado):
      filename_info = {
        'artist': 'Swae Lee x Feid',
        'collabs': ['Swae Lee','Feid'],
        'bpm': 95,
        'key': 'E Minor',
        'type': 'Beat',
        'mood_hint': 'Melodic',
        'genre_hint': ['Trap Latino','Reggaeton']
      }
    """
    data = {}
    artist = filename_info.get('artist')
    collabs = filename_info.get('collabs') or []
    bpm = filename_info.get('bpm')
    key = filename_info.get('key')
    mood = filename_info.get('mood_hint')
    genre_hint = filename_info.get('genre_hint') or []

    if artist:
        data['artist'] = artist
    if collabs:
        data['collaborators'] = collabs
    if bpm:
        data['bpm'] = bpm
    if key:
        data['key'] = key
    if mood:
        data['mood'] = mood
    if genre_hint:
        data['genre'] = genre_hint[0]
        data['subgenres'] = genre_hint[1:]

    # Tags mínimos desde filename
    tags = []
    for c in collabs:
        tags.append(c)
    if key:
        tags.append(key)
    if bpm:
        tags.append(f"{int(bpm)}BPM")
    for g in genre_hint:
        tags.append(g)
    if mood:
        tags.append(mood)

    data['tags_from_filename'] = list(dict.fromkeys(tags))[:15]
    return data


def normalize_key_str(key_str: str):
    """Normaliza representaciones de tonalidad a forma estándar (e.g., 'C# Minor')."""
    if not key_str:
        return None
    s = key_str.strip().lower()
    # Reemplazar palabras sharp/flat
    s = s.replace('sharp', '#').replace('flat', 'b')
    s = re.sub(r"\s+", " ", s)
    # Capturar nota + modo
    m = re.match(r"^([a-g](?:#|b)?)\s*(major|minor|maj|min|m)$", s)
    if not m:
        return None
    root = m.group(1).upper()
    mode_raw = m.group(2)
    mode = 'Major' if mode_raw in ['major', 'maj'] else 'Minor'
    return f"{root} {mode}"

def safe_parse_filename(name: str):
    """Parser robusto para extraer metadata de nombres de archivo sin formato fijo.
    Detecta: artista(s), género/canción, type beat, BPM, key, demo/master/free/tagged.
    Ignora marcadores comunes: [free], (free), [demo], (demo), [Master], (Master), etc.
    """
    try:
        # Remover extensión
        name_clean = re.sub(r'\.(mp3|wav|flac|m4a|ogg)$', '', name, flags=re.IGNORECASE)
        
        info = {
            'artist': None,
            'collabs': [],
            'title': None,
            'bpm': None,
            'key': None,
            'type': 'Beat',
            'mood_hint': None,
            'genre_hint': [],
            'is_demo': False,
            'is_tagged': False
        }
        
        # Detectar flags antes de limpiar
        name_lower = name_clean.lower()
        info['is_demo'] = bool(re.search(r'\[?(demo|free)\]?', name_lower))
        info['is_tagged'] = bool(re.search(r'\[?tagged\]?', name_lower))
        if 'type beat' in name_lower:
            info['type'] = 'Type Beat'
        elif 'instrumental' in name_lower:
            info['type'] = 'Instrumental'
        
        # Buscar BPM en todo el nombre (60-200)
        m_bpm = re.search(r'\b(\d{2,3})(?:\s?bpm)?\b', name_clean, flags=re.IGNORECASE)
        if m_bpm:
            bpm_candidate = int(m_bpm.group(1))
            if 60 <= bpm_candidate <= 200:
                info['bpm'] = bpm_candidate
        
        # Buscar Key (con sharp/bemol + Major/Minor/m)
        m_key = re.search(
            r'\b([A-G](?:#|b|♯|♭)?)\s?(?:(Major|Minor|maj|min|m(?!\w)))\b',
            name_clean,
            flags=re.IGNORECASE
        )
        if not m_key:
            # Forma escrita: "C sharp minor" / "Db major"
            m_key = re.search(
                r'\b([A-G])\s+(sharp|flat)\s+(major|minor)\b',
                name_clean,
                flags=re.IGNORECASE
            )
            if m_key:
                note = m_key.group(1).upper()
                acc = '#' if m_key.group(2).lower() == 'sharp' else 'b'
                qual = m_key.group(3).lower()
                name_clean = re.sub(r'\b([A-G])\s+(sharp|flat)\s+(major|minor)\b', f"{note}{acc} {qual}", name_clean, flags=re.IGNORECASE)
        if m_key:
            root = m_key.group(1).replace('♯', '#').replace('♭', 'b')
            quality = m_key.group(2).lower()
            if quality in ['major', 'maj']:
                info['key'] = f"{root} Major"
            elif quality in ['minor', 'min', 'm']:
                info['key'] = f"{root} Minor"
        
        # Limpiar marcadores para el parseo de artistas/título
        clean_for_parse = re.sub(
            r'\[?(free|demo|master|tagged|copyright)\]?',
            '',
            name_clean,
            flags=re.IGNORECASE
        )
        clean_for_parse = re.sub(r'\s+', ' ', clean_for_parse).strip()
        
        # Estrategia: buscar "Type Beat" o "Instrumental" y separar artistas del resto
        type_match = re.search(r'\b(type\s+beat|instrumental)\b', clean_for_parse, flags=re.IGNORECASE)
        artist_section = clean_for_parse
        title_section = None
        
        if type_match:
            # Todo ANTES de "Type Beat" es la sección de artistas
            artist_section = clean_for_parse[:type_match.start()].strip()
            # Lo que viene DESPUÉS puede ser el título
            after_type = clean_for_parse[type_match.end():].strip()
            if after_type and after_type.startswith('-'):
                after_type = after_type[1:].strip()
            if after_type:
                title_section = after_type
        else:
            # Sin "Type Beat", usar separador '-' tradicional
            parts = [p.strip() for p in re.split(r'\s*-\s*', clean_for_parse) if p.strip()]
            if parts:
                artist_section = parts[0]
                if len(parts) > 1:
                    title_section = parts[1]
        
        # Extraer artistas de artist_section
        if artist_section:
            # Separadores: x, ft, feat, &, +, ,
            artists = [
                a.strip() 
                for a in re.split(r'\s*(?:\bx\b|\bft\.?\b|\bfeat\.?\b|&|\+|,)\s*', artist_section, flags=re.IGNORECASE)
                if a.strip() and len(a.strip()) > 1 and not re.match(r'^\d+$', a.strip())
            ]
            
            # Filtrar palabras genéricas
            valid_artists = [
                art for art in artists 
                if art.lower() not in ['type', 'beat', 'instrumental', 'prod', 'free', 'demo', 'master', '']
            ]
            
            if valid_artists:
                info['artist'] = valid_artists[0]
                info['collabs'] = valid_artists
            
            # Extraer título si existe
            if title_section:
                # Remover BPM y Key residuales
                title_candidate = re.sub(r'\b\d{2,3}(?:\s?bpm)?\b', '', title_section, flags=re.IGNORECASE)
                title_candidate = re.sub(r'\b[A-G](?:#|b)?\s?(?:Major|Minor|maj|min|m)\b', '', title_candidate, flags=re.IGNORECASE)
                title_candidate = re.sub(r'\s+', ' ', title_candidate).strip()
                if title_candidate and title_candidate.lower() not in ['type', 'beat', 'type beat']:
                    info['title'] = title_candidate
        
        return info
    except Exception as e:
        return {
            'artist': None,
            'collabs': [],
            'title': None,
            'bpm': None,
            'key': None,
            'type': 'Beat',
            'mood_hint': None,
            'genre_hint': [],
            'is_demo': False,
            'is_tagged': False
        }

def merge_autofill_into_result(result: dict, filename: str):
    """Integra autofill derivado del filename dentro del JSON final del endpoint.
    No sobrescribe campos existentes de IA; solo completa vacíos y agrega tags complementarios.
    ⚠️ PROTEGE reference_artist: no lo sobrescribe si ya existe desde IA
    """
    info = safe_parse_filename(filename)
    auto = build_autofill_from_filename(info)

    # Solo BPM/KEY como autofill; no sobrescribir artista/título/genre.
    if not result.get('bpm') and auto.get('bpm'):
        result['bpm'] = auto['bpm']
    if (not result.get('key') or result.get('key') == 'Unknown') and auto.get('key'):
        result['key'] = auto['key']
    
    # ⚠️ NUNCA sobrescribir reference_artist si ya fue establecido por IA
    # El reference_artist desde Groq (incluso si es múltiple) es definitivo
    if not result.get('reference_artist') and auto.get('reference_artist'):
        result['reference_artist'] = auto['reference_artist']

    # Combinar tags del filename sin diluir IA (solo técnicos siempre)
    fn_tags = auto.get('tags_from_filename', []) or []
    existing_tags = result.get('tags', []) or []
    technical_fn_tags = []
    for tag in fn_tags:
        if re.match(r"^\d{2,3}\s?BPM$", tag, flags=re.IGNORECASE):
            technical_fn_tags.append(tag)
            continue
        if re.match(r"^[A-G](?:#|b)?\s?(?:Major|Minor|maj|min|m)$", tag, flags=re.IGNORECASE):
            technical_fn_tags.append(tag)
    fn_tags = technical_fn_tags
    combined = list(dict.fromkeys(existing_tags + fn_tags))
    result['tags'] = combined[:30]

    # Marcar fuente
    sources = result.get('sources', {})
    sources['filename_autofill'] = True
    if info.get('key'):
        sources['key_source'] = 'filename'
    if info.get('bpm'):
        sources['bpm_source'] = 'filename'
    result['sources'] = sources
    return result


def combine_all_analysis(parsed_data, audio_analysis, gemini_analysis):
    """Combina parser, análisis de audio y respuesta IA en un único resultado."""
    result = {}

    # KEY (solo se confía en filename/audio si la IA corrobora)
    parsed_key = parsed_data.get('key')
    ai_key = gemini_analysis.get('key')
    norm_parsed = normalize_key_str(parsed_key) if parsed_key else None
    norm_ai = normalize_key_str(ai_key) if ai_key else None
    norm_audio = normalize_key_str(audio_analysis.get('suggested_key')) if audio_analysis.get('suggested_key') else None

    if norm_parsed and norm_ai and norm_parsed == norm_ai:
        result['key'] = parsed_key or ai_key
        result['key_confidence'] = max(95, gemini_analysis.get('key_confidence', 90))
        result['key_source'] = 'filename+ai_validation'
        result['key_verified'] = True
    elif norm_audio and norm_ai and norm_audio == norm_ai:
        result['key'] = ai_key or audio_analysis.get('suggested_key')
        result['key_confidence'] = max(90, gemini_analysis.get('key_confidence', 70))
        result['key_source'] = 'audio+ai_validation'
        result['key_verified'] = True
    elif norm_parsed:
        result['key'] = parsed_key
        result['key_confidence'] = 80
        result['key_source'] = 'filename'
        result['key_verified'] = False
        result['key_warning'] = 'Escala del filename sin corroborar'
    elif norm_audio:
        result['key'] = audio_analysis['suggested_key']
        result['key_confidence'] = 50
        result['key_source'] = 'audio_analysis'
        result['key_verified'] = False
        result['key_warning'] = 'Escala sugerida, verifica'
    else:
        # No aceptar KEY propuesta solo por IA sin evidencia en filename/audio
        result['key'] = None
        result['key_confidence'] = 0
    
    # BPM
    if parsed_data.get('bpm') and parsed_data.get('bpm_confidence', 0) >= 95:
        result['bpm'] = parsed_data['bpm']
        result['bpm_confidence'] = parsed_data['bpm_confidence']
        result['bpm_source'] = 'filename'
        result['bpm_verified'] = True
    elif audio_analysis.get('calculated_bpm'):
        result['bpm'] = audio_analysis['calculated_bpm']
        result['bpm_confidence'] = 50
        result['bpm_source'] = 'audio_analysis'
        result['bpm_verified'] = False
        result['bpm_warning'] = 'BPM calculado, verifica'
    else:
        result['bpm'] = None
        result['bpm_confidence'] = 0
    
    # Mood/Genre automático si Gemini no los proporcionó
    mood = gemini_analysis.get('mood', 'Unknown')
    genre = gemini_analysis.get('genre', 'Unknown')
    if mood == "Unknown" or genre == "Unknown":
        auto_mood, auto_genre = determine_mood_genre_by_bpm_key(result.get('bpm'), result.get('key'))
        if mood == "Unknown":
            mood = auto_mood
        if genre == "Unknown":
            genre = auto_genre
    
    # Otros
    # Beat name y artista quedan a discreción de la IA; el parser no rellena estos campos
    # No aceptar nombre de beat inventado por IA; solo desde filename si existe
    result['beat_name'] = parsed_data.get('beat_name') or parsed_data.get('title')
    
    # 🎤 COMBINAR MÚLTIPLES ARTISTAS (si hay array "artists" de Groq)
    ai_artists_list = []
    artists_array = gemini_analysis.get('artists', [])
    if artists_array and isinstance(artists_array, list):
        # Si Groq devolvió array de artistas, combinarlos
        for artist_obj in artists_array:
            if isinstance(artist_obj, dict) and artist_obj.get('name'):
                ai_artists_list.append(artist_obj['name'])
        if ai_artists_list:
            result['reference_artist'] = ', '.join(ai_artists_list)  # Combinar: "Pop Smoke, Travis Scott"
            result['reference_artist_source'] = 'ai_multiple'
            result['reference_artist_list'] = ai_artists_list  # Guardar array también para compatibilidad
    
    # Fallback: extraer un solo artista si no hay array
    if not ai_artists_list:
        ai_artist = extract_artist_from_ai_tags(gemini_analysis.get('tags', [])) or gemini_analysis.get('artist')
        result['reference_artist'] = ai_artist
        if ai_artist:
            result['reference_artist_source'] = 'ai'
    
    result['beat_type'] = gemini_analysis.get('type') or 'Beat'
    result['mood'] = mood
    result['genre'] = genre
    result['subgenres'] = gemini_analysis.get('subgenres', [])
    result['description'] = gemini_analysis.get('description', '')
    result['is_demo'] = parsed_data.get('is_demo', False)
    result['is_tagged'] = parsed_data.get('is_tagged', False)
    
    # Generar tags inteligentes combinando todo
    result['tags'] = generate_auto_tags(parsed_data, audio_analysis, gemini_analysis, result.get('bpm'), result.get('key'))
    
    # Info del artista (si Gemini lo conoce)
    result['artist_known'] = gemini_analysis.get('artist_known', False)
    result['artist_info'] = gemini_analysis.get('artist_info')
    
    return result


def analyze_beat_complete_v2(audio_path, filename):
    """Análisis completo con nuevo sistema mejorado."""
    print(f"🔍 Analizando: {filename}", file=sys.stderr)
    
    # Parser mejorado (usa safe_parse_filename directamente)
    parsed_data = safe_parse_filename(filename)
    # Añadir confidence estándar para compatibilidad
    parsed_data.setdefault('bpm_confidence', 100 if parsed_data.get('bpm') else 0)
    parsed_data.setdefault('key_confidence', 100 if parsed_data.get('key') else 0)
    parsed_data.setdefault('beat_name', parsed_data.get('title'))
    parsed_data.setdefault('reference_artist', parsed_data.get('artist'))
    parsed_data.setdefault('beat_type', parsed_data.get('type'))
    print(f"✅ Parser: BPM={parsed_data.get('bpm')}, KEY={parsed_data.get('key')}, Artist={parsed_data.get('artist')}", file=sys.stderr)
    
    # Audio
    print(f"🎵 Analizando audio...", file=sys.stderr)
    audio_analysis = analyze_audio_technical_simple(audio_path)
    print(f"✅ Audio: KEY={audio_analysis.get('suggested_key')}", file=sys.stderr)
    
    # Gemini
    print(f"🤖 Consultando Gemini...", file=sys.stderr)
    gemini_analysis = query_gemini_with_full_context(filename, parsed_data, audio_analysis)
    print(f"✅ Gemini: KEY={gemini_analysis.get('key')}, Mood={gemini_analysis.get('mood')}", file=sys.stderr)
    
    # Combinar
    final_result = combine_all_analysis(parsed_data, audio_analysis, gemini_analysis)
    # Integrar autofill basado en filename sin sobrescribir IA
    try:
        final_result = merge_autofill_into_result(final_result, filename)
        print("🧩 Autofill por filename integrado", file=sys.stderr)
    except Exception as e:
        print(f"⚠️ Autofill por filename no integrado: {e}", file=sys.stderr)
    print(f"✅ Análisis completo", file=sys.stderr)
    return final_result


def main():
    """
    Función principal mejorada con nuevo sistema V2.
    Invocación: python3 analyze_beat_ai.py <ruta_audio> [nombre_archivo] [--v2]
    """
    try:
        # Validar argumentos
        if len(sys.argv) < 2:
            raise ValueError("Uso: python3 analyze_beat_ai.py <ruta_audio> [nombre_archivo] [--v2]")
        
        audio_path = sys.argv[1]
        filename = sys.argv[2] if len(sys.argv) > 2 and not sys.argv[2].startswith('--') else os.path.basename(audio_path)
        use_v2 = '--v2' in sys.argv
        
        # Validar que el archivo existe
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Archivo no encontrado: {audio_path}")
        
        # USAR SISTEMA V2 (NUEVO)
        if use_v2:
            print("🚀 Usando sistema mejorado V2", file=sys.stderr)
            v2_result = analyze_beat_complete_v2(audio_path, filename)
            
            result = {
                "status": "success",
                "version": "v2",
                "beat_name": v2_result.get('beat_name'),
                "reference_artist": v2_result.get('reference_artist'),
                "beat_type": v2_result.get('beat_type'),
                "bpm": v2_result.get('bpm'),
                "bpm_confidence": v2_result.get('bpm_confidence', 0),
                "bpm_source": v2_result.get('bpm_source'),
                "bpm_verified": v2_result.get('bpm_verified', False),
                "bpm_warning": v2_result.get('bpm_warning'),
                "key": v2_result.get('key'),
                "key_confidence": v2_result.get('key_confidence', 0),
                "key_source": v2_result.get('key_source'),
                "key_verified": v2_result.get('key_verified', False),
                "key_warning": v2_result.get('key_warning'),
                "mood": v2_result.get('mood'),
                "genre": v2_result.get('genre'),
                "subgenres": v2_result.get('subgenres', []),
                "tags": v2_result.get('tags', []),
                "description": v2_result.get('description'),
                "is_demo": v2_result.get('is_demo', False),
                "is_tagged": v2_result.get('is_tagged', False),
                "filename": filename
            }
            
            print(json.dumps(result, ensure_ascii=False, indent=2))
            return
        
        # SISTEMA LEGACY (COMPATIBLE CON SERVIDOR ACTUAL)
        print("📊 Usando sistema legacy (compatible)", file=sys.stderr)
        
        # FASE 1: Análisis técnico
        technical_data = extract_technical_features(audio_path, filename)
        
        # FASE 2: Inferencia con IA
        ai_inference = infer_with_gemini(technical_data)

        # FASE 3: Tabla de confianza
        confidence_report = generate_confidence_report(technical_data, ai_inference)
        
        # Construir respuesta final
        autofill_info = build_autofill_from_filename(safe_parse_filename(filename))
        result = {
            "status": "success",
            "technical_data": {
                "bpm": float(technical_data['bpm']),
                "bpm_confidence": float(technical_data.get('bpm_confidence', 0.0)),
                "key": str(technical_data['key']),
                "key_confidence": float(technical_data.get('key_confidence', 0.0)),
                "duration": float(technical_data['duration']),
                "spectral_centroid": float(technical_data['spectral_centroid']),
                "lufs": float(technical_data['lufs']),
                "spectral_rolloff": float(technical_data.get('spectral_rolloff', 0)),
                "zero_crossing_rate": float(technical_data.get('zero_crossing_rate', 0)),
                "detection_source": {
                    "bpm_from_filename": technical_data.get('detection_source', {}).get('bpm_from_filename', False),
                    "key_from_filename": technical_data.get('detection_source', {}).get('key_from_filename', False)
                }
            },
            "ai_inference": {
                "mood": str(ai_inference.get("mood", "Unknown")),
                "tags": list(ai_inference.get("tags", [])),
                "tags_source": str(ai_inference.get("tags_source", "Solo Parser")),
                "gemini_access": bool(ai_inference.get("gemini_access", False)),
                "gemini_status": str(ai_inference.get("gemini_status", "not_used")),
                "chord_progression": list(ai_inference.get("chord_progression", [])),
                "scale_explanation": str(ai_inference.get("scale_explanation", ""))
            },
            "confidence_report": confidence_report,
            "filename": filename,
            "autofill": autofill_info
        }

        # Combinar tags de autofill sin diluir IA (legacy)
        fn_tags = autofill_info.get('tags_from_filename', []) or []
        existing_tags = result['ai_inference'].get('tags', []) or []
        combined = list(dict.fromkeys(existing_tags + fn_tags))
        result['ai_inference']['tags'] = combined[:30]
        
        # Imprimir JSON para consumo por Node.js
        print(json.dumps(result, ensure_ascii=False, indent=2))
    
    except FileNotFoundError as e:
        error_response = {
            "status": "error",
            "error": "file_not_found",
            "message": str(e)
        }
        print(json.dumps(error_response, ensure_ascii=False))
        sys.exit(1)
    
    except ValueError as e:
        error_response = {
            "status": "error",
            "error": "invalid_input",
            "message": str(e)
        }
        print(json.dumps(error_response, ensure_ascii=False))
        sys.exit(1)
    
    except Exception as e:
        error_response = {
            "status": "error",
            "error": "processing_error",
            "message": str(e)
        }
        print(json.dumps(error_response, ensure_ascii=False))
        sys.exit(1)


if __name__ == "__main__":
    main()
