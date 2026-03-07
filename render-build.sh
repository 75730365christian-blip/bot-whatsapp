#!/usr/bin/env bash
set -o errexit

echo "🚀 Iniciando script de build optimizado para Render..."

# Instalar dependencias
echo "📦 Instalando dependencias con npm..."
npm install

# Definir y limpiar directorio de caché
PUPPETEER_CACHE_DIR="/opt/render/.cache/puppeteer"
echo "🗂️ Preparando directorio de caché: $PUPPETEER_CACHE_DIR"
rm -rf $PUPPETEER_CACHE_DIR
mkdir -p $PUPPETEER_CACHE_DIR

# Instalar Chrome
echo "🌐 Instalando Chrome..."
npx puppeteer browsers install chrome

# Buscar dónde se instaló realmente Chrome
echo "🔍 Buscando la instalación de Chrome..."
CHROME_PATH=$(find /opt/render -name chrome -type f 2>/dev/null | head -1)

if [ -n "$CHROME_PATH" ]; then
    echo "✅ Chrome encontrado en: $CHROME_PATH"
    
    # Crear estructura de directorios esperada por tu index.js
    TARGET_DIR="$PUPPETEER_CACHE_DIR/chrome/linux-145.0.7632.77/chrome-linux64"
    mkdir -p "$TARGET_DIR"
    
    # Copiar Chrome a la ruta esperada
    cp "$CHROME_PATH" "$TARGET_DIR/chrome"
    chmod +x "$TARGET_DIR/chrome"
    echo "✅ Chrome copiado a la ruta esperada"
else
    echo "❌ No se pudo encontrar Chrome después de la instalación"
    exit 1
fi

echo "🎉 Build completado exitosamente"