import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv('GEMINI_API_KEY')
genai.configure(api_key=API_KEY)

print("🔍 PROBANDO BÚSQUEDA EN INTERNET (Google Search Grounding)...\n")

try:
    # Intentar con grounding
    from google.generativeai.types import Tool, GoogleSearchRetrieval
    
    model = genai.GenerativeModel(
        'gemini-2.5-flash',
        tools=[Tool(google_search_retrieval=GoogleSearchRetrieval())]
    )
    
    response = model.generate_content(
        "¿Quién es Travis Scott? Dame su género musical y estilo en 2-3 líneas."
    )
    
    print("✅ BÚSQUEDA EN INTERNET FUNCIONA EN TU PLAN!")
    print(f"\nRespuesta con datos de internet:\n{response.text}\n")
    
    # Verificar si tiene metadata de grounding
    if hasattr(response, 'candidates') and response.candidates:
        candidate = response.candidates[0]
        if hasattr(candidate, 'grounding_metadata'):
            print("✅ Grounding Metadata presente:")
            print(candidate.grounding_metadata)
    
except AttributeError as e:
    print(f"⚠️  GoogleSearchRetrieval no disponible en esta versión del SDK")
    print(f"Error: {e}")
    print("\n💡 Intentando método alternativo...")
    
    # Método alternativo sin grounding explícito
    model = genai.GenerativeModel('gemini-2.5-flash')
    response = model.generate_content(
        "Busca en internet: ¿Quién es Travis Scott y cuál es su género musical?"
    )
    print(f"Respuesta: {response.text[:300]}")
    
except Exception as e:
    error_msg = str(e)
    print(f"❌ ERROR: {error_msg[:500]}")
    
    if '400' in error_msg and 'tools' in error_msg.lower():
        print("\n❌ Google Search Grounding NO está disponible en el plan FREE")
        print("   Solo disponible en Vertex AI (Google Cloud, de pago)")
    elif 'not supported' in error_msg.lower():
        print("\n❌ Grounding no soportado en este modelo/plan")
    elif 'quota' in error_msg.lower() or '429' in error_msg:
        print("\n⚠️  Límite de quota alcanzado")

