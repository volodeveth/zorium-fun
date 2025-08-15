# Database Setup Instructions

## 1. Create Vercel Postgres Database

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to your project: `volodeveths-projects/backend`
3. Go to Storage tab
4. Click "Create Database"
5. Choose "Postgres"
6. Name: `zorium-db`
7. Region: Choose closest to your users
8. Click "Create"

## 2. Get Database Connection String

After creating the database:
1. Go to the database page
2. Click on "Connect" 
3. Copy the `DATABASE_URL` connection string
4. It will look like: `postgres://username:password@host:5432/dbname`

## 3. Add Environment Variables

Add these environment variables to your Vercel project:

```bash
DATABASE_URL="postgres://username:password@host:5432/dbname"
DIRECT_URL="postgres://username:password@host:5432/dbname"
```

## 4. Update Prisma Schema

Make sure your `prisma/schema.prisma` has:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

## 5. Push Schema to Database

Run migrations:
```bash
npx prisma db push
```

## 6. Generate Prisma Client

```bash
npx prisma generate
```

## Commands to run after database setup:

1. `npx vercel env pull .env.local --token {TOKEN}`
2. `npx prisma db push`
3. `npx prisma generate`
4. Deploy updated app with database connection