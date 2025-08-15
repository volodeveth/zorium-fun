# 🔐 Security Setup Instructions

## ✅ Статус: Environment Variables налаштовані в Vercel

✅ **Backend Environment Variables** - Налаштовано  
✅ **Frontend Environment Variables** - Налаштовано  
✅ **Package.json** - Токени видалено  
✅ **Gitignore** - Оновлено для безпеки  
✅ **Env.example** - Створено шаблони  

## 🔒 Pre-commit Hook Setup (РЕКОМЕНДОВАНО)

Для запобігання майбутніх витоків секретів встановіть pre-commit hook:

### Windows:
```bash
copy scripts\pre-commit-hook.sh .git\hooks\pre-commit
```

### Linux/Mac:
```bash
cp scripts/pre-commit-hook.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

## 🚀 Deployment після налаштування

Тепер ви можете деплоїти без токенів в командах:

### Backend:
```bash
cd backend
npm run deploy
```

### Frontend:
```bash
cd frontend
npm run deploy
```

## ⚠️ ВАЖЛИВІ НАСТУПНІ КРОКИ:

### 1. Змініть паролі для додаткової безпеки:
- [ ] **Neon DB** - змініть пароль: https://console.neon.tech/
- [ ] **Gmail App Password** - створіть новий: https://myaccount.google.com/apppasswords
- [ ] **Pinata API keys** - регенеруйте: https://app.pinata.cloud/keys
- [ ] **Vercel Token** - створіть новий: https://vercel.com/account/tokens

### 2. Налаштуйте реальні API ключі:
- [ ] **WalletConnect Project ID**: https://cloud.walletconnect.com/
- [ ] **Alchemy API Key**: https://dashboard.alchemy.com/

### 3. Оновіть Environment Variables в Vercel:
Після отримання нових ключів оновіть їх в Vercel Dashboard.

## 🔍 Що перевіряє Pre-commit Hook:

- ❌ Файли .env (крім .env.example)
- ❌ Hardcoded паролі, токени, ключі
- ❌ Database URLs та connection strings
- ❌ SMTP паролі
- ❌ API ключі в тексті
- ❌ Файли з іменами *api*.txt, *secret*.txt тощо
- ❌ Відомі токени проекту

## 📋 Локальна розробка

Для локальної розробки створіть файли:

### `backend/.env`:
```env
DATABASE_URL="your-db-url"
JWT_SECRET="your-dev-jwt-secret"
PLATFORM_OWNER_ADDRESS="0xe894a9E110ef27320Ae58F1E4A70ACfD07DE3705"
FRONTEND_URL="http://localhost:3000"
NODE_ENV="development"
PORT=3001
```

### `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_FRONTEND_URL="http://localhost:3000"
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your-project-id"
NEXT_PUBLIC_ALCHEMY_ID="your-alchemy-id"
```

## 🚨 У разі нового витоку:

1. Негайно змініть скомпрометовані ключі
2. Запустіть: `git filter-branch --index-filter 'git rm --cached --ignore-unmatch path/to/file' HEAD`
3. Force push: `git push --force-with-lease`
4. Повідомте команду про інцидент

---

**✨ Проект тепер безпечний для production використання!**