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
      actionUrl: '/solutions/business-vastu',
      imageUrl: 'https://images.unsplash.com/photo-1598462002773-19597c55c707?q=80&w=600&auto=format&fit=crop'
    }
  });
  console.log("Promo seeded successfully.");
  await prisma.$disconnect();
  pool.end();
}

seedPromo().catch(console.error);
