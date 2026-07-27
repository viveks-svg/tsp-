import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.update({
    where: { id: 'cd7355e1-078f-4727-a5c2-34c7ed6b78af' },
    data: { role: 'ADMIN' },
  });
  console.log('Updated user role to ADMIN:', user.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
