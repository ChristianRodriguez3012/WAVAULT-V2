#!/usr/bin/env python3
"""
parse_filename_improved.py - SISTEMA MEJORADO
Extracción INTELIGENTE de metadata del nombre del archivo.

MEJORAS IMPLEMENTADAS:
✅ Detección de metadata en paréntesis/corchetes/llaves: (demo), (tagged), (key bpm)
✅ Detección inteligente de BPM (números 50-300 sin "BPM" explícito)
✅ Sinónimos de escalas: Min/min/m/minor → Minor, Maj/MAJ/M/major → Major
✅ Detección de notas con modificadores: A, A#, Ab, A♭, A♯
✅ Priorización: Si está en el nombre del archivo = VERIDICO (confianza 100%)

SISTEMA DE CONFIANZA:
- 100: Metadata explícita en nombre (VERIDICO)
- 95: Detectado en nombre pero no explícito
- 50-70: Sugerido por análisis de audio (script/IA)
- 0: No detectado

USO:
python3 parse_filename_improved.py "Drake Type Beat - Sicario - Dm 140.mp3"
"""

import sys
import json
import re
from typing import Dict, Optional, List, Tuple


# =====================================================
# DICCIONARIOS DE SINÓNIMOS
# =====================================================

SCALE_SYNONYMS = {
    # Minor variations
    'minor': 'Minor', 'min': 'Minor', 'menor': 'Minor', 'm': 'Minor',
    # Major variations  
    'major': 'Major', 'maj': 'Major', 'mayor': 'Major', 'M': 'Major',
}

NOTE_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B']


def generate_key_variations() -> Dict[str, str]:
    """
    Genera diccionario completo de variaciones de escalas musicales.
    
    Retorna dict donde:
    - Key: variación (ej: "Amin", "AMin", "A Min", "Am")
    - Value: formato normalizado (ej: "A Minor")
    
    Cubre:
    - Todas las notas: C, D, E, F, G, A, B
    - Con modificadores: #, b (sostenido, bemol)
    - Minor: min, m, minor, MIN, MINOR, Min
    - Major: maj, M, major, MAJ, MAJOR, Maj
    - Con/sin espacios: "Amin", "A min", "A Minor"
    """
    variations = {}
    
    notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
    modifiers = ['', '#', 'b']  # natural, sostenido, bemol
    
    # Variaciones de Minor
    minor_suffixes = ['min', 'm', 'minor', 'MIN', 'MINOR', 'Min', 'menor']
    
    # Variaciones de Major
    major_suffixes = ['maj', 'M', 'major', 'MAJ', 'MAJOR', 'Maj', 'mayor']
    
    for note in notes:
        for modifier in modifiers:
            note_full = f"{note}{modifier}"
            
            # Minor variations
            for suffix in minor_suffixes:
                # Sin espacio: Amin, Cm, C#minor
                variations[f"{note_full}{suffix}"] = f"{note_full} Minor"
                # Con espacio: A min, C minor, C# MIN
                variations[f"{note_full} {suffix}"] = f"{note_full} Minor"
                # Lowercase note: amin, c#m
                variations[f"{note_full.lower()}{suffix}"] = f"{note_full} Minor"
                variations[f"{note_full.lower()} {suffix}"] = f"{note_full} Minor"
            
            # Major variations
            for suffix in major_suffixes:
                # Sin espacio: Cmaj, C#M, DbMAJOR
                variations[f"{note_full}{suffix}"] = f"{note_full} Major"
                # Con espacio: C maj, C# Major
                variations[f"{note_full} {suffix}"] = f"{note_full} Major"
                # Lowercase: cmaj, c#M
                variations[f"{note_full.lower()}{suffix}"] = f"{note_full} Major"
                variations[f"{note_full.lower()} {suffix}"] = f"{note_full} Major"
    
    return variations


# Generar diccionario global de variaciones
KEY_VARIATIONS = generate_key_variations()


def generate_key_variations() -> Dict[str, str]:
    """
    Genera diccionario completo de variaciones de escalas musicales.
    
    Retorna dict donde:
    - Key: variación (ej: "Amin", "AMin", "A Min", "Am")
    - Value: formato normalizado (ej: "A Minor")
    
    Cubre:
    - Todas las notas: C, D, E, F, G, A, B
    - Con modificadores: #, b (sostenido, bemol)
    - Minor: min, m, minor, MIN, MINOR, Min
    - Major: maj, M, major, MAJ, MAJOR, Maj
    - Con/sin espacios: "Amin", "A min", "A Minor"
    """
    variations = {}
    
    notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
    modifiers = ['', '#', 'b']  # natural, sostenido, bemol
    
    # Variaciones de Minor
    minor_suffixes = ['min', 'm', 'minor', 'MIN', 'MINOR', 'Min', 'menor']
    
    # Variaciones de Major
    major_suffixes = ['maj', 'M', 'major', 'MAJ', 'MAJOR', 'Maj', 'mayor']
    
    for note in notes:
        for modifier in modifiers:
            note_full = f"{note}{modifier}"
            
            # Minor variations
            for suffix in minor_suffixes:
                # Sin espacio: Amin, Cm, C#minor
                variations[f"{note_full}{suffix}"] = f"{note_full} Minor"
                # Con espacio: A min, C minor, C# MIN
                variations[f"{note_full} {suffix}"] = f"{note_full} Minor"
                # Lowercase note: amin, c#m
                variations[f"{note_full.lower()}{suffix}"] = f"{note_full} Minor"
                variations[f"{note_full.lower()} {suffix}"] = f"{note_full} Minor"
            
            # Major variations
            for suffix in major_suffixes:
                # Sin espacio: Cmaj, C#M, DbMAJOR
                variations[f"{note_full}{suffix}"] = f"{note_full} Major"
                # Con espacio: C maj, C# Major
                variations[f"{note_full} {suffix}"] = f"{note_full} Major"
                # Lowercase: cmaj, c#M
                variations[f"{note_full.lower()}{suffix}"] = f"{note_full} Major"
                variations[f"{note_full.lower()} {suffix}"] = f"{note_full} Major"
    
    return variations


# Generar diccionario global de variaciones
KEY_VARIATIONS = generate_key_variations()


def normalize_note(note_str: str) -> Optional[str]:
    """
    Normaliza nota musical a formato estándar.
    Ej: "c♯" → "C#", "Db" → "Db", "A" → "A"
    """
    if not note_str or note_str[0].upper() not in NOTE_NAMES:
        return None
    
    normalized = note_str[0].upper()
    rest = note_str[1:].lower()
    
    if any(s in rest for s in ['#', '♯', 'sharp']):
        normalized += '#'
    elif any(s in rest for s in ['b', '♭', 'flat']):
        normalized += 'b'
    
    # Validar notas inválidas
    if normalized in ['E#', 'B#', 'Fb', 'Cb']:
        return None
    
    return normalized


def normalize_scale_type(scale_str: str) -> Optional[str]:
    """Normaliza tipo de escala: "min"/"m"/"minor" → "Minor"  """
    if not scale_str:
        return None
    return SCALE_SYNONYMS.get(scale_str.strip().lower())


def extract_metadata_from_brackets(filename: str) -> Dict:
    """
    Extrae metadata de paréntesis/corchetes/llaves.
    Detecta: (demo), (tagged), (130bpm), (Cm), etc.
    MEJORADO: Solo detecta notas musicales válidas (con modificador o sufijo m/M)
    """
    metadata = {
        'is_demo': False,
        'is_tagged': False,
        'bpm_from_brackets': None,
        'key_from_brackets': None,
    }
    
    # Capturar contenido entre (), [], {}
    matches = re.findall(r'[\[\(\{]([^\]\)\}]+)[\]\)\}]', filename, re.IGNORECASE)
    
    for content in matches:
        lower = content.strip().lower()
        
        # Demo/Tagged
        if 'demo' in lower:
            metadata['is_demo'] = True
        if 'tagged' in lower or 'tag' in lower:
            metadata['is_tagged'] = True
            continue  # Si es tag/tagged, no buscar notas aquí
        
        # BPM en paréntesis
        bpm_match = re.search(r'(\d{2,3})\s*(?:bpm)?', lower)
        if bpm_match:
            bpm_val = int(bpm_match.group(1))
            if 50 <= bpm_val <= 300:
                metadata['bpm_from_brackets'] = bpm_val
        
        # KEY en paréntesis - Solo detectar si es claramente una nota musical
        # DEBE tener: modificador (#, b) O sufijo m/M O palabra major/minor
        key_patterns = [
            # Nota + modificador + tipo
            r'([A-Ga-g][#b♯♭])\s*(major|minor|maj|min|m|M)?',
            # Nota + sufijo pegado (solo m minúscula)
            r'([A-Ga-g])([m])\b',
        ]
        
        for pattern in key_patterns:
            key_match = re.search(pattern, content)
            if key_match:
                note = normalize_note(key_match.group(1))
                if not note:
                    continue
                
                # Si tiene sufijo o es parte de un match válido
                if len(key_match.groups()) > 1 and key_match.group(2):
                    scale = normalize_scale_type(key_match.group(2))
                    if scale:
                        metadata['key_from_brackets'] = f"{note} {scale}"
                        break
                elif '#' in key_match.group(1) or 'b' in key_match.group(1):
                    # Tiene modificador, es una nota válida
                    metadata['key_from_brackets'] = note
                    break
    
    return metadata


def extract_bpm_intelligent(filename: str) -> Optional[int]:
    """
    Extracción inteligente de BPM.
    1. BPM explícito: "140BPM", "140 BPM"
    2. BPM pegado a KEY: "Amin140", "Cm150"
    3. Número candidato 50-300 (excluyendo años 1990-2025)
    """
    # Prioridad 1: BPM explícito
    explicit = re.search(r'(\d{2,3})\s*bpm', filename, re.IGNORECASE)
    if explicit:
        bpm = int(explicit.group(1))
        if 50 <= bpm <= 300:
            return bpm
    
    # Prioridad 2: BPM pegado a KEY (Amin140, Cm150, C#m128)
    # Buscar nota + escala + número
    key_bpm = re.search(r'[A-Ga-g][#b]?(min|m|maj|major|minor|M|MIN|MINOR)(\d{2,3})\b', filename, re.IGNORECASE)
    if key_bpm:
        bpm = int(key_bpm.group(2))
        if 50 <= bpm <= 300:
            return bpm
    
    # Prioridad 3: Números candidatos
    all_numbers = [int(n) for n in re.findall(r'\b(\d{2,3})\b', filename)]
    
    candidates = [n for n in all_numbers if 50 <= n <= 300 and not (1990 <= n <= 2025)]
    
    if candidates:
        # Tomar el más cercano a 130 BPM (centro típico)
        return min(candidates, key=lambda x: abs(x - 130))
    
    return None


def extract_key_intelligent(filename: str) -> Optional[str]:
    """
    Extracción inteligente de KEY usando 4 estrategias.
    
    Estrategia 0: Diccionario de variaciones exhaustivo (Amin, AMin, A min, etc.)
    Estrategia 1: Nota + modificador + escala completa
    Estrategia 2: Nota + modificador + m/M pegado
    Estrategia 3: Nota con modificador antes de número
    
    Detecta: "Amin", "Cm", "C# Minor", "Dbmaj", "A", etc.
    MEJORADO: Evita detectar letras sueltas que no son notas musicales.
    """
    
    # ESTRATEGIA 0: Búsqueda en diccionario de variaciones
    # Buscar todas las variaciones posibles (Amin, AMin, A min, etc.)
    for variation, normalized_key in KEY_VARIATIONS.items():
        # Buscar la variación como palabra completa o seguida de números/espacios
        # Para detectar casos como "Amin140" o "A min -"
        pattern = rf'\b{re.escape(variation)}(?=\s|\d|$|\W)'
        if re.search(pattern, filename, re.IGNORECASE):
            return normalized_key
    
    # ESTRATEGIA 1-3: Patrones regex originales como fallback
    patterns = [
        # Patrón 1: Nota + modificador + escala completa
        r'\b([A-Ga-g][#b♯♭]?)\s+(major|minor|maj|min|mayor|menor)\b',
        # Patrón 2: Nota + modificador + m/M pegado (solo si tiene modificador O m minúscula)
        r'\b([A-Ga-g][#b♯♭])([mM])\b',  # C#m, Dbm
        r'\b([A-Ga-g])([m])\b',  # Am, Dm (solo 'm' minúscula, no 'M' sola)
        # Patrón 3: Nota con modificador antes de número (ej: "C# 140")
        r'\b([A-Ga-g][#b♯♭])\s+(?=\d{2,3})',
    ]
    
    for pattern in patterns:
        matches = list(re.finditer(pattern, filename, re.IGNORECASE))
        if matches:
            # Tomar el ÚLTIMO match
            last_match = matches[-1]
            note = normalize_note(last_match.group(1))
            
            if not note:
                continue
            
            scale_type = None
            if len(last_match.groups()) > 1 and last_match.group(2):
                scale_type = normalize_scale_type(last_match.group(2))
            
            return f"{note} {scale_type}" if scale_type else note
    
    return None


def parse_filename(filename: str) -> Dict:
    """
    PARSER PRINCIPAL - Extrae toda la metadata del nombre.
    """
    result = {
        "beat_name": None,
        "beat_type": None,
        "reference_artist": None,
        "key": None,
        "key_confidence": 0,
        "bpm": None,
        "bpm_confidence": 0,
        "is_demo": False,
        "is_tagged": False,
        "filename_original": filename
    }
    
    # Remover extensión
    name = re.sub(r'\.(mp3|wav|flac|m4a|aiff|ogg)$', '', filename, flags=re.IGNORECASE)
    
    # PASO 1: Extraer de paréntesis/corchetes
    brackets_data = extract_metadata_from_brackets(name)
    result['is_demo'] = brackets_data['is_demo']
    result['is_tagged'] = brackets_data['is_tagged']
    
    if brackets_data['bpm_from_brackets']:
        result['bpm'] = brackets_data['bpm_from_brackets']
        result['bpm_confidence'] = 100  # VERIDICO
    
    if brackets_data['key_from_brackets']:
        result['key'] = brackets_data['key_from_brackets']
        result['key_confidence'] = 100  # VERIDICO
    
    # Limpiar brackets del nombre
    clean_name = re.sub(r'[\[\(\{][^\]\)\}]*[\]\)\}]', '', name).strip()
    
    # PASO 2: Detectar TYPE BEAT
    type_match = re.search(r'\b(TYPE\s+BEAT|Type\s+Beat)\b', clean_name, re.IGNORECASE)
    if type_match:
        result['beat_type'] = 'Type Beat'
        clean_name = (clean_name[:type_match.start()] + ' ' + clean_name[type_match.end():]).strip()
    
    # PASO 3: Extraer BPM (si no vino de brackets)
    if not result['bpm']:
        bpm = extract_bpm_intelligent(clean_name)
        if bpm:
            result['bpm'] = bpm
            # Si tiene "BPM" explícito → confianza 100, sino 95
            has_explicit = re.search(rf'\b{bpm}\s*bpm\b', clean_name, re.IGNORECASE)
            result['bpm_confidence'] = 100 if has_explicit else 95
    
    # PASO 4: Extraer KEY (si no vino de brackets)
    if not result['key']:
        key = extract_key_intelligent(clean_name)
        if key:
            result['key'] = key
            result['key_confidence'] = 95
    
    # PASO 5: Extraer nombres (beat name / artist)
    # Primero, remover BPM y KEY del nombre para facilitar extracción
    clean_name_for_parsing = clean_name
    if result['bpm']:
        clean_name_for_parsing = re.sub(rf'\b{result["bpm"]}\s*(?:bpm)?\b', '', clean_name_for_parsing, flags=re.IGNORECASE).strip()
    if result['key']:
        # Remover KEY completa (ej: "Dm", "D Minor", "C#")
        key_pattern = re.escape(result['key'].split()[0])  # Primera parte de la KEY
        clean_name_for_parsing = re.sub(rf'\b{key_pattern}[mM]?\b', '', clean_name_for_parsing).strip()
        clean_name_for_parsing = re.sub(r'\b(major|minor|maj|min)\b', '', clean_name_for_parsing, flags=re.IGNORECASE).strip()
    
    # Limpiar guiones múltiples o vacíos
    clean_name_for_parsing = re.sub(r'\s*-\s*-\s*', ' - ', clean_name_for_parsing)
    clean_name_for_parsing = re.sub(r'-\s*$', '', clean_name_for_parsing).strip()
    clean_name_for_parsing = re.sub(r'^\s*-', '', clean_name_for_parsing).strip()
    
    # Dividir por guiones
    parts = [p.strip() for p in re.split(r'\s*-\s*', clean_name_for_parsing) if p.strip()]
    
    if len(parts) >= 2:
        if result['beat_type']:  # Type Beat
            result['reference_artist'] = parts[0]
            result['beat_name'] = parts[1] if len(parts) > 1 else None
        else:
            # Sin Type Beat: Primera parte = nombre del beat, Segunda = artista/referencia
            result['beat_name'] = parts[-1]  # Última parte suele ser el nombre del beat
            result['reference_artist'] = ' - '.join(parts[:-1])  # Todo lo demás es referencia
    elif len(parts) == 1:
        result['beat_name'] = parts[0]
    
    return result


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Uso: python3 parse_filename_improved.py <nombre_archivo>"}))
        sys.exit(1)
    
    filename = sys.argv[1]
    parsed_data = parse_filename(filename)
    
    print(json.dumps(parsed_data, ensure_ascii=False, indent=2))
