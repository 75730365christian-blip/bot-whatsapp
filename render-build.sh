#!/usr/bin/env bash
set -o errexit

echo "🚀 Iniciando script de build para Render..."

# 1. Instalar dependencias
echo "📦 Instalando dependencias con npm..."
npm install

# 2. Definir directorio de instalación de Chrome (MÁS PERSISTENTE)
CHROME_INSTALL_DIR="/opt/render/project/chrome"
mkdir -p $CHROME_INSTALL_DIR

# 3. Instalar Chrome en el directorio personalizado
echo "🌐 Instalando Chrome en $CHROME_INSTALL_DIR..."
npx @puppeteer/browsers install chrome@stable --path $CHROME_INSTALL_DIR

# 4. Buscar el ejecutable de Chrome
CHROME_PATH=$(find $CHROME_INSTALL_DIR -name chrome -type f 2>/dev/null | head -1)

if [ -n "$CHROME_PATH" ]; then
    echo "✅ Chrome instalado en: $CHROME_PATH"
    
    # Dar permisos de ejecución
    chmod +x "$CHROME_PATH"
    
    # Guardar la ruta en un archivo (por si acaso)
    echo "$CHROME_PATH" > /opt/render/project/src/chrome.path
    echo "📝 Ruta guardada en /opt/render/project/src/chrome.path"
    
    # Verificar
    echo "🔍 Verificando ejecutable:"
    ls -la "$CHROME_PATH"
else
    echo "❌ No se encontró Chrome después de la instalación"
    exit 1
fi

echo "✅ Build completado exitosamente."
echo "🎉 Script finalizado."