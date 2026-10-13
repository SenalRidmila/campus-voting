import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing all Students from Database...');
  
  // Deletes all records in the User table (Students)
  const deletedUsers = await prisma.user.deleteMany({});
  
  console.log(`Successfully deleted ${deletedUsers.count} students!`);
  console.log('Societies, Positions, and Admin accounts were NOT affected.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
