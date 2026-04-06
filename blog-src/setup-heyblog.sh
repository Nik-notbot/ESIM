#!/bin/bash

# ===========================================
# HEY, BLOG! — Setup Script
# Запускай из корня проекта: ./setup.sh
# ===========================================

set -e

echo "🚀 Настройка HEY, BLOG!..."
echo ""

# --- 1. Очистка ---
echo "🧹 Очистка демо-контента..."
rm -rf content/blog/*
rm -rf content/pages/*
rm -f TASK.md changelog.md files.md netlify-deploy-fix.md 2>/dev/null || true
rm -rf prds/ .cursor/
rm -f public/images/*.png public/images/*.jpg 2>/dev/null || true
rm -f public/images/og-default.svg public/images/logo.svg 2>/dev/null || true

# --- 2. Создаём AdminContext ---
echo "🔐 Добавляю систему админки..."
mkdir -p src/context

cat > src/context/AdminContext.tsx << 'EOF'
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AdminContextType {
  isAdmin: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// Простой пароль — СМЕНИ ЕГО!
const ADMIN_PASSWORD = "heyblog2025";

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("heyblog_admin");
    if (stored === "true") {
      setIsAdmin(true);
    }
  }, []);

  const login = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      localStorage.setItem("heyblog_admin", "true");
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    localStorage.removeItem("heyblog_admin");
  };

  return (
    <AdminContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within AdminProvider");
  }
  return context;
}
EOF

# --- 3. Создаём страницу /admin ---
echo "📄 Создаю страницу админки..."

cat > src/pages/Admin.tsx << 'EOF'
import { useState } from "react";
import { useAdmin } from "../context/AdminContext";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const { isAdmin, login, logout } = useAdmin();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(password)) {
      navigate("/");
    } else {
      setError(true);
      setPassword("");
    }
  };

  if (isAdmin) {
    return (
      <div className="admin-page">
        <h1>Админка</h1>
        <p>✅ Ты авторизован. Copy Page теперь доступен на страницах статей.</p>
        <button onClick={logout} className="admin-btn">
          Выйти
        </button>
        <button onClick={() => navigate("/")} className="admin-btn secondary">
          На главную
        </button>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h1>Вход</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(false);
          }}
          placeholder="Пароль"
          className="admin-input"
          autoFocus
        />
        <button type="submit" className="admin-btn">
          Войти
        </button>
        {error && <p className="admin-error">Неверный пароль</p>}
      </form>
    </div>
  );
}
EOF

# --- 4. Добавляем стили админки ---
echo "🎨 Добавляю стили..."

cat >> src/styles/global.css << 'EOF'

/* Admin Page Styles */
.admin-page {
  max-width: 400px;
  margin: 100px auto;
  padding: 2rem;
  text-align: center;
}

.admin-page h1 {
  margin-bottom: 1.5rem;
}

.admin-input {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 1px solid var(--border-color, #ccc);
  border-radius: 8px;
  margin-bottom: 1rem;
  background: var(--bg-color, #fff);
  color: var(--text-color, #000);
}

.admin-btn {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border: none;
  border-radius: 8px;
  background: var(--accent-color, #007bff);
  color: white;
  cursor: pointer;
  margin: 0.5rem;
}

.admin-btn:hover {
  opacity: 0.9;
}

.admin-btn.secondary {
  background: var(--border-color, #ccc);
  color: var(--text-color, #000);
}

.admin-error {
  color: #e74c3c;
  margin-top: 1rem;
}
EOF

# --- 5. Шаблон первой статьи ---
echo "✨ Создаю первую статью..."

cat > content/blog/hello-world.md << 'EOF'
---
title: "Добро пожаловать"
description: "Первая статья в HEY, BLOG!"
date: "2025-01-15"
slug: "hello-world"
published: true
tags: ["intro"]
readTime: "1 min"
---

## Привет!

Это первая статья в моём блоге.

### Что здесь будет

- Статьи на интересные темы
- Код и примеры
- Полезные материалы

```javascript
console.log("HEY, BLOG!");
```

Добро пожаловать!
EOF

# --- 6. README ---
echo "📖 Обновляю README..."

cat > README.md << 'EOF'
# HEY, BLOG!

Минималистичный блог на Markdown.

## Запуск

```bash
npm install
npx convex dev      # терминал 1
npm run dev         # терминал 2
```

## Статьи

Создавай `.md` файлы в `content/blog/`, затем `npm run sync`.

## Админка

Зайди на `/admin` и введи пароль для доступа к Copy Page.

**Смени пароль** в `src/context/AdminContext.tsx`:
```tsx
const ADMIN_PASSWORD = "твой_новый_пароль";
```
EOF

# --- 7. Инструкции по интеграции ---
echo ""
echo "✅ Файлы созданы!"
echo ""
echo "⚠️  ВАЖНО: Нужно вручную сделать 3 правки:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1️⃣  src/main.tsx — добавь AdminProvider:"
echo ""
echo '   import { AdminProvider } from "./context/AdminContext";'
echo ""
echo "   Оберни <App /> в <AdminProvider>:"
echo ""
echo "   <AdminProvider>"
echo "     <App />"
echo "   </AdminProvider>"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "2️⃣  src/App.tsx — добавь роут /admin:"
echo ""
echo '   import Admin from "./pages/Admin";'
echo ""
echo '   <Route path="/admin" element={<Admin />} />'
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "3️⃣  В компоненте CopyPage (или там где он) добавь:"
echo ""
echo '   import { useAdmin } from "../context/AdminContext";'
echo ""
echo "   И внутри компонента:"
echo ""
echo "   const { isAdmin } = useAdmin();"
echo "   if (!isAdmin) return null;"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "4️⃣  src/pages/Home.tsx — измени siteConfig:"
echo ""
echo '   const siteConfig = {'
echo '     logo: null,'
echo '     title: "HEY, BLOG!",'
echo '   };'
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔐 Пароль по умолчанию: heyblog2025"
echo "   Смени его в src/context/AdminContext.tsx"
echo ""
echo "После правок:"
echo "  npm run sync"
echo "  npm run dev"
echo ""
