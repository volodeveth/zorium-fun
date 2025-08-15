# IPFS Integration for Zorium.fun NFT Platform

## Overview

Ваша NFT платформа тепер повністю інтегрована з IPFS (InterPlanetary File System) для децентралізованого зберігання медіа та метаданих NFT. Це відповідає стандартам індустрії, які використовують всі основні NFT платформи.

## ✅ Що було реалізовано

### 1. IPFS Service (`src/services/ipfsService.ts`)
- **Завантаження файлів до IPFS** через Pinata API
- **Створення NFT метаданих** в стандартному форматі
- **Валідація IPFS URI** форматів
- **Перетворення IPFS URI** в HTTP URLs для перегляду
- **Fallback механізм** на локальне зберігання, якщо IPFS недоступний

### 2. Оновлений Upload Controller (`src/controllers/uploadController.ts`)
- **Новий endpoint** `/api/upload/nft-metadata` для повного NFT flow
- **Автоматичне завантаження** зображення та метаданих до IPFS
- **Валідація** всіх необхідних полів NFT
- **Підтримка attributes** для NFT властивостей

### 3. Smart Contract Validation (`contracts/ZoriumNFT.sol`)
- **IPFS URI валідація** на рівні контракту
- **Перевірка формату** `ipfs://` для всіх tokenURI
- **Захист від неправильних URI** форматів

### 4. Типи та конфігурація
- **TypeScript типи** для всіх IPFS операцій
- **Конфігурація через ENV** variables
- **Логування** всіх IPFS операцій

## 🛠 Як використовувати

### 1. Налаштування IPFS (Pinata)

Додайте до `.env` файлу:
```env
# IPFS Configuration
PINATA_API_KEY="your-pinata-api-key"
PINATA_SECRET_KEY="your-pinata-secret-key"
IPFS_GATEWAY="https://ipfs.io/ipfs/"
```

### 2. Завантаження простого файлу

```bash
POST /api/upload
{
  "file": "data:image/png;base64,iVBORw0KGgo...",
  "name": "my-image.png",
  "type": "image",
  "useIPFS": true
}
```

**Відповідь:**
```json
{
  "success": true,
  "file": {
    "filename": "user_timestamp_hash.png",
    "originalName": "my-image.png",
    "size": 12345,
    "mimeType": "image/png",
    "type": "image",
    "url": "https://ipfs.io/ipfs/QmXXXXXX...",
    "ipfsUri": "ipfs://QmXXXXXX...",
    "ipfsHash": "QmXXXXXX...",
    "storage": "ipfs"
  }
}
```

### 3. Завантаження NFT метаданих

```bash
POST /api/upload/nft-metadata
{
  "name": "My Awesome NFT",
  "description": "This is a unique digital artwork",
  "imageFile": "data:image/png;base64,iVBORw0KGgo...",
  "attributes": [
    {"trait_type": "Color", "value": "Blue"},
    {"trait_type": "Rarity", "value": "Legendary"}
  ],
  "collection": "My Collection",
  "external_url": "https://zorium.fun"
}
```

**Відповідь:**
```json
{
  "success": true,
  "metadata": {
    "name": "My Awesome NFT",
    "description": "This is a unique digital artwork",
    "creator": "0x1234...",
    "imageURI": "ipfs://QmImage123...",
    "metadataURI": "ipfs://QmMetadata456...",
    "imageUrl": "https://ipfs.io/ipfs/QmImage123...",
    "metadataUrl": "https://ipfs.io/ipfs/QmMetadata456...",
    "attributes": [...],
    "collection": "My Collection",
    "external_url": "https://zorium.fun"
  }
}
```

### 4. Mint NFT з IPFS метаданими

```javascript
// Frontend: використовуйте metadataURI з відповіді вище
const mintParams = {
  to: userAddress,
  tokenURI: "ipfs://QmMetadata456...", // з відповіді /nft-metadata
  isCreatorFirstMint: true,
  referrer: ethers.ZeroAddress,
  customPrice: 0
}

await nftContract.mint(mintParams, { value: 0 })
```

## 📋 NFT Metadata Standard

Метадані створюються в стандартному форматі OpenSea/ERC-721:

```json
{
  "name": "NFT Name",
  "description": "NFT Description",
  "image": "ipfs://QmImageHash...",
  "attributes": [
    {
      "trait_type": "Property Name",
      "value": "Property Value"
    }
  ],
  "creator": "0x...",
  "collection": "Collection Name",
  "external_url": "https://zorium.fun"
}
```

## 🔍 Валідація IPFS URI

Smart contract автоматично валідує всі `tokenURI`:

### ✅ Валідні формати:
- `ipfs://QmTest123456789abcdefghijklmnopqrstuvwxyz`
- `ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi`
- `ipfs://QmHash/metadata.json`
- `ipfs://QmHash?param=value`

### ❌ Невалідні формати:
- `https://example.com/metadata.json`
- `ipfs://` (порожній)
- `http://ipfs.io/ipfs/test`
- будь-які не-IPFS URI

## 🧪 Тестування

Запустіть тест IPFS інтеграції:

```bash
cd backend
npm run dev
# В іншому терміналі:
ts-node src/scripts/test-ipfs.ts
```

## 📊 Переваги IPFS

1. **Децентралізація**: Файли зберігаються в розподіленій мережі
2. **Іммутабельність**: IPFS хеші гарантують незмінність контенту
3. **Доступність**: Файли доступні через множину gateway
4. **Стандарт індустрії**: Використовується всіма основними NFT платформами
5. **Довгострокове зберігання**: Pinata забезпечує постійне зберігання

## 🔧 Troubleshooting

### Проблема: IPFS upload fails
**Рішення**: Перевірте PINATA_API_KEY та PINATA_SECRET_KEY

### Проблема: Smart contract rejects tokenURI
**Рішення**: Переконайтеся, що URI починається з `ipfs://`

### Проблема: Image не відображається
**Рішення**: Перевірте IPFS gateway або використайте інший (наприклад, `https://gateway.pinata.cloud/ipfs/`)

## 📞 API Endpoints

| Method | Endpoint | Опис |
|--------|----------|------|
| POST | `/api/upload` | Завантажити файл (з IPFS підтримкою) |
| POST | `/api/upload/nft-metadata` | Створити повні NFT метадані |

## 🎯 Готово до production!

Ваша платформа тепер:
- ✅ Зберігає всі NFT медіа в IPFS
- ✅ Створює стандартні метадані
- ✅ Валідує IPFS URI в smart contracts
- ✅ Підтримує fallback на локальне зберігання
- ✅ Готова до масштабування

Це повністю відповідає стандартам індустрії і забезпечує довгострокову доступність NFT контенту!