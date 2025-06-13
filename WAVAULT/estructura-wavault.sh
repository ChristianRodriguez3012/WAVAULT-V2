#!/bin/bash

echo "📁 Reorganizando estructura del proyecto WAVAULT..."

# 1. Crear carpetas si no existen
mkdir -p public/assets/js

# 2. Mover archivos de frontend
mv index.html public/ 2>/dev/null
mv login.html public/ 2>/dev/null
mv registro.html public/ 2>/dev/null

# 3. Mover carpetas de frontend si están sueltas
if [ -d "assets" ]; then
  mv assets/js public/assets/ 2>/dev/null
  rm -r assets
fi

# 4. Mover scripts principales
mv client.js public/assets/js/app.js 2>/dev/null
mv producer.js public/assets/js/app.js 2>/dev/null

# 5. Verifica si ya existe server.js o db.js
touch server.js
touch db.js

# 6. Mensaje final
echo "✅ Estructura reorganizada con éxito."
echo "📂 Estructura final:"
tree -L 3
