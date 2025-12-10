#!/bin/bash

# Test de estructura de base de datos WAVAULT

echo "🔍 Verificando estructura de la base de datos..."
echo ""

DB_PATH="/workspaces/WAVAULT-V2/WAVAULT/backend/wavault.db"

echo "📊 Tabla: beats"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sqlite3 "$DB_PATH" "PRAGMA table_info(beats);"
echo ""

echo "📊 Conteo de beats:"
sqlite3 "$DB_PATH" "SELECT COUNT(*) as total FROM beats;"
echo ""

echo "📊 Últimos 3 beats (si existen):"
sqlite3 "$DB_PATH" "SELECT id, title, artist, type, bpm, key, price FROM beats ORDER BY id DESC LIMIT 3;" 2>/dev/null || echo "No hay beats aún"
echo ""

echo "✅ Verificación completada"
