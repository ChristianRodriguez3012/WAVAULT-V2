import sys
import subprocess
import os

if len(sys.argv) != 3:
    print("Uso: python generar_demo.py <input.mp3> <output_demo.mp3>")
    sys.exit(1)

input_path = sys.argv[1]
output_path = sys.argv[2]

tag_path = os.path.join(os.path.dirname(__file__), "assets", "tag.mp3")

if not os.path.exists(tag_path):
    print(f"❌ Error: No se encontró el archivo de tag en {tag_path}")
    sys.exit(1)

# Obtener duración del beat original
probe_cmd = [
    "ffprobe", "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", input_path
]

try:
    duration_result = subprocess.run(probe_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    duration = float(duration_result.stdout.decode().strip())
except Exception as e:
    print("❌ Error obteniendo duración:", e)
    sys.exit(1)

delay1 = 5000
delay2 = int((duration - 5) * 1000) if duration > 10 else None

# Filtro complejo FFmpeg que mezcla el beat con dos copias del tag en momentos diferentes
filter_parts = [
    f"[1:a]adelay={delay1}|{delay1},volume=0.6[tag1]"
]
if delay2:
    filter_parts.append(f"[1:a]adelay={delay2}|{delay2},volume=0.6[tag2]")

inputs = "[0:a]" + "".join(f"[tag{i}]" for i in range(1, (3 if delay2 else 2)))
amix_count = 1 + (2 if delay2 else 1)

filter_parts.append(f"{inputs}amix=inputs={amix_count}:duration=first:dropout_transition=0[aout]")

ffmpeg_cmd = [
    "ffmpeg", "-y",
    "-i", input_path,
    "-i", tag_path,
    "-filter_complex", ";".join(filter_parts),
    "-map", "[aout]",
    "-b:a", "128k",
    output_path
]

try:
    subprocess.run(ffmpeg_cmd, stderr=subprocess.PIPE, check=True)
    print("✅ Demo generado con éxito.")
except subprocess.CalledProcessError as e:
    print("❌ Error generando demo:", e.stderr.decode())
    sys.exit(1)
