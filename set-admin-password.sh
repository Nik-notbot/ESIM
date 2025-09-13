#!/bin/bash

# Скрипт для установки ADMIN_PASSWORD в Netlify
# Запустите: bash set-admin-password.sh

echo "🔧 Установка ADMIN_PASSWORD в Netlify..."

# Проверяем наличие Netlify CLI
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI не установлен"
    echo "Установите: npm install -g netlify-cli"
    exit 1
fi

# Устанавливаем переменную окружения
netlify env:set ADMIN_PASSWORD "JlHhWO2hoU2"

echo "✅ ADMIN_PASSWORD установлен!"
echo "🔄 Перезапустите сайт для применения изменений"