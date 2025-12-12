import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv('GEMINI_API_KEY')
print(f'API Key: {API_KEY[:20]}...')

genai.configure(api_key=API_KEY)

prompt = '''¿Conoces al artista Travis Scott? Responde SOLO con este JSON:
{"artist_known": true, "tags": ["Cm", "140BPM", "Dark", "Trap", "Travis Scott Type", "Rage", "808 Heavy"], "mood": "Dark", "genre": "Trap"}'''

print('\n🤖 Consultando Gemini...')
model = genai.GenerativeModel('gemini-2.5-flash')
response = model.generate_content(prompt)
print('\n=== RESPUESTA RAW ===')
print(response.text)
print('\n=== PARSEANDO JSON ===')
text = response.text.strip()
if '```json' in text:
    text = text.split('```json')[1].split('```')[0].strip()
elif '```' in text:
    text = text.split('```')[1].split('```')[0].strip()
try:
    result = json.loads(text)
    print('✅ JSON VÁLIDO:')
    print(json.dumps(result, indent=2))
except Exception as e:
    print(f'❌ ERROR: {e}')
