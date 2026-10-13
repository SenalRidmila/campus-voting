const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.voteRecord.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.position.deleteMany();
  await prisma.society.deleteMany();
  await prisma.user.deleteMany();
  await prisma.admin.deleteMany();
  console.log('Database fully cleared');
}
main().finally(() => prisma.$disconnect());
