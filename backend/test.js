const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.create({
    data: {
      fullName: 'Test User',
      studentId: '12345',
      faculty: 'FOC',
      email: 'testuser@yopmail.com',
      isVerified: true,
      walletAddress: '0x123',
    }
  });
  console.log('Created user', user);
}
main().catch(console.error).finally(() => prisma.$disconnect());
