import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create platform stats
  const platformStats = await prisma.platformStats.upsert({
    where: { date: new Date() },
    update: {},
    create: {
      date: new Date(),
      totalUsers: 0,
      verifiedUsers: 0,
      activeUsers: 0,
      totalNFTs: 0,
      totalMints: 0,
      totalSales: 0,
      totalFees: 0,
      platformFees: 0,
      creatorFees: 0,
      zrmTotalSupply: 1000000, // 1M ZRM initial supply
      zrmCirculating: 0,
      zrmTreasury: 1000000
    }
  })

  console.log('✅ Platform stats created:', platformStats)

  // Create demo user (platform owner)
  const demoUser = await prisma.user.upsert({
    where: { address: '0xe894a9E110ef27320Ae58F1E4A70ACfD07DE3705' },
    update: {},
    create: {
      address: '0xe894a9E110ef27320Ae58F1E4A70ACfD07DE3705',
      username: 'platform_owner',
      displayName: 'Platform Owner',
      bio: 'Zorium.fun platform owner',
      isVerified: true,
      zrmBalance: 100000, // 100K ZRM for platform owner
      isEarlyBird: true,
      earlyBirdNumber: 1
    }
  })

  console.log('✅ Demo user created:', demoUser)

  // Create demo collection
  const demoCollection = await prisma.collection.upsert({
    where: { id: 'demo-collection-id' },
    update: {},
    create: {
      id: 'demo-collection-id',
      name: 'Zorium Genesis',
      description: 'The first collection on Zorium.fun platform',
      image: 'https://via.placeholder.com/400x400?text=Zorium+Genesis',
      creatorId: demoUser.id,
      itemCount: 0,
      floorPrice: 0.01
    }
  })

  console.log('✅ Demo collection created:', demoCollection)

  // Create demo NFT
  const demoNFT = await prisma.nFT.upsert({
    where: { 
      contractAddress_tokenId: {
        contractAddress: '0x1234567890123456789012345678901234567890',
        tokenId: '1'
      }
    },
    update: {},
    create: {
      name: 'Zorium Genesis #1',
      description: 'The first NFT minted on Zorium.fun',
      image: 'https://via.placeholder.com/400x400?text=Zorium+%231',
      tokenId: '1',
      contractAddress: '0x1234567890123456789012345678901234567890',
      chainId: 8453, // Base
      creatorId: demoUser.id,
      ownerId: demoUser.id,
      collectionId: demoCollection.id,
      mintPrice: 0.01,
      maxSupply: 1,
      currentSupply: 1,
      hasCreatorMinted: true,
      viewCount: 100,
      likeCount: 10
    }
  })

  console.log('✅ Demo NFT created:', demoNFT)

  // Create early bird rewards for first 10 users
  for (let i = 1; i <= 10; i++) {
    const address = `0x${i.toString().padStart(40, '0')}`
    
    await prisma.earlyBirdReward.upsert({
      where: { userAddress: address },
      update: {},
      create: {
        userAddress: address,
        userNumber: i,
        amount: 10000,
        claimed: i === 1 // Only first user (platform owner) has claimed
      }
    })
  }

  console.log('✅ Early bird rewards created for first 10 users')

  console.log('🎉 Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })