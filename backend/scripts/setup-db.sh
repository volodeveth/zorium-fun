#!/bin/bash

echo "🗄️  Setting up database..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📄 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your actual database credentials"
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🚀 Running database migrations..."
npx prisma migrate dev --name init

# Seed database (optional)
if [ -f "src/scripts/seed.ts" ]; then
    echo "🌱 Seeding database..."
    npm run db:seed
fi

echo "✅ Database setup complete!"
echo "💡 You can view your database with: npx prisma studio"