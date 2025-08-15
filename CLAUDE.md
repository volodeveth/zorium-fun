# CLAUDE.md - Zorium.fun NFT Platform

## Project Overview

Zorium.fun is a modern NFT platform built with a monolithic-modular architecture using microservices approach. The platform enables NFT creation, minting, and trading across multiple blockchain networks with integrated Zorium token features.

## Architecture

- **Backend:** Express.js + TypeScript API server
- **Frontend:** Next.js 14 with App Router
- **Smart Contracts:** Solidity with upgradeable architecture
- **Database:** PostgreSQL with Prisma ORM
- **Deployment:** Vercel for both frontend and backend

## Project Structure

```
zorium.fun/
├── backend/              # Express.js API server
│   ├── src/
│   │   ├── app.ts       # Main application entry point
│   │   ├── controllers/ # API route handlers
│   │   ├── middleware/  # Express middleware
│   │   ├── models/      # Database models
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic services
│   │   └── utils/       # Utility functions
│   ├── prisma/          # Database schema and migrations
│   └── tests/           # Backend tests
├── frontend/             # Next.js web application
│   ├── src/
│   │   ├── app/         # Next.js App Router pages
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utility libraries
│   │   └── types/       # TypeScript type definitions
│   └── public/          # Static assets
├── smart-contracts/     # Solidity contracts
│   ├── contracts/       # Smart contract source code
│   ├── scripts/         # Deployment scripts
│   └── test/           # Contract tests
└── docs/               # Documentation
```

## Key Technologies

### Backend Stack
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Prisma** - Database ORM
- **PostgreSQL** - Primary database
- **Redis** - Caching layer
- **JWT** - Authentication
- **ethers.js** - Blockchain interaction
- **Winston** - Logging
- **Nodemailer** - Email service

### Frontend Stack
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **wagmi** - Web3 React hooks
- **RainbowKit** - Wallet connection
- **Lucide React** - Icons
- **React Query** - Data fetching

### Smart Contracts
- **Solidity ^0.8.19** - Contract language
- **Hardhat** - Development framework
- **OpenZeppelin** - Security libraries
- **UUPS** - Upgradeable proxies
- **ERC-721/1155** - NFT standards

## Development Commands

### Backend
```bash
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run db:migrate   # Run database migrations
npm run db:generate  # Generate Prisma client
npm run lint         # Run ESLint
```

### Frontend
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Smart Contracts
```bash
cd smart-contracts
npm run compile      # Compile contracts
npm run test         # Run contract tests
npm run deploy       # Deploy to localhost
npm run deploy:base  # Deploy to Base network
npm run deploy:zora  # Deploy to Zora network
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
JWT_SECRET=your-jwt-secret
REDIS_URL=redis://...
SMTP_HOST=smtp.example.com
SMTP_USER=your-email
SMTP_PASS=your-password
PLATFORM_ADMIN_ADDRESS=0x...
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id
NEXT_PUBLIC_ALCHEMY_ID=your-alchemy-id
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

## Database Schema

Key models:
- **User** - User accounts and profiles
- **NFT** - Legacy ERC-721 NFTs
- **NFTToken** - ERC-1155 tokens (v2.0)
- **Collection** - NFT collections
- **Transaction** - Blockchain transactions
- **Listing** - Marketplace listings
- **Promotion** - NFT promotions
- **Notification** - User notifications

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user

### NFTs
- `GET /api/v1/nfts` - List NFTs
- `POST /api/v1/nfts` - Create NFT
- `GET /api/v1/nfts/:id` - Get NFT details
- `PUT /api/v1/nfts/:id` - Update NFT

### Collections
- `GET /api/v1/collections` - List collections
- `POST /api/v1/collections` - Create collection
- `GET /api/v1/collections/:id` - Get collection details

### Users
- `GET /api/v1/users/:address` - Get user profile
- `PUT /api/v1/users/:address` - Update user profile
- `GET /api/v1/users/:address/nfts` - Get user's NFTs

## Smart Contract Addresses

### Base Network (Chain ID: 8453)
- **Factory:** `0xF422E7F6DF90e7296813eE12Bd3eBc631aA8FFde`
- **Marketplace:** `0x8044F0C974A2F67f7C4F3B416B849a4B25b76C5E`

### Zora Network (Chain ID: 7777777)
- **Factory:** `0x72fD543e13450cb4D07E088c63D9596d6D084D29`
- **Marketplace:** `0x43968b11Fd35b1F8c44c1dE27C4054D198Ce366F`

### ZRM Token
- **Address:** `0x538D6F4fb9598dC74e15e6974049B109ae0AbC6a` (Zora)

## Key Features

### NFT Creation (v2.0)
- Factory pattern for collection creation
- ERC-1155 standard for gas efficiency
- Creator's free mint (first token)
- Custom pricing with countdown mechanism
- Automatic fee distribution

### Marketplace
- Buy/sell NFT listings
- Royalty distribution
- Platform fee collection
- Multi-network support

### Zorium Token (ZRM)
- Platform utility token
- Promotion payments
- Daily wheel rewards
- Admin allocation system

### User Features
- Email verification
- Social login (Twitter)
- Profile management
- Notification system
- Early bird rewards

## Testing

### Backend Tests
```bash
cd backend
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:email    # Test email service
```

### Frontend Tests
Currently no tests implemented. Recommended to add:
- Unit tests with Jest/Vitest
- Component tests with Testing Library
- E2E tests with Playwright

### Smart Contract Tests
```bash
cd smart-contracts
npm test              # Run contract tests
npx hardhat coverage # Test coverage
```

## Deployment

### Backend (Vercel)
```bash
cd backend
npm run deploy        # Deploy to production
npm run deploy:staging # Deploy to staging
```

### Frontend (Vercel)
```bash
cd frontend
npm run deploy        # Deploy to production
npm run deploy:staging # Deploy to staging
```

### Smart Contracts
```bash
cd smart-contracts
npm run deploy:base   # Deploy to Base
npm run deploy:zora   # Deploy to Zora
npm run verify        # Verify contracts
```

## Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow ESLint configuration
- Use Prettier for formatting
- Implement proper error handling

### Git Workflow
- Use feature branches
- Write descriptive commit messages
- Run tests before commits
- Use conventional commit format

### Security
- Never commit secrets
- Use environment variables
- Validate all inputs
- Implement rate limiting
- Use HTTPS in production

## Common Issues & Solutions

### Database Issues
```bash
# Reset database
npx prisma db push --force-reset
npx prisma db seed

# Generate client
npx prisma generate
```

### Web3 Connection Issues
- Check wallet connection
- Verify network configuration
- Ensure correct contract addresses
- Check gas prices

### Build Issues
- Clear node_modules and reinstall
- Check TypeScript errors
- Verify environment variables
- Update dependencies

## Useful Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [wagmi Documentation](https://wagmi.sh)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Hardhat Documentation](https://hardhat.org/docs)

## Contact & Support

For questions or issues:
1. Check existing documentation
2. Search through codebase
3. Review error logs
4. Test in development environment

---

*This file helps Claude understand the project structure and provides context for development tasks.*