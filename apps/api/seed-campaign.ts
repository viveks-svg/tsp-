import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  // Clear existing to avoid confusion
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
  console.log('Campaign seeded successfully');
}
main().catch(console.error).finally(() => prisma.$disconnect());
