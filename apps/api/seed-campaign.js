const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: "postgresql://postgres:Prvind123@localhost:5432/tsp_dev?schema=public" });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedCampaign() {
  await prisma.campaign.deleteMany();
  await prisma.campaign.create({
    data: {
      title: 'Cosmic Wisdom 2026',
      bannerText: 'Unlock the secrets of the stars with our premium astrologers!',
      ratePerMinute: 19.99,
      dayOfWeek: new Date().getDay(),
      startTime: '00:00',
      endTime: '23:59',
      isActive: true,
    }
  });
  console.log("Campaign seeded successfully.");
  await prisma.$disconnect();
  pool.end();
}

seedCampaign().catch(console.error);
