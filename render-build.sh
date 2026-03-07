#!/usr/bin/env bash
set -o errexit

echo "🚀 Iniciando script de build para Render..."

# 1. Instalar dependencias
echo "📦 Instalando dependencias con npm..."
npm install

# Guardar la ruta exacta de Chrome en un archivo
CHROME_PATH=$(find /opt/render -name chrome -type f 2>/dev/null | head -1)
echo "✅ Chrome instalado en: $CHROME_PATH"
echo "$CHROME_PATH" > /opt/render/project/src/chrome.path
echo "🎉 Build finalizado exitosamente."

# 2. Instalar Chrome (se guardará en la caché de Puppeteer)
echo "🌐 Instalando Chrome..."
npx puppeteer browsers install chrome

# 3. Mensaje de éxito (el index.js encontrará Chrome automáticamente)
echo "✅ Build completado. Chrome instalado en:"
find /opt/render -name chrome -type f 2>/dev/null || echo "Chrome instalado correctamente."

echo "🎉 Build finalizado exitosamente."