const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: "postgresql://postgres:Prvind123@localhost:5432/tsp_dev?schema=public" });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedPromo() {
  await prisma.promoEvent.create({
    data: {
      title: 'Vastu Masterclass',
      description: 'Join our upcoming Vastu Masterclass and learn how to optimize your workspace for prosperity and flow.',
      actionText: 'Register Now',
      actionUrl: '/book?service=vastu-masterclass',
      imageUrl: ''
    }
  });
  console.log("Promo seeded successfully.");
  await prisma.$disconnect();
  pool.end();
}

seedPromo().catch(console.error);
