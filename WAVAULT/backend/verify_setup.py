#!/usr/bin/env python3
"""
verify_setup.py
Verifica que la configuración de WAVAULT-V2 esté correcta
"""

import os
import sys
from dotenv import load_dotenv

def check_env_file():
    """Verifica que existe el archivo .env"""
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_path):
        print("✅ Archivo .env encontrado")
        return True
    else:
        print("❌ Archivo .env NO encontrado")
        return False

def check_api_key():
    """Verifica que la API key está cargada"""
    load_dotenv()
    api_key = os.getenv('GEMINI_API_KEY')
    if api_key and api_key != 'tu_api_key_aqui':
        print(f"✅ GEMINI_API_KEY cargada: {api_key[:10]}...")
        return True
    else:
        print("❌ GEMINI_API_KEY NO configurada correctamente")
        return False

def check_dependencies():
    """Verifica que las dependencias están instaladas"""
    try:
        import librosa
        import numpy
        import scipy
        import google.generativeai as genai
        import requests
        import bs4
        print("✅ Todas las dependencias de Python instaladas")
        return True
    except ImportError as e:
        print(f"❌ Falta dependencia: {e}")
        return False

def check_scripts():
    """Verifica que existen los scripts necesarios"""
    scripts = [
        'analyze_beat_ai.py',
        'parse_filename_ai.py',
        'metadata_enrichment.py',
        'server.js'
    ]
    
    all_found = True
    for script in scripts:
        script_path = os.path.join(os.path.dirname(__file__), script)
        if os.path.exists(script_path):
            print(f"✅ {script} encontrado")
        else:
            print(f"❌ {script} NO encontrado")
            all_found = False
    
    return all_found

def main():
    print("=" * 60)
    print("VERIFICACIÓN DE CONFIGURACIÓN DE WAVAULT-V2")
    print("=" * 60)
    print()
    
    checks = {
        "Archivo .env": check_env_file(),
        "API Key": check_api_key(),
        "Dependencias Python": check_dependencies(),
        "Scripts necesarios": check_scripts()
    }
    
    print()
    print("=" * 60)
    print("RESUMEN")
    print("=" * 60)
    
    for check_name, result in checks.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{check_name}: {status}")
    
    print()
    
    if all(checks.values()):
        print("🎉 ¡Configuración completa y correcta!")
        print("✅ El servidor está listo para iniciarse")
        print()
        print("Para iniciar el servidor:")
        print("  ./start_server.sh")
        print("  o")
        print("  npm start")
        return 0
    else:
        print("⚠️  Hay problemas con la configuración")
        print("Por favor revisa los errores arriba")
        return 1

if __name__ == "__main__":
    sys.exit(main())
