# 🤖 Especificaciones para Integración Gemini AI Mejorada

## 📋 Resumen

Este documento detalla cómo debe modificarse `analyze_beat_ai.py` para enviar mensajes estructurados a Gemini AI y recibir respuestas en el formato correcto para autocompletar el formulario.

---

## 🎯 Objetivo

**ANTES:**
```python
prompt = "Analiza este beat y dame BPM, key, mood, tags"
```

**DESPUÉS:**
```python
prompt = f"""
SOY LA INTEGRACIÓN DE WAVAULT.

BEAT ANALIZADO:
- Nombre archivo: "{filename}"
- Notas detectadas: {detected_notes}
- Progresión de acordes: {chord_progression}
- Escala sugerida por script: {suggested_key} (confidence: {key_confidence}%)
- BPM del archivo: {bpm_from_filename} (confidence: {bpm_confidence}%)

ARTISTA DE REFERENCIA: {reference_artist if reference_artist else "N/A"}

TAREAS:
1. VALIDAR ESCALA basada en notas detectadas
2. DETERMINAR MOOD basado en progresión + BPM
3. GENERAR TAGS INTELIGENTES (1-3 palabras máx)
4. DETERMINAR TIPO/GÉNERO del beat

RETORNA SOLO JSON...
"""
```

---

## 🔧 Modificaciones en `analyze_beat_ai.py`

### 1. Importar Parser de Nombres

```python
# Al inicio del archivo
import sys
import json
import os
from parse_filename_improved import parse_filename

# ... resto de imports
```

### 2. Función Principal Modificada

```python
def analyze_beat_complete(audio_path, filename):
    """
    Análisis completo del beat incluyendo parseo de nombre y análisis IA.
    
    Args:
        audio_path: Ruta al archivo de audio
        filename: Nombre original del archivo
    
    Returns:
        Dict completo con toda la metadata
    """
    
    # PASO 1: Parsear nombre del archivo
    parsed_data = parse_filename(filename)
    
    # PASO 2: Análisis técnico del audio
    audio_analysis = analyze_audio_technical(audio_path)
    
    # PASO 3: Consultar Gemini AI con contexto completo
    gemini_analysis = query_gemini_with_context(
        filename=filename,
        parsed_data=parsed_data,
        audio_analysis=audio_analysis
    )
    
    # PASO 4: Combinar resultados con sistema de confianza
    final_result = combine_analysis_with_confidence(
        parsed_data,
        audio_analysis,
        gemini_analysis
    )
    
    return final_result
```

### 3. Nueva Función: `analyze_audio_technical()`

```python
def analyze_audio_technical(audio_path):
    """
    Análisis técnico del audio usando Librosa.
    
    Returns:
        Dict con:
        - detected_notes: Lista de notas detectadas
        - chord_progression: Lista de acordes
        - suggested_key: Escala sugerida
        - calculated_bpm: BPM calculado
        - confidence_scores: Dict con confianzas
    """
    
    # Cargar audio
    y, sr = librosa.load(audio_path, sr=22050, duration=30)
    
    # Detección de notas
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    note_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    
    # Detectar notas más prominentes
    chroma_mean = np.mean(chroma, axis=1)
    top_notes_idx = np.argsort(chroma_mean)[-5:]  # Top 5 notas
    detected_notes = [note_names[idx] for idx in top_notes_idx]
    
    # Detectar acordes (simplificado)
    chord_progression = detect_chord_progression(y, sr, bpm=120)
    
    # Sugerir escala basada en notas
    suggested_key = suggest_key_from_notes(detected_notes, chroma_mean)
    
    # Calcular BPM
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    calculated_bpm = int(tempo)
    
    return {
        "detected_notes": detected_notes,
        "chord_progression": chord_progression,
        "suggested_key": suggested_key,
        "suggested_key_confidence": 50,  # Baja confianza (script)
        "calculated_bpm": calculated_bpm,
        "calculated_bpm_confidence": 50,  # Baja confianza
        "analysis_source": "librosa_script"
    }


def suggest_key_from_notes(detected_notes, chroma_values):
    """
    Sugiere escala musical basada en notas detectadas.
    
    Algoritmo:
    1. Identifica la nota más prominente → root note
    2. Analiza intervalos para determinar Major/Minor
    """
    
    note_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    
    # Nota más prominente = root
    root_idx = np.argmax(chroma_values)
    root_note = note_names[root_idx]
    
    # Detectar si es Major o Minor basado en tercera
    # Major: tercera mayor (4 semitonos)
    # Minor: tercera menor (3 semitonos)
    
    third_major_idx = (root_idx + 4) % 12
    third_minor_idx = (root_idx + 3) % 12
    
    major_strength = chroma_values[third_major_idx]
    minor_strength = chroma_values[third_minor_idx]
    
    if minor_strength > major_strength:
        scale_type = "Minor"
    else:
        scale_type = "Major"
    
    return f"{root_note} {scale_type}"
```

### 4. Nueva Función: `query_gemini_with_context()`

```python
def query_gemini_with_context(filename, parsed_data, audio_analysis):
    """
    Consulta Gemini AI con contexto completo y estructurado.
    
    Args:
        filename: Nombre del archivo
        parsed_data: Dict del parser (parse_filename_improved)
        audio_analysis: Dict del análisis técnico (librosa)
    
    Returns:
        Dict con respuesta de Gemini
    """
    
    if not GEMINI_API_KEY or GEMINI_API_KEY == 'empty':
        return get_default_gemini_response()
    
    genai.configure(api_key=GEMINI_API_KEY)
    
    # Construir prompt estructurado
    prompt = f"""SOY LA INTEGRACIÓN DE WAVAULT - ANÁLISIS DE BEAT MUSICAL

📄 INFORMACIÓN DEL ARCHIVO:
- Nombre original: "{filename}"

🎵 METADATA EXTRAÍDA DEL NOMBRE (Parser):
- Beat Name: {parsed_data.get('beat_name') or 'N/A'}
- Artist/Referencia: {parsed_data.get('reference_artist') or 'N/A'}
- Type Beat: {parsed_data.get('beat_type') or 'N/A'}
- KEY detectada en nombre: {parsed_data.get('key') or 'N/A'} (confidence: {parsed_data.get('key_confidence', 0)}%)
- BPM detectado en nombre: {parsed_data.get('bpm') or 'N/A'} (confidence: {parsed_data.get('bpm_confidence', 0)}%)
- Es demo: {parsed_data.get('is_demo', False)}
- Está tagged: {parsed_data.get('is_tagged', False)}

🔬 ANÁLISIS TÉCNICO DEL AUDIO (Librosa):
- Notas musicales detectadas: {audio_analysis.get('detected_notes', [])}
- Progresión de acordes: {audio_analysis.get('chord_progression', [])}
- Escala sugerida por script: {audio_analysis.get('suggested_key')} (confidence: {audio_analysis.get('suggested_key_confidence')}%)
- BPM calculado: {audio_analysis.get('calculated_bpm')} (confidence: {audio_analysis.get('calculated_bpm_confidence')}%)

🎯 TAREAS ESPECÍFICAS:

1. **VALIDAR ESCALA MUSICAL**:
   - Si el nombre del archivo tiene KEY explícita (confidence 95-100%): ACEPTA ESA KEY como correcta
   - Si no hay KEY en el nombre, analiza las notas detectadas [{audio_analysis.get('detected_notes', [])}]
   - Determina si la escala sugerida "{audio_analysis.get('suggested_key')}" es correcta
   - Si es incorrecta, proporciona la escala correcta
   - Confidence de tu validación: 70%

2. **DETERMINAR MOOD DEL BEAT**:
   Basado en:
   - BPM: {parsed_data.get('bpm') or audio_analysis.get('calculated_bpm')} (rápido=energético, lento=chill)
   - Progresión de acordes: {audio_analysis.get('chord_progression', [])}
   - Escala: {'Minor' in str(audio_analysis.get('suggested_key', '')) and 'posiblemente oscuro/triste' or 'posiblemente alegre/brillante'}
   - Nombre del beat: "{parsed_data.get('beat_name')}"
   
   Ejemplos de mood: "Dark", "Melodic", "Aggressive", "Chill", "Energetic", "Emotional", "Atmospheric"

3. **DETERMINAR TIPO Y GÉNERO**:
   Basado en:
   - BPM range (ej: 140-150 = Trap/Drill, 90-100 = Reggaeton, 120-130 = Afrobeat)
   - Nombre del beat y artista de referencia
   - Type Beat mencionado
   
   Ejemplos: "Trap", "Drill", "Reggaeton", "Afrobeat", "Lo-fi", "Boom Bap"

4. **GENERAR TAGS INTELIGENTES**:
   REGLAS ESTRICTAS:
   - Máximo 1-3 palabras por tag
   - Preferiblemente 1 palabra
   - Entre 5-8 tags en total
   - Basados en: notas, progresión, mood, género, BPM, artista
   
   EJEMPLOS BUENOS:
   ✅ ["Dark", "Melodic", "Trap", "140BPM", "Minor"]
   ✅ ["Chill", "Lo-fi", "Jazzy", "90BPM"]
   ✅ ["Aggressive", "Drill", "UK Style"]
   
   EJEMPLOS MALOS (demasiado genéricos):
   ❌ ["beat", "instrumental", "music"]

5. **CONOCIMIENTO DEL ARTISTA** (si aplica):
   - Si reconoces al artista de referencia: {parsed_data.get('reference_artist')}
   - Sugiere género/estilo típico del artista
   - Añade tags relacionados al artista

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚙️ FORMATO DE RESPUESTA (SOLO JSON, SIN EXPLICACIÓN):

{{
  "key": "D Minor",
  "key_confidence": 70,
  "key_validated": true,
  "key_source": "ai_validation",
  "key_explanation": "Las notas D, F, A confirman D Minor",
  
  "mood": "Dark Melodic",
  "type": "Trap",
  "genre": "Trap",
  "subgenres": ["Hip-Hop", "Dark Trap"],
  
  "tags": ["Dark", "Melodic", "Trap", "140BPM", "D Minor", "Heavy Bass"],
  
  "description": "Beat de Trap oscuro y melódico con influencias de [Artista]. Tonalidad en D Minor con un BPM energético de 140, perfecto para flows agresivos.",
  
  "bpm_validated": {parsed_data.get('bpm') or audio_analysis.get('calculated_bpm')},
  "bpm_confidence": {parsed_data.get('bpm_confidence', audio_analysis.get('calculated_bpm_confidence', 50))},
  
  "artist_knowledge": {{
    "recognized": true,
    "typical_genre": "Trap",
    "style_notes": "Conocido por beats oscuros y melódicos"
  }}
}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RECUERDA: Retorna SOLO el JSON, sin markdown ni explicaciones adicionales.
"""
    
    try:
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Limpiar markdown si existe
        if '```json' in response_text:
            response_text = response_text.split('```json')[1].split('```')[0].strip()
        elif '```' in response_text:
            response_text = response_text.split('```')[1].split('```')[0].strip()
        
        gemini_data = json.loads(response_text)
        return gemini_data
        
    except Exception as e:
        print(f"⚠️ Error en Gemini: {e}", file=sys.stderr)
        return get_default_gemini_response()


def get_default_gemini_response():
    """
    Respuesta por defecto si Gemini no está disponible.
    """
    return {
        "key": None,
        "key_confidence": 0,
        "key_validated": False,
        "mood": "Unknown",
        "type": "Beat",
        "genre": "Unknown",
        "subgenres": [],
        "tags": [],
        "description": "",
        "bpm_validated": None,
        "bpm_confidence": 0,
        "artist_knowledge": {
            "recognized": False
        }
    }
```

### 5. Nueva Función: `combine_analysis_with_confidence()`

```python
def combine_analysis_with_confidence(parsed_data, audio_analysis, gemini_analysis):
    """
    Combina los 3 análisis con sistema de confianza.
    
    PRIORIDADES:
    - KEY: Parser (100) > Gemini (70) > Script (50)
    - BPM: Parser (100/95) > Script (50)
    - Mood/Tags/Genre: Solo Gemini
    
    Returns:
        Dict con metadata final consolidada
    """
    
    result = {
        "metadata_sources": {
            "filename_parser": True,
            "audio_analysis": True,
            "ai_analysis": bool(gemini_analysis.get('key'))
        }
    }
    
    # ============================================
    # DECISIÓN FINAL: KEY/ESCALA
    # ============================================
    if parsed_data.get('key') and parsed_data.get('key_confidence', 0) >= 95:
        # Nombre del archivo tiene KEY → VERIDICO
        result['key'] = parsed_data['key']
        result['key_confidence'] = parsed_data['key_confidence']
        result['key_source'] = 'filename'
        result['key_verified'] = True
        
    elif gemini_analysis.get('key') and gemini_analysis.get('key_validated'):
        # IA validó KEY
        result['key'] = gemini_analysis['key']
        result['key_confidence'] = gemini_analysis.get('key_confidence', 70)
        result['key_source'] = 'ai_validation'
        result['key_verified'] = True
        
    elif audio_analysis.get('suggested_key'):
        # Script sugirió KEY (baja confianza)
        result['key'] = audio_analysis['suggested_key']
        result['key_confidence'] = 50
        result['key_source'] = 'audio_analysis_suggestion'
        result['key_verified'] = False
        result['key_warning'] = 'Escala sugerida, por favor verifica'
        
    else:
        result['key'] = None
        result['key_confidence'] = 0
        result['key_source'] = 'none'
    
    # ============================================
    # DECISIÓN FINAL: BPM
    # ============================================
    if parsed_data.get('bpm') and parsed_data.get('bpm_confidence', 0) >= 95:
        # BPM del nombre → VERIDICO o ALTA confianza
        result['bpm'] = parsed_data['bpm']
        result['bpm_confidence'] = parsed_data['bpm_confidence']
        result['bpm_source'] = 'filename'
        result['bpm_verified'] = True
        
    elif audio_analysis.get('calculated_bpm'):
        # BPM calculado (baja confianza)
        result['bpm'] = audio_analysis['calculated_bpm']
        result['bpm_confidence'] = 50
        result['bpm_source'] = 'audio_analysis_calculation'
        result['bpm_verified'] = False
        result['bpm_warning'] = 'BPM calculado automáticamente, por favor verifica'
        
    else:
        result['bpm'] = None
        result['bpm_confidence'] = 0
        result['bpm_source'] = 'none'
    
    # ============================================
    # OTROS CAMPOS (solo de Gemini o parser)
    # ============================================
    result['beat_name'] = parsed_data.get('beat_name')
    result['reference_artist'] = parsed_data.get('reference_artist')
    result['beat_type'] = parsed_data.get('beat_type') or gemini_analysis.get('type')
    
    result['mood'] = gemini_analysis.get('mood', 'Unknown')
    result['genre'] = gemini_analysis.get('genre', 'Beat')
    result['subgenres'] = gemini_analysis.get('subgenres', [])
    result['tags'] = gemini_analysis.get('tags', [])
    result['description'] = gemini_analysis.get('description', '')
    
    result['is_demo'] = parsed_data.get('is_demo', False)
    result['is_tagged'] = parsed_data.get('is_tagged', False)
    
    # Info adicional para debugging
    result['_debug'] = {
        "parsed_key": parsed_data.get('key'),
        "audio_suggested_key": audio_analysis.get('suggested_key'),
        "gemini_validated_key": gemini_analysis.get('key'),
        "detected_notes": audio_analysis.get('detected_notes', []),
        "chord_progression": audio_analysis.get('chord_progression', [])
    }
    
    return result
```

---

## 📤 Formato de Salida Final

El script debe retornar un JSON con este formato:

```json
{
  "beat_name": "Sicario",
  "beat_type": "Type Beat",
  "reference_artist": "Drake",
  
  "key": "D Minor",
  "key_confidence": 100,
  "key_source": "filename",
  "key_verified": true,
  
  "bpm": 140,
  "bpm_confidence": 95,
  "bpm_source": "filename",
  "bpm_verified": true,
  
  "mood": "Dark Melodic",
  "genre": "Trap",
  "subgenres": ["Hip-Hop", "Dark Trap"],
  "type": "Trap",
  
  "tags": ["Dark", "Melodic", "Trap", "140BPM", "D Minor", "Drake Style"],
  
  "description": "Beat de Trap oscuro y melódico con influencias de Drake. Tonalidad en D Minor con un BPM energético de 140, perfecto para flows agresivos y letras introspectivas.",
  
  "is_demo": false,
  "is_tagged": false,
  
  "metadata_sources": {
    "filename_parser": true,
    "audio_analysis": true,
    "ai_analysis": true
  }
}
```

---

## 🔗 Integración en Frontend

En `producer.html`, el JavaScript debe:

```javascript
async function handleAnalysisResponse(analysisData) {
  // KEY
  if (analysisData.key) {
    document.getElementById('keyField').value = analysisData.key;
    
    if (analysisData.key_verified && analysisData.key_confidence === 100) {
      // Marcar como VERIDICO (verde)
      document.getElementById('keyField').style.borderColor = '#10b981';
      document.getElementById('keyField').style.backgroundColor = '#d1fae5';
    } else if (analysisData.key_confidence >= 70) {
      // IA validó (amarillo)
      document.getElementById('keyField').style.borderColor = '#f59e0b';
      showNotification('ℹ️ Escala validada por IA', 'info');
    } else {
      // Sugerencia (rojo suave)
      document.getElementById('keyField').style.borderColor = '#f59e0b';
      showNotification('⚠️ Escala sugerida. Verifica.', 'warning');
    }
  }
  
  // BPM
  if (analysisData.bpm) {
    document.getElementById('bpmField').value = analysisData.bpm;
    
    if (!analysisData.bpm_verified || analysisData.bpm_confidence < 95) {
      showNotification('⚠️ BPM sugerido. Verifica que sea correcto.', 'warning');
      document.getElementById('bpmField').style.borderColor = '#f59e0b';
      document.getElementById('bpmField').focus();
    } else {
      document.getElementById('bpmField').style.borderColor = '#10b981';
    }
  }
  
  // Otros campos
  if (analysisData.beat_name) {
    document.getElementById('beatName').value = analysisData.beat_name;
  }
  
  if (analysisData.mood) {
    document.getElementById('moodField').value = analysisData.mood;
  }
  
  if (analysisData.tags && analysisData.tags.length > 0) {
    document.getElementById('tags').value = analysisData.tags.join(', ');
  }
  
  if (analysisData.description) {
    document.getElementById('description').value = analysisData.description;
  }
  
  if (analysisData.beat_type) {
    document.getElementById('beatType').value = analysisData.beat_type;
  }
}
```

---

## ✅ Checklist de Implementación

- [ ] Importar `parse_filename_improved` en `analyze_beat_ai.py`
- [ ] Crear función `analyze_beat_complete()`
- [ ] Crear función `analyze_audio_technical()`
- [ ] Crear función `suggest_key_from_notes()`
- [ ] Crear función `query_gemini_with_context()` con prompt estructurado
- [ ] Crear función `combine_analysis_with_confidence()`
- [ ] Modificar main para usar nueva estructura
- [ ] Probar con archivos de ejemplo
- [ ] Integrar en `server.js`
- [ ] Actualizar `producer.html` para recibir nuevo formato
- [ ] Implementar indicadores visuales de confianza
- [ ] Probar flujo end-to-end

---

## 🧪 Tests Sugeridos

```bash
# Test 1: Metadata completa en nombre
python3 analyze_beat_ai.py "Drake Type Beat - Sicario - Dm 140.mp3" audio.mp3

# Test 2: Solo BPM en nombre
python3 analyze_beat_ai.py "Trap Beat 150.mp3" audio.mp3

# Test 3: Sin metadata en nombre
python3 analyze_beat_ai.py "beat_final_v3.mp3" audio.mp3

# Test 4: Metadata en paréntesis
python3 analyze_beat_ai.py "[TAGGED] Beat (95 BPM) [Am].mp3" audio.mp3
```

---

**Estado:** Especificaciones completas listas para implementación
**Próximo paso:** Modificar `analyze_beat_ai.py` según este documento
