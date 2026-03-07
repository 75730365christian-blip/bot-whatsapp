#!/usr/bin/env bash
set -o errexit

echo "🚀 Iniciando script de build para Render..."

# 1. Instalar dependencias
echo "📦 Instalando dependencias con npm..."
npm install

# 2. Instalar Chrome
echo "🌐 Instalando Chrome..."
npx puppeteer browsers install chrome

# 3. Guardar la ruta de Chrome (DESPUÉS de instalado)
echo "🔍 Buscando Chrome instalado..."
CHROME_PATH=$(find /opt/render -name chrome -type f 2>/dev/null | head -1)

if [ -n "$CHROME_PATH" ]; then
    echo "✅ Chrome encontrado en: $CHROME_PATH"
    
    # 🔥 NUEVO: Crear el directorio si no existe
    mkdir -p /opt/render/project/src
    
    # Guardar la ruta
    echo "$CHROME_PATH" > /opt/render/project/src/chrome.path
    echo "📝 Ruta guardada en /opt/render/project/src/chrome.path"
    
    # 🔥 NUEVO: Verificar que se guardó correctamente
    echo "🔍 Verificando contenido del archivo:"
    cat /opt/render/project/src/chrome.path
else
    echo "❌ No se encontró Chrome después de la instalación"
    exit 1
fi

echo "✅ Build completado exitosamente."
echo "🎉 Script finalizado."