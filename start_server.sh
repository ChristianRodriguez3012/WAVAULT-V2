#!/bin/bash
# start_server.sh
# Script para iniciar el servidor con variables de entorno

export GEMINI_API_KEY="AIzaSyBqreeolm2eh4e0SIoELyDGRT4EaT81aI4"

cd /workspaces/WAVAULT-V2/WAVAULT/backend
node server.js
