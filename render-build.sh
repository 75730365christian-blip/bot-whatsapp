#!/usr/bin/env bash

# Salir si hay algún error
set -o errexit

echo "🚀 Iniciando script de build para Render..."

# Instalar dependencias de Node.js
echo "📦 Instalando dependencias con npm..."
npm install

# Definir y crear el directorio de caché de Puppeteer
PUPPETEER_CACHE_DIR="/opt/render/.cache/puppeteer"
echo "🗂️  Asegurando que el directorio de caché exista: $PUPPETEER_CACHE_DIR"
mkdir -p $PUPPETEER_CACHE_DIR

# Instalar Chrome usando la herramienta oficial de Puppeteer
echo "🌐 Instalando Chrome con npx puppeteer browsers install chrome..."
npx puppeteer browsers install chrome

# --- ¡¡¡ PARTE CLAVE !!! ---
# Copiar Chrome instalado al directorio de caché para asegurar su persistencia
echo "📋 Copiando Chrome al directorio de caché..."
# La ruta exacta puede variar ligeramente, usamos un comando más flexible para copiar
if [ -d "/opt/render/project/src/.cache/puppeteer/chrome" ]; then
    cp -R /opt/render/project/src/.cache/puppeteer/chrome/* $PUPPETEER_CACHE_DIR/ || true
    echo "✅ Chrome copiado exitosamente."
else
    echo "⚠️ No se encontró Chrome en la ruta de origen para copiar. Puede que ya esté en el destino."
fi

echo "🎉 Script de build finalizado."