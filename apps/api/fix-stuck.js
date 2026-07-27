const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: "postgresql://postgres:Prvind123@localhost:5432/tsp_dev?schema=public" });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function fixStuck() {
  const consultationId = "fc39ee6a-2c48-450d-b94e-be7fb6dbe8c9";

  console.log(`Force closing consultation: ${consultationId}`);

  await prisma.$transaction(async (tx) => {
    // 1. Close consultation
    await tx.consultation.update({
      where: { id: consultationId },
      data: { status: "COMPLETED" },
    });

    // 2. Mark queue entry as COMPLETED
    await tx.queueEntry.updateMany({
      where: { consultationId, status: "IN_CALL" },
      data: { status: "COMPLETED" },
    });
  });

  console.log("Stuck consultation fixed successfully.");
  
  await prisma.$disconnect();
  pool.end();
}

fixStuck().catch((e) => {
  console.error('Error fixing stuck consultation:', e);
  process.exit(1);
});
