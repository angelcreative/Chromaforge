#!/bin/bash

# Script para ejecutar el servidor localmente

echo "🚀 Iniciando ChromaForge localmente..."
echo ""

# Verificar si API_KEY está configurada
if [ -z "$API_KEY" ]; then
    echo "⚠️  ADVERTENCIA: API_KEY no está configurada"
    echo ""
    echo "Para configurarla, ejecuta:"
    echo "  export API_KEY='tu_api_key_de_gemini'"
    echo ""
    echo "O crea un archivo .env.local con:"
    echo "  API_KEY=tu_api_key_de_gemini"
    echo ""
    echo "Obtén tu API key desde: https://makersuite.google.com/app/apikey"
    echo ""
    read -p "¿Quieres continuar de todas formas? (s/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[SsYy]$ ]]; then
        echo "❌ Cancelado. Configura API_KEY y vuelve a intentar."
        exit 1
    fi
    echo ""
fi

# Verificar que el build esté completo
if [ ! -d "dist" ] || [ ! -f "dist-server/server.js" ]; then
    echo "📦 Construyendo proyecto..."
    npm run build
    echo ""
fi

echo "✅ Iniciando servidor en http://localhost:8080"
echo "   Presiona Ctrl+C para detener"
echo ""

# Ejecutar servidor
PORT=8080 node dist-server/server.js

