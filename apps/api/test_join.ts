import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userId = 'cd7355e1-078f-4727-a5c2-34c7ed6b78af';
  const campaign = await prisma.campaign.findFirst({
    where: { isActive: true },
  });

  if (!campaign) {
    console.log("No active campaign found");
    return;
  }
  
  console.log("Testing with Campaign:", campaign.id, campaign.title);

  // 1. Validate campaign exists and is active (Yes)
  
  // 2. Server-side window check
  const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const currentDay = nowIST.getDay();
  const currentHHMM = `${nowIST.getHours().toString().padStart(2, "0")}:${nowIST.getMinutes().toString().padStart(2, "0")}`;
  
  const isWithinWindow = (
    campaign.dayOfWeek === currentDay &&
    currentHHMM >= campaign.startTime &&
    currentHHMM < campaign.endTime
  );
  
  console.log("Window check:", {
    nowIST,
    currentDay,
    currentHHMM,
    campaignDay: campaign.dayOfWeek,
    campaignStartTime: campaign.startTime,
    campaignEndTime: campaign.endTime,
    isWithinWindow,
  });

  if (!isWithinWindow) {
    console.log("400: The consultation window is not currently open.");
    return;
  }

  // 3. Check wallet balance
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) {
    console.log("400: You need a wallet to join the queue.");
    return;
  }
  console.log("Wallet balance:", wallet.balance.toString());
  if (Number(wallet.balance) < 100) {
    console.log("400: Insufficient wallet balance.");
    return;
  }

  // 4. Check no existing WAITING/CALLING/IN_CALL entry
  const existingEntry = await prisma.queueEntry.findFirst({
    where: {
      userId,
      campaignId: campaign.id,
      status: { in: ["WAITING", "CALLING", "IN_CALL"] },
    },
  });
  if (existingEntry) {
    console.log("400: You already have an active queue entry for this campaign.");
    return;
  }

  console.log("Everything passes. QueueEntry creation would succeed.");
}

main().finally(() => prisma.$disconnect());
