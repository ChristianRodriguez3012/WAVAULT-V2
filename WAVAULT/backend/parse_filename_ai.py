#!/usr/bin/env python3
"""
parse_filename_ai.py
Extrae metadatos del nombre del archivo usando Gemini AI.
Identifica: Artist, Canción, BPM, Key, Type Beat

Invocación: python3 parse_filename_ai.py "COLE x DRAKE TYPE BEAT - Fm Maj 90 - CLASSIC.mp3"

Retorna JSON con extracción inteligente.
"""

import sys
import json
import os
import re
import google.generativeai as genai

# Configuración
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')

def parse_filename_with_gemini(filename):
    """
    Usa Gemini para extraer metadata del nombre del archivo.
    
    Args:
        filename: Nombre del archivo (ej: "Artist - Song - 140BPM - Dm.mp3")
    
    Returns:
        Dict con: artist, title, bpm, key, type, confidence_scores
    """
    
    # Remover extensión
    name_without_ext = re.sub(r'\.(mp3|wav|flac|m4a)$', '', filename, flags=re.IGNORECASE)
    
    # Intentar con Gemini si disponible
    if GEMINI_API_KEY and GEMINI_API_KEY != 'empty':
        try:
            genai.configure(api_key=GEMINI_API_KEY)
            
            prompt = f"""Analiza este nombre de archivo de beat instrumental y extrae EXACTAMENTE estos campos:

Nombre: "{name_without_ext}"

EXTRAE:
1. artist: Nombre antes de "TYPE BEAT" o del primer "-"
2. title: El último elemento (después del último "-") a menos que sea número o nota musical
3. bpm: Número de 2-3 dígitos
4. key: Nota musical (C, C#, Dm, Fm, etc)
5. type: "Type Beat" si aparece

RETORNA SOLO JSON:
{{"artist": "...", "title": "...", "bpm": número, "key": "...", "type": "Type Beat o null", "artist_confidence": 0-100, "bpm_confidence": 0-100, "key_confidence": 0-100, "title_confidence": 0-100}}
"""
            
            model = genai.GenerativeModel('gemini-2.0-flash')
            response = model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Limpiar markdown
            if '```json' in response_text:
                response_text = response_text.split('```json')[1].split('```')[0].strip()
            elif '```' in response_text:
                response_text = response_text.split('```')[1].split('```')[0].strip()
            
            data = json.loads(response_text)
            return data
            
        except Exception as e:
            print(f"❌ Gemini error: {e}", file=sys.stderr)
            return parse_filename_basic(name_without_ext)
    
    # Fallback a regex
    return parse_filename_basic(name_without_ext)


def parse_filename_basic(filename):
    """
    Fallback: Extrae metadata usando regex INTELIGENTE.
    
    ESTRUCTURA ESPERADA:
    NOMBRE DEL BEAT - TYPE DEL BEAT - REFERENCIA/ARTISTA - KEY - BPM
    
    Ejemplo:
    "Tropical Vibes - Drake Type Beat - Drake - Fm - 90"
    "Dark Trap - Travis Scott Type Beat - Sicario - Cm - 140"
    
    Args:
        filename: Nombre sin extensión
    
    Returns:
        Dict con datos extraídos
    """
    
    result = {
        "beat_name": None,        # NOMBRE DEL BEAT
        "beat_type": None,        # TYPE DEL BEAT (ej: Drake Type Beat)
        "reference": None,        # REFERENCIA/ARTISTA que inspiró
        "key": None,
        "bpm": None,
        "beat_name_confidence": 0,
        "beat_type_confidence": 0,
        "reference_confidence": 0,
        "key_confidence": 0,
        "bpm_confidence": 0
    }
    
    # Limpiar caracteres especiales de paréntesis/llaves (no se consideran en el nombre)
    filename_clean = re.sub(r'[\[\{\(].*?[\]\}\)]', '', filename)
    filename_clean = filename_clean.strip()
    
    # Dividir por guiones
    parts = [p.strip() for p in re.split(r'\s*-\s*', filename_clean)]
    parts = [p for p in parts if p]  # Remover vacíos
    
    if len(parts) == 0:
        return result
    
    # ESTRUCTURA: [0] NOMBRE - [1] TYPE - [2] REFERENCIA - [3] KEY - [4] BPM
    
    # Parte 0: BEAT NAME
    if len(parts) > 0:
        result["beat_name"] = parts[0]
        result["beat_name_confidence"] = 95
    
    # Buscar BPM (número 2-3 dígitos, probablemente entre 50-220)
    bpm_match = re.search(r'\b(\d{2,3})\b', filename_clean)
    if bpm_match:
        bpm_val = int(bpm_match.group(1))
        if 50 <= bpm_val <= 220:  # Rango válido para BPM
            result["bpm"] = bpm_val
            result["bpm_confidence"] = 85
    
    # Buscar KEY (nota musical con sufijo)
    # Patrón: C, C#, Cm, C#m, Cmaj, etc
    # PERO: Debe tener sufijo musical (#, b, m, maj, min) o ser muy corto (1-2 caracteres)
    key_match = re.search(
        r'\b([A-G](?:[#b])?(?:major|maj|mayor|minor|min|menor|m)?)\b',
        filename_clean,
        re.IGNORECASE
    )
    if key_match:
        potential_key = key_match.group(1).strip()
        # Validar que sea realmente una nota (debe tener sufijo musical)
        # "D" solo no es suficiente, debe ser "Dm" o "D#" o "Dmaj"
        if re.search(r'[#bm]|maj|min', potential_key, re.IGNORECASE):
            result["key"] = potential_key
            result["key_confidence"] = 85
    
    # Analizar estructura de partes
    if len(parts) >= 2:
        # Detectar TYPE BEAT (ej: "Drake Type Beat", "Travis Scott Type Beat")
        type_part = None
        type_idx = -1
        
        for i, part in enumerate(parts):
            if re.search(r'type\s*beat', part, re.IGNORECASE):
                type_part = part
                type_idx = i
                break
        
        if type_part:
            result["beat_type"] = type_part
            result["beat_type_confidence"] = 90
            
            # REFERENCIA está después del TYPE (si existe)
            if type_idx + 1 < len(parts):
                ref_candidate = parts[type_idx + 1]
                # Verificar que no sea BPM (número 2-3 dígitos)
                is_bpm = re.match(r'^\d{2,3}$', ref_candidate)
                
                # Verificar que no sea KEY (nota + sufijo musical)
                # Validación ESTRICTA: debe tener [#bm] o palabras como maj/min/major/minor
                is_key = re.match(
                    r'^[A-G][#b]?(?:m|maj|min|major|minor|mayor|menor)?$',
                    ref_candidate,
                    re.IGNORECASE
                ) and re.search(r'[#bm]|maj|min', ref_candidate, re.IGNORECASE)
                
                if not is_bpm and not is_key:
                    result["reference"] = ref_candidate
                    result["reference_confidence"] = 80
    
    # Si no hay TYPE pero hay múltiples partes, asumir estructura flexible
    if not result["beat_type"] and len(parts) >= 2:
        # Intentar extraer REFERENCE (parte que no sea NAME, KEY, BPM)
        for i in range(1, len(parts)):
            part = parts[i]
            if not re.match(r'^\d{2,3}$', part) and \
               not re.match(r'^[A-G]', part, re.IGNORECASE):
                result["reference"] = part
                result["reference_confidence"] = 75
                break
    
    return result


def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            "error": "Uso: python3 parse_filename_ai.py 'nombre_archivo.mp3'"
        }))
        sys.exit(1)
    
    filename = sys.argv[1]
    result = parse_filename_with_gemini(filename)
    
    print(json.dumps(result))


if __name__ == "__main__":
    main()
