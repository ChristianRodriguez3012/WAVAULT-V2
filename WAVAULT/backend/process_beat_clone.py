#!/usr/bin/env python3
"""
Script: process_beat_clone.py
Propósito: Crear un clon del beat con baja calidad + tag WAVAULT insertado
Ubicación: /WAVAULT/backend/

Uso:
    python3 process_beat_clone.py <input_path> <output_path> [delay_tag_ms]

Ejemplo:
    python3 process_beat_clone.py /uploads/audio/beat.mp3 /uploads/audio/beat_clone.mp3 2000
"""

import sys
import os
import subprocess
import time

def get_duration(audio_path):
    """Obtiene duración del audio en ms usando ffprobe"""
    try:
        cmd = [
            "ffprobe",
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1:noprint_wrappers=1",
            audio_path
        ]
        result = subprocess.run(cmd, stdout=subprocess.PIPE, text=True, timeout=30)
        if result.returncode == 0:
            duration_sec = float(result.stdout.strip())
            return int(duration_sec * 1000)  # Convertir a ms
    except:
        pass
    return None


def process_beat_clone(input_path, output_path, tag_delay_ms=2000):
    """
    Crea un clon del beat con:
    - Calidad reducida (128 kbps)
    - Tag WAVAULT al inicio (en delay_ms)
    - Tag WAVAULT al final (3 segundos antes de terminar)
    
    Args:
        input_path: Ruta al archivo original
        output_path: Ruta donde guardar el clon procesado
        tag_delay_ms: Milisegundos para insertar el tag inicial (default 2000ms)
    
    Returns:
        bool: True si éxito, False si error
    """
    
    # Validar entrada
    if not os.path.exists(input_path):
        print(f"❌ Error: Archivo no encontrado: {input_path}")
        return False
    
    # Ruta del tag WAVAULT
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    tag_path = os.path.join(backend_dir, "assets", "tag.mp3")
    
    if not os.path.exists(tag_path):
        print(f"⚠️  Aviso: Tag WAVAULT no encontrado en {tag_path}")
        print("   Procesando solo reducción de calidad...")
        has_tag = False
    else:
        has_tag = True
        print(f"✅ Tag WAVAULT encontrado: {tag_path}")
    
    print(f"\n🎵 Procesando beat clone...")
    print(f"   📥 Entrada: {input_path}")
    print(f"   📤 Salida: {output_path}")
    
    try:
        # Crear directorio de salida si no existe
        output_dir = os.path.dirname(output_path)
        os.makedirs(output_dir, exist_ok=True)
        
        if has_tag:
            # Obtener duración del beat original
            duration_ms = get_duration(input_path)
            
            if duration_ms:
                print(f"   ⏱️  Duración detectada: {duration_ms / 1000:.1f}s")
                # Tag final: 3 segundos antes del fin
                tag_end_delay_ms = max(0, duration_ms - 3000)
                print(f"   🔔 Tags insertados en: {tag_delay_ms}ms (inicio) y {tag_end_delay_ms}ms (3s antes del fin)")
                
                # FFmpeg: Beat original + 2 Tags WAVAULT (uno al inicio, otro al final)
                # Filter: [0:a] original | [1:a] tag1 con delay inicial | [2:a] tag2 con delay final | merge todos
                filter_complex = (
                    f"[1:a]adelay={tag_delay_ms}|{tag_delay_ms},volume=0.4[tag1];"
                    f"[1:a]adelay={tag_end_delay_ms}|{tag_end_delay_ms},volume=0.4[tag2];"
                    f"[0:a][tag1][tag2]amix=inputs=3:duration=first[out]"
                )
            else:
                print(f"   ⚠️  No se pudo detectar duración, usando solo tag inicial")
                filter_complex = (
                    f"[1:a]adelay={tag_delay_ms}|{tag_delay_ms},volume=0.4[tag];"
                    f"[0:a][tag]amix=inputs=2:duration=first[out]"
                )
            
            # FFmpeg: Beat original + Tag WAVAULT con delays + Reducción de calidad
            cmd = [
                "ffmpeg",
                "-i", input_path,
                "-i", tag_path,
                "-filter_complex",
                filter_complex,
                "-map", "[out]",
                "-b:a", "128k",  # Calidad: 128 kbps (reducida)
                "-acodec", "libmp3lame",
                "-q:a", "6",  # Calidad MP3 (6 = bueno, 128kbps)
                "-y",  # Sobrescribir sin preguntar
                output_path
            ]
        else:
            # Solo reducción de calidad sin tag
            cmd = [
                "ffmpeg",
                "-i", input_path,
                "-b:a", "128k",  # Calidad: 128 kbps
                "-acodec", "libmp3lame",
                "-q:a", "6",  # Calidad MP3
                "-y",
                output_path
            ]
        
        print(f"\n⚙️  Ejecutando FFmpeg...")
        print(f"   Bitrate: 128 kbps")
        print(f"   Codec: MP3 (libmp3lame)")
        if has_tag:
            print(f"   Tags: Inicio ({tag_delay_ms}ms) + Final (3s antes de terminar)")
            print(f"   Volumen tags: 0.4 (40%)")
        
        # Ejecutar con supresión de output verbose
        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=300  # 5 minutos max
        )
        
        if result.returncode == 0:
            # Verificar que el archivo se creó
            if os.path.exists(output_path):
                file_size = os.path.getsize(output_path) / (1024 * 1024)  # MB
                print(f"\n✅ Clone procesado exitosamente")
                print(f"   📦 Tamaño: {file_size:.2f} MB")
                print(f"   📁 Ruta: {output_path}")
                return True
            else:
                print(f"\n❌ Error: FFmpeg no creó el archivo de salida")
                return False
        else:
            print(f"\n❌ Error en FFmpeg:")
            if result.stderr:
                # Mostrar solo las líneas importantes del error
                error_lines = result.stderr.split('\n')
                for line in error_lines:
                    if 'error' in line.lower() or 'invalid' in line.lower():
                        print(f"   {line}")
            return False
            
    except subprocess.TimeoutExpired:
        print(f"\n❌ Error: Procesamiento tardó demasiado (>5 minutos)")
        return False
    except Exception as e:
        print(f"\n❌ Error inesperado: {str(e)}")
        return False


def main():
    """Entry point del script"""
    
    if len(sys.argv) < 3:
        print("Uso: python3 process_beat_clone.py <input> <output> [delay_ms]")
        print("\nEjemplo:")
        print("  python3 process_beat_clone.py input.mp3 output_clone.mp3")
        print("  python3 process_beat_clone.py input.mp3 output_clone.mp3 3000")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    delay_ms = int(sys.argv[3]) if len(sys.argv) > 3 else 2000
    
    start_time = time.time()
    success = process_beat_clone(input_file, output_file, delay_ms)
    elapsed = time.time() - start_time
    
    print(f"\n⏱️  Tiempo total: {elapsed:.2f}s")
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
